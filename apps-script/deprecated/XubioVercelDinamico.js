// @ts-nocheck
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp, DriveApp, Utilities, Session */

/**
 * XUBIO FACTURADOR VERCEL - Versión Dinámica con Logs Detallados
 */
// Nota GAS: todos los .gs comparten scope global. Evitamos "already been declared"
// usando variables globales con inicialización idempotente.
const VERCEL_URL_DINAMICO =
  (typeof VERCEL_URL_DINAMICO === 'undefined')
    ? 'https://xubio-facturacion-online.vercel.app'
    : VERCEL_URL_DINAMICO;

const DEBUG_LOG_CHUNK_SIZE =
  (typeof DEBUG_LOG_CHUNK_SIZE === 'undefined')
    ? 3500 // evita truncado en Logger
    : DEBUG_LOG_CHUNK_SIZE;

const DEBUG_PERSIST_TO_DRIVE =
  (typeof DEBUG_PERSIST_TO_DRIVE === 'undefined')
    ? true // guarda el JSON completo y loguea el link
    : DEBUG_PERSIST_TO_DRIVE;

// Ojo: esto puede guardar datos sensibles (cliente/producto/precios).
// Activar sólo para diagnóstico.
const DEBUG_PERSIST_REQUEST_TO_DRIVE =
  (typeof DEBUG_PERSIST_REQUEST_TO_DRIVE === 'undefined')
    ? true
    : DEBUG_PERSIST_REQUEST_TO_DRIVE;

/**
 * Genera un externalId numérico (string) de N dígitos.
 * Nota: es aleatorio, útil para pruebas. Para producción conviene que sea estable (ej RowKey).
 */
function generateExternalIdDigits(length) {
  const n = length || 12;
  let out = '';
  for (let i = 0; i < n; i++) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

function fetchJsonVercel(url, options) {
  const res = UrlFetchApp.fetch(url, options || { muteHttpExceptions: true });
  const code = res.getResponseCode();
  const text = res.getContentText();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    logLarge('❌ Respuesta NO-JSON', text);
    throw new Error('Respuesta no-JSON (HTTP ' + code + ')');
  }
  if (code < 200 || code >= 300) {
    // No asumimos shape; devolvemos el body para diagnóstico.
    throw new Error('HTTP ' + code + ': ' + text);
  }
  return json;
}

/**
 * Obtiene el objeto provincia desde el cliente en Xubio (vía Vercel proxy).
 * Esto es necesario porque /facturar pide `provincia` en el body.
 */
function obtenerProvinciaDeCliente(clienteId) {
  const url = VERCEL_URL_DINAMICO + '/api/proxy?path=/clienteBean/' + encodeURIComponent(String(clienteId));
  const json = fetchJsonVercel(url, { method: 'get', muteHttpExceptions: true });
  if (!json || !json.provincia) {
    throw new Error('No se pudo obtener provincia del clienteId=' + clienteId);
  }
  return json.provincia;
}

/**
 * Busca un centro de costo (vía Vercel proxy) y devuelve un selector {ID,id,nombre,codigo}.
 * Si no se pasa filtro, devuelve el primero activo.
 */
function obtenerCentroDeCostoSelector(filtroNombreOCodigo) {
  const url = VERCEL_URL_DINAMICO + '/api/proxy?path=/centroDeCostoBean&activo=1';
  const json = fetchJsonVercel(url, { method: 'get', muteHttpExceptions: true });

  const list = Array.isArray(json) ? json : (json && (json.data || json.items)) || [];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('No hay centros de costo activos (centroDeCostoBean)');
  }

  const needle = (filtroNombreOCodigo || '').toString().trim().toLowerCase();
  let found = null;
  if (needle) {
    found = list.find(x =>
      (x && x.nombre && String(x.nombre).toLowerCase().includes(needle)) ||
      (x && x.codigo && String(x.codigo).toLowerCase().includes(needle))
    ) || null;
  }

  const cc = found || list[0];
  // Normalizamos a selector
  const id = cc.ID || cc.id || cc.centroDeCostoId || cc.centrodecostoid;
  return {
    ID: parseInt(id, 10),
    id: parseInt(id, 10),
    nombre: cc.nombre || '',
    codigo: cc.codigo || ''
  };
}

function logLarge(label, data, chunkSize) {
  const size = chunkSize || DEBUG_LOG_CHUNK_SIZE;
  const text = (typeof data === 'string') ? data : JSON.stringify(data, null, 2);

  if (!text) {
    Logger.log(label + ': (vacío)');
    return;
  }

  if (text.length <= size) {
    Logger.log(label + ': ' + text);
    return;
  }

  Logger.log(label + ' (len=' + text.length + ', chunk=' + size + ')');
  for (let i = 0; i < text.length; i += size) {
    Logger.log(text.substring(i, i + size));
  }
}

function persistJsonToDrive(filenamePrefix, data) {
  try {
    const tz = (Session && Session.getScriptTimeZone) ? Session.getScriptTimeZone() : 'GMT';
    const ts = Utilities.formatDate(new Date(), tz, 'yyyyMMdd-HHmmss');
    const filename = filenamePrefix + '-' + ts + '.json';
    const content = (typeof data === 'string') ? data : JSON.stringify(data, null, 2);
    // Sin MimeType para evitar problemas de tipado/entorno.
    const file = DriveApp.createFile(filename, content);
    Logger.log('🗂️ Debug guardado en Drive: ' + file.getUrl());
    return file.getId();
  } catch (e) {
    Logger.log('⚠️ No se pudo guardar debug en Drive: ' + e.toString());
    return null;
  }
}

function crearFacturaXubio(params) {
  const url = VERCEL_URL_DINAMICO + '/api/crear-factura';
  const payloadText = JSON.stringify(params);
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payloadText,
    muteHttpExceptions: true // Permite capturar errores sin que el script se detenga
  };

  Logger.log('📤 Enviando factura a Vercel...');
  
  try {
    if (DEBUG_PERSIST_REQUEST_TO_DRIVE) {
      persistJsonToDrive('xubio-request-crear-factura', { url: url, payload: payloadText });
    }

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      Logger.log('❌ Respuesta NO-JSON desde Vercel (Código ' + statusCode + ')');
      // Importante: el body suele venir enorme (HTML/stack). Lo logueamos en chunks.
      if (DEBUG_PERSIST_TO_DRIVE) {
        persistJsonToDrive('vercel-response-nonjson', { statusCode: statusCode, body: responseText });
      }
      logLarge('📦 Body', responseText);
      throw new Error('Respuesta no-JSON desde Vercel (Código ' + statusCode + '): ' + parseErr.toString());
    }
    
    if (result.success) {
      Logger.log('✅ FACTURA CREADA OK');
      Logger.log('🆔 ID Transacción: ' + result.data.transaccionId);
      Logger.log('📄 Número: ' + result.data.numeroDocumento);
      Logger.log('🔗 Ver en Xubio: ' + result.data.pdfUrl);
      return result.data;
    } else {
      Logger.log('❌ ERROR EN VERCEL (Código ' + statusCode + ')');
      Logger.log('Mensaje: ' + (result.error || 'Sin mensaje de error'));
      if (result.debug) {
        if (DEBUG_PERSIST_TO_DRIVE) {
          persistJsonToDrive('xubio-debug-crear-factura', result.debug);
        }
        logLarge('🔍 DEBUG XUBIO', result.debug);
      }
      throw new Error(result.error);
    }
  } catch (e) {
    Logger.log('❌ FALLO CRÍTICO: ' + e.toString());
    throw e;
  }
}

/**
 * FACTURAR (Xubio /API/1.1/facturar) vía Vercel proxy (/api/proxy?path=/facturar).
 *
 * Importante: esto arma un payload "mínimo para prueba" siguiendo tu pedido:
 * - externalId: aleatorio numérico
 * - vendedor: vacío
 * - cantComprobantes*: 0
 * - mailEstado: "No Enviado"
 * - nombre: vacío
 *
 * Para producción, lo recomendable es setear `externalId` estable y `vendedor` real.
 */
function facturarXubio(params) {
  const {
    clienteId,
    cantidad = 1,
    productoId = 2751338,
    puntoVentaId = 212819,
    listaDePrecioId = 15386,
    centroDeCostoFiltro = '',
    precioUnitario = 490,
    descripcion = ''
  } = params || {};

  if (!clienteId) throw new Error('Falta clienteId');

  const externalId = generateExternalIdDigits(12);
  const fechaISO = new Date().toISOString().split('T')[0];

  // Para /facturar necesitamos `provincia` (la obtenemos del cliente).
  const provincia = obtenerProvinciaDeCliente(clienteId);

  // Centro de costo requerido por item (según swagger). Para pruebas: tomamos uno activo.
  const centroDeCosto = obtenerCentroDeCostoSelector(centroDeCostoFiltro);

  // Cálculos simples (mismo criterio que el endpoint actual de prueba)
  const neto = Number((parseFloat(precioUnitario) * parseFloat(cantidad)).toFixed(2));
  const iva = Number((neto * 0.21).toFixed(2));
  const total = Number((neto + iva).toFixed(2));

  const item = {
    producto: { ID: parseInt(productoId, 10), id: parseInt(productoId, 10) },
    centroDeCosto: centroDeCosto,
    deposito: { ID: -2, id: -2, nombre: 'Depósito Universal', codigo: 'DEPOSITO_UNIVERSAL' },
    descripcion: descripcion || 'Item sin descripción',
    cantidad: parseFloat(cantidad),
    precio: parseFloat(precioUnitario),
    importe: neto,
    total: total,
    montoExento: 0,
    porcentajeDescuento: 0,
    precioconivaincluido: 0
  };

  const payload = {
    // Requeridos (swagger)
    externalId: externalId,
    tipo: 1,
    cliente: { ID: parseInt(clienteId, 10), id: parseInt(clienteId, 10), nombre: '' },
    fecha: fechaISO,
    fechaVto: fechaISO,
    puntoVenta: { ID: parseInt(puntoVentaId, 10), id: parseInt(puntoVentaId, 10), nombre: '', codigo: '' },
    numeroDocumento: '',
    condicionDePago: 1,
    deposito: { ID: -2, id: -2, nombre: 'Depósito Universal', codigo: 'DEPOSITO_UNIVERSAL' },
    cotizacion: 1,
    provincia: provincia,
    cotizacionListaDePrecio: 1,
    listaDePrecio: { ID: parseInt(listaDePrecioId, 10), id: parseInt(listaDePrecioId, 10), nombre: '', codigo: '' },
    vendedor: { vendedorId: 0, nombre: '', apellido: '' }, // “vacío” para prueba
    porcentajeComision: 0,
    mailEstado: 'No Enviado',
    descripcion: '',
    cbuinformada: false,
    facturaNoExportacion: false,
    transaccionProductoItems: [item],
    transaccionPercepcionItems: [],
    transaccionCobranzaItems: [],
    cantComprobantesEmitidos: 0,
    cantComprobantesCancelados: 0,
    nombre: ''
  };

  const url = VERCEL_URL_DINAMICO + '/api/proxy?path=/facturar';
  const payloadText = JSON.stringify(payload);

  Logger.log('📤 Facturar vía /facturar (proxy)');
  Logger.log('externalId=' + externalId);

  if (DEBUG_PERSIST_REQUEST_TO_DRIVE) {
    persistJsonToDrive('xubio-request-facturar', { url: url, payload: payloadText });
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payloadText,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  // Puede devolver HTML/JSON. Guardamos/logueamos como en crearFacturaXubio.
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    Logger.log('❌ Respuesta NO-JSON desde /facturar (Código ' + statusCode + ')');
    if (DEBUG_PERSIST_TO_DRIVE) {
      persistJsonToDrive('xubio-response-facturar-nonjson', { statusCode: statusCode, body: responseText });
    }
    logLarge('📦 Body', responseText);
    throw new Error('Respuesta no-JSON desde /facturar (Código ' + statusCode + ')');
  }

  if (statusCode < 200 || statusCode >= 300) {
    Logger.log('❌ Error HTTP en /facturar: ' + statusCode);
    if (DEBUG_PERSIST_TO_DRIVE) {
      persistJsonToDrive('xubio-response-facturar-error', result);
    }
    logLarge('🔍 Error /facturar', result);
    throw new Error('Error HTTP /facturar ' + statusCode);
  }

  Logger.log('✅ /facturar respondió OK');
  logLarge('📦 Respuesta /facturar', result);
  return result;
}

function testFacturar() {
  const misDatos = {
    clienteId: '8157173',
    cantidad: 1,
    productoId: '2751338',
    puntoVentaId: '212819',
    listaDePrecioId: '15386',
    precioUnitario: 490,
    descripcion: 'TEST /facturar - diagnóstico',
    centroDeCostoFiltro: '' // opcional: nombre/código para elegir CC
  };

  facturarXubio(misDatos);
}

function testFactura() {
  const misDatos = {
    clienteId: "8157173",       // 2MCAMPO
    cantidad: 1,
    productoId: "2751338",     // CONECTIVIDAD ANUAL
    puntoVentaId: "212819",    // Corvusweb srl
    listaDePrecioId: "15386",
    // centroDeCostoId: "57329", // Descomentar si quieres probar con centro de costo
    precioUnitario: 490,
    descripcion: "TEST INTEGRAL - INGENIERÍA INVERSA"
  };
  
  crearFacturaXubio(misDatos);
}
