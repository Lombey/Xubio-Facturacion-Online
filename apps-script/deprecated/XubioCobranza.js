/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp, Utilities, PropertiesService */

/**
 * Xubio Cobranzas - Apps Script
 *
 * Sistema de cobranzas automáticas usando XML Legacy Mode
 * Basado en gold standard capturado desde UI de Xubio
 *
 * FLUJO:
 * 1. Obtener factura vía REST API
 * 2. Construir XML de cobranza (modo legacy)
 * 3. Enviar a /NXV/DF_submit con OAuth
 *
 * USO:
 * testCobrarFactura(67835721) // ID de factura a cobrar
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

/**
 * Credenciales OAuth de Xubio
 * IMPORTANTE: Las mismas que se usan para facturas
 */
const XUBIO_CLIENT_ID = '1685779410539838751521267077892091233473602730579752424794270565737755373827941053168577142596237900';
const XUBIO_CLIENT_SECRET = 'EEDdGsu+sN802iUKXWx8gSoY3eVPh8C/OjiSqfx9X/3XQj/F3yt-dCkSkq/x4beUGU4maI7l_64XYGuDxC8yFN0xB7XTbZAsMYJPQi-lOEEDdGsu+sN802iUKXWx8gSoY';

/**
 * Configuración fija de la empresa
 */
const CONFIG_COBRANZA = {
  empresaId: 234054,
  empresaNombre: 'corvusweb srl',
  circuitoContableId: -2,
  circuitoContableNombre: 'default',
  talonarioId: 8410592
};

/**
 * Tipos de cuenta para instrumentos de cobro
 */
const TIPO_CUENTA = {
  BANCO: {
    cuentaTipo: 2,
    cuentaId: -14,
    cuentaNombre: 'Banco'
  },
  VALORES: {
    cuentaTipo: 3,
    cuentaId: -2,
    cuentaNombre: 'Valores a Depositar'
  }
};

/**
 * Monedas (IDs de sistema Xubio)
 */
const MONEDA = {
  ARS: { id: -2, nombre: 'Pesos Argentinos' },
  USD: { id: -3, nombre: 'Dólares' }
};

// ==========================================
// AUTENTICACIÓN OAUTH
// ==========================================

/**
 * Obtiene un token OAuth de Xubio
 * Usa cache para evitar requests innecesarios (token válido por 1 hora)
 */
function obtenerTokenXubioCobranza() {
  const cache = PropertiesService.getScriptProperties();
  const cachedToken = cache.getProperty('XUBIO_ACCESS_TOKEN');
  const tokenExpiry = cache.getProperty('XUBIO_TOKEN_EXPIRY');

  // Si hay token en cache y no expiró, usarlo
  if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
    Logger.log('🔑 Usando token OAuth en cache');
    return cachedToken;
  }

  Logger.log('🔑 Obteniendo nuevo token OAuth de Xubio...');

  // Codificar credenciales en Base64
  const credentials = XUBIO_CLIENT_ID + ':' + XUBIO_CLIENT_SECRET;
  const basicAuth = Utilities.base64Encode(credentials);

  const url = 'https://xubio.com:443/API/1.1/TokenEndpoint';

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    payload: 'grant_type=client_credentials',
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    Logger.log('❌ Error al obtener token OAuth: ' + responseText);
    throw new Error('Error de autenticación OAuth: ' + responseCode);
  }

  const tokenData = JSON.parse(responseText);
  const accessToken = tokenData.access_token || tokenData.token;

  if (!accessToken) {
    throw new Error('Token OAuth no encontrado en respuesta');
  }

  // Cachear token por 1 hora (con margen de seguridad de 5 min)
  const expiryTime = new Date().getTime() + (55 * 60 * 1000);
  cache.setProperty('XUBIO_ACCESS_TOKEN', accessToken);
  cache.setProperty('XUBIO_TOKEN_EXPIRY', expiryTime.toString());

  Logger.log('✅ Token OAuth obtenido y cacheado');
  return accessToken;
}

// ==========================================
// OBTENER FACTURA (REST API)
// ==========================================

/**
 * Obtiene una factura completa vía REST API
 * Necesitamos: cliente, moneda, cotización, total, itemId
 */
function obtenerFacturaXubio(facturaId, token) {
  const url = 'https://xubio.com/API/1.1/comprobanteVentaBean/' + facturaId;

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  Logger.log('📥 Obteniendo factura ID: ' + facturaId);

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    Logger.log('❌ Error al obtener factura: ' + responseText);
    throw new Error('Error al obtener factura: HTTP ' + responseCode);
  }

  const factura = JSON.parse(responseText);

  // DEBUG: Loguear estructura completa de la factura
  Logger.log('🔍 DEBUG - Estructura de factura retornada:');
  const facturaStr = JSON.stringify(factura, null, 2);
  // Loguear en chunks de 2000 caracteres para evitar truncado
  for (let i = 0; i < facturaStr.length; i += 2000) {
    Logger.log(facturaStr.substring(i, i + 2000));
  }

  // Validar que tiene los datos necesarios
  // IMPORTANTE: La API retorna 'importetotal' (minúscula), no 'total'
  if (!factura.cliente || !factura.importetotal) {
    Logger.log('⚠️ Campos disponibles en factura: ' + Object.keys(factura).join(', '));
    throw new Error('Factura incompleta: falta cliente o importetotal');
  }

  Logger.log('✅ Factura obtenida: ' + factura.numeroDocumento);
  Logger.log('   Cliente: ' + factura.cliente.nombre);
  Logger.log('   Total: ' + factura.importetotal);
  Logger.log('   Moneda: ' + (factura.moneda ? factura.moneda.nombre : 'N/A'));

  return factura;
}

// ==========================================
// CONSTRUCCIÓN DE XML DE COBRANZA
// ==========================================

/**
 * Construye el XML de cobranza basado en gold standard
 *
 * @param {Object} factura - Factura obtenida de Xubio REST API
 * @param {Object} config - Configuración de la cobranza
 * @param {string} config.tipoCuenta - 'BANCO' o 'VALORES'
 * @param {string} config.numCheque - Número de cheque (solo para VALORES)
 * @param {string} config.fechaVtoCheque - Fecha vencimiento cheque (solo para VALORES)
 * @param {number} config.bancoId - ID del banco (solo para VALORES)
 * @param {string} config.bancoNombre - Nombre del banco (solo para VALORES)
 * @returns {string} XML completo para enviar a /NXV/DF_submit
 */
function construirXMLCobranza(factura, config) {
  config = config || {};
  const tipoCuenta = config.tipoCuenta || 'BANCO';

  // Datos de la cuenta según tipo
  const cuentaConfig = TIPO_CUENTA[tipoCuenta];
  if (!cuentaConfig) {
    throw new Error('Tipo de cuenta inválido: ' + tipoCuenta);
  }

  // Fecha actual
  const ahora = new Date();
  const fechaISO = Utilities.formatDate(ahora, 'GMT-3', 'yyyy-MM-dd HH:mm');
  const fechaCorta = Utilities.formatDate(ahora, 'GMT-3', 'yyyy-MM-dd 00:00');

  // Extraer datos de la factura
  const clienteId = factura.cliente.ID || factura.cliente.id || factura.cliente.cliente_id;
  const clienteNombre = factura.cliente.nombre || '';
  const monedaFactura = factura.moneda || MONEDA.ARS;
  const cotizacion = factura.cotizacion || 1;
  // IMPORTANTE: La API retorna 'importetotal' (minúscula), no 'total'
  const total = factura.importetotal || 0;

  // Calcular importes
  // - Si la factura es en USD, el importe en moneda de transacción es en USD
  // - El importe principal siempre es en ARS (moneda base del sistema)
  const esMonedaExtranjera = monedaFactura.id === MONEDA.USD.id;
  const importeMonTransaccion = esMonedaExtranjera ? total : (total / cotizacion);
  const importeMonPrincipal = esMonedaExtranjera ? (total * cotizacion) : total;

  // Número de recibo (lo genera Xubio automáticamente si se deja vacío o con formato correcto)
  const numeroRecibo = 'C-0001-00001543'; // Xubio lo auto-incrementa

  // Item ID de la factura (necesario para TransaccionTesoreriaCtaCteItems)
  // En la API REST, los items vienen en transaccionProductoItems
  const itemId = factura.transaccionProductoItems && factura.transaccionProductoItems.length > 0
    ? (factura.transaccionProductoItems[0].transaccionCVItemId || factura.transaccionProductoItems[0].ID || 0)
    : 0;

  // Datos de cheque (solo si es VALORES)
  // IMPORTANTE: El orden EXACTO es: M_Banco, Descripcion, M_NumeroCheque, FechaVto
  // SIN saltos de línea ni espacios extra (sistemas legacy son sensibles al formato)
  const bancoId = tipoCuenta === 'VALORES' ? (config.bancoId || '') : '';
  const bancoNombre = tipoCuenta === 'VALORES' ? (config.bancoNombre || '') : '';
  const numCheque = tipoCuenta === 'VALORES' ? (config.numCheque || '') : '';
  const fechaVtoCheque = tipoCuenta === 'VALORES' ? (config.fechaVtoCheque || fechaCorta) : '';

  // Construir XML completo
  const xml = `<df><config><javaClass value="app.nexivia.ui.transaccion.form.CobranzaNXVForm"/><lightMode value="0"/><userDataValues><userDataValue name="auditID"><![CDATA[-1]]></userDataValue><userDataValue name="isTransaction"><![CDATA[true]]></userDataValue><userDataValue name="NoProponerAplicaciones"><![CDATA[1]]></userDataValue><userDataValue name="standardXml"><![CDATA[claseVO=CobranzaARNXVVO|docID=228]]></userDataValue><userDataValue name="titulo"><![CDATA[Nuevo - ${clienteNombre} - Cobranza]]></userDataValue><userDataValue name="PonerReadOnly"><![CDATA[1]]></userDataValue><userDataValue name="auditClass"><![CDATA[app.nexivia.transacciones.tesoreria.cobranzas.model.CobranzaNXVVO]]></userDataValue><userDataValue name="EsLPG"><![CDATA[false]]></userDataValue><userDataValue name="v_Cobranza_Aplicada"><![CDATA[false]]></userDataValue><userDataValue name="v_Transaccion_Conciliada"><![CDATA[false]]></userDataValue><userDataValue name="TransaccionSubTipoID"><![CDATA[228]]></userDataValue><userDataValue name="utilizaCotizacionOrigen"><![CDATA[true]]></userDataValue><userDataValue name="vo"><![CDATA[CobranzaARNXVVO]]></userDataValue><userDataValue name="action"><![CDATA[save]]></userDataValue></userDataValues></config><dataset><data><pk value="-1"/><EmpresaID type="C" id="${CONFIG_COBRANZA.empresaId}" value="${CONFIG_COBRANZA.empresaNombre}"/><ComprobanteElectronicomxID type="C" id="0" value=""/><M_IdsExtractos value=""/><M_Cuentaid value="" type="LNG"/><M_EstadoFK type="C" id="0" value=""/><M_EstadoID value=""/><OrganizacionID type="C" id="${clienteId}" value="${clienteNombre}"/><NumeroDocumento value="${numeroRecibo}"/><Fecha type="date" value="${fechaCorta}"/><FacturacionTenantID type="C" id="0" value=""/><MostrarOpciones value="0"/><OrganizacionSucursalItemID type="C" id="0" value=""/><MonedaID type="C" id="${monedaFactura.id}" value="${monedaFactura.nombre}"/><Cotizacion value="${cotizacion}" type="DEC"/><leyendaCotizacion value=""/><UtilizaMonedaExtranjera value="${esMonedaExtranjera ? '1' : '0'}"/><NumeroInterno value="0" type="LNG"/><Descripcion type="cdata"><![CDATA[]]></Descripcion><CircuitoContableID type="C" id="${CONFIG_COBRANZA.circuitoContableId}" value="${CONFIG_COBRANZA.circuitoContableNombre}"/><TransaccionTesoreriaIngresoItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID type="cdata"/><AsientoItemID type="cdata"/><M_CuentaTipo type="C" id="${cuentaConfig.cuentaTipo}" value="${cuentaConfig.cuentaNombre}"/><CuentaID type="C" id="${cuentaConfig.cuentaId}" value="${cuentaConfig.cuentaNombre}"/><MonedaIDTransaccion type="C" id="${MONEDA.ARS.id}" value="${MONEDA.ARS.nombre}"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteMonTransaccion value="${importeMonPrincipal.toFixed(2)}" type="DEC"/><ImporteMonPrincipal value="${importeMonPrincipal.toFixed(2)}"/><M_Banco type="C" id="${bancoId}" value="${bancoNombre}"/><Descripcion value=""/><M_NumeroCheque value="${numCheque}"/><FechaVto type="date" value="${fechaVtoCheque}"/><DebeHaber value="1" type="LNG"/><operacionbancariaid type="C" id="" value=""/><control1 value=""/><importemonsecundaria value=""/><organizacionid type="C" id="" value=""/><productoid type="C" id="" value=""/><itemid value=""/><centrodecostoid type="C" id="" value=""/><documentofisicoid type="C" id="" value=""/><importetotal value=""/><importecanceladomontransaccion value=""/><estadoiddocumentofisico type="C" id="" value=""/><itemtipo value="0"/><importecanceladomonprincipal value=""/></row></TransaccionTesoreriaIngresoItems><TransaccionTesoreriaEgresoItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><CuentaID type="C" id="0" value=""/><Descripcion value=""/><MonedaIDTransaccion type="C" id="${MONEDA.ARS.id}" value="${MONEDA.ARS.nombre}"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteMonTransaccion value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><FechaVto type="date" value=""/><DebeHaber value="-1" type="LNG"/></row></TransaccionTesoreriaEgresoItems><TransaccionTesoreriaCtaCteItems type="D" count="1"><row><pk value="0"/><TransaccionID type="cdata"/><M_ItemIDOrigen value="${itemId}"/><M_TransaccionIDOrigen value="${factura.transaccionid || factura.ID}"/><M_CotizacionItemOrigen value=""/><AsientoItemID type="cdata"/><CuentaID type="C" id="-3" value="Deudores por Venta"/><MonedaIDTransaccion type="C" id="${monedaFactura.id}" value="${monedaFactura.nombre}"/><CotizacionMonTransaccion value="${cotizacion.toFixed(6)}"/><ImporteMonTransaccion value="${importeMonTransaccion.toFixed(2)}"/><ImporteMonPrincipal value="${importeMonPrincipal.toFixed(2)}"/><Descripcion value=""/><FechaVto type="date" value=""/><DebeHaber value="-1"/><operacionbancariaid type="C" id="" value=""/><control1 value=""/><importemonsecundaria value=""/><organizacionid type="C" id="${clienteId}" value=""/><productoid type="C" id="" value=""/><itemid value=""/><centrodecostoid type="C" id="" value=""/><documentofisicoid type="C" id="" value=""/><importetotal value=""/><importecanceladomontransaccion value=""/><estadoiddocumentofisico type="C" id="" value=""/><itemtipo value="2"/><importecanceladomonprincipal value=""/></row></TransaccionTesoreriaCtaCteItems><M_AgregarRetenciones value="0"/><TransaccionTesoreriaRetencionItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><CuentaID type="C" id="0" value=""/><M_RetencionTipo type="CB" id="-1" value=""/><RetencionID type="C" id="0" value=""/><Descripcion value=""/><MonedaIDTransaccion type="C" id="${MONEDA.ARS.id}" value="${MONEDA.ARS.nombre}"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteISAR value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><ImporteMonTransaccion value="0" type="DEC"/><FechaVto type="date" value="${fechaCorta}"/><NroComprobanteRetencion value=""/></row></TransaccionTesoreriaRetencionItems><TransaccionAsientoItems type="D" count="0"/><ImporteIva value="" type="DEC"/><ImporteIva8 value="" type="DEC"/><ImporteGravado value="" type="DEC"/><ImporteGravado8 value="" type="DEC"/><ImporteExento value="" type="DEC"/><ImporteNoComputable value="" type="DEC"/><ImporteImpuesto value="" type="DEC"/><ImporteNoObjetoDeImpuesto value="" type="DEC"/><ImporteRetencionIva value="" type="DEC"/><TotalConcepto value="0" type="DEC"/><TotalIngresosMonPrincipal value="${importeMonPrincipal.toFixed(2)}" type="DEC"/><TotalEgresosMonPrincipal value="0" type="DEC"/><TotalRetencionMonPrincipal value="0" type="DEC"/><TotalCtaCteMonPrincipal value="${importeMonPrincipal.toFixed(2)}" type="DEC"/><transaccionsubtipoid type="C" id="228" value="${clienteNombre} - Cobranza"/><externalid value=""/><foliosustitucionid value=""/><noeditable value="0"/><comprobanteelectronicomanual value=""/><esanticipo value="0"/><numparcialidad value=""/><usuarioidinsert value=""/><fechainsert value="${fechaISO}"/><generadoautomaticamente value=""/><motivocancelacionid value=""/><nombre value=""/><fechatimbrado value=""/><obtuvocae value=""/><talonarioid type="C" id="${CONFIG_COBRANZA.talonarioId}" value=""/><importededucciones value=""/><transaccionid value="-1"/><importeretencionisr value=""/><formadepagoid type="C" id="" value=""/><debitobancofrances value=""/><importeimpuestos value=""/><eliminable value=""/><importeretencionieps value=""/><transacciontipoid type="C" id="-5" value=""/><origenid value=""/><importetotal value=""/><usocfdi value=""/><pagomercadopagoid value=""/><tipocomprobantesat value=""/><transacciontareaid value=""/></data></dataset></df>`;

  return xml;
}

// ==========================================
// ENVÍO A XUBIO
// ==========================================

/**
 * Envía el XML de cobranza a Xubio endpoint legacy
 */
function enviarCobranzaXubio(xmlCobranza, token) {
  const url = 'https://xubio.com/NXV/DF_submit';

  // El body debe ser URL-encoded como "body=<df>...</df>"
  const bodyEncoded = 'body=' + encodeURIComponent(xmlCobranza);

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': '*/*'
    },
    payload: bodyEncoded,
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando cobranza a Xubio XML Legacy API...');
  Logger.log('🔍 DEBUG - Payload XML COMPLETO:');
  // Loguear XML completo en chunks
  for (let i = 0; i < xmlCobranza.length; i += 2000) {
    Logger.log(xmlCobranza.substring(i, i + 2000));
  }

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);
  Logger.log('📥 Response COMPLETA:');
  Logger.log(responseText);

  if (responseCode !== 200) {
    Logger.log('❌ Error al enviar cobranza: HTTP ' + responseCode);
    throw new Error('Error al enviar cobranza: HTTP ' + responseCode);
  }

  // Detectar errores en la respuesta XML
  if (responseText.indexOf('<error>') !== -1) {
    Logger.log('❌ Xubio retornó error en XML');
    throw new Error('Error de Xubio: ' + responseText);
  }

  Logger.log('✅ Cobranza enviada exitosamente');

  return responseText;
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

/**
 * Cobra una factura completa
 *
 * @param {number} facturaId - ID de la factura a cobrar
 * @param {Object} config - Configuración opcional
 * @param {string} config.tipoCuenta - 'BANCO' o 'VALORES' (default: 'BANCO')
 * @param {string} config.numCheque - Número de cheque (solo para VALORES)
 * @param {string} config.fechaVtoCheque - Fecha vto cheque YYYY-MM-DD (solo para VALORES)
 * @param {number} config.bancoId - ID del banco (solo para VALORES)
 * @param {string} config.bancoNombre - Nombre del banco (solo para VALORES)
 * @returns {Object} Resultado de la operación
 */
function cobrarFactura(facturaId, config) {
  try {
    Logger.log('🏁 Iniciando cobranza de factura ID: ' + facturaId);

    // Paso 1: Obtener token OAuth
    const token = obtenerTokenXubioCobranza();

    // Paso 2: Obtener factura completa
    const factura = obtenerFacturaXubio(facturaId, token);

    // Paso 3: Construir XML de cobranza
    const xmlCobranza = construirXMLCobranza(factura, config);

    // Paso 4: Enviar a Xubio
    const resultado = enviarCobranzaXubio(xmlCobranza, token);

    Logger.log('');
    Logger.log('======================================');
    Logger.log('✅ COBRANZA COMPLETADA');
    Logger.log('======================================');
    Logger.log('Factura: ' + factura.numeroDocumento);
    Logger.log('Cliente: ' + factura.cliente.nombre);
    Logger.log('Total: ' + factura.total);
    Logger.log('Tipo cuenta: ' + (config && config.tipoCuenta ? config.tipoCuenta : 'BANCO'));
    Logger.log('======================================');

    return {
      success: true,
      factura: factura.numeroDocumento,
      cliente: factura.cliente.nombre,
      total: factura.total,
      response: resultado
    };

  } catch (error) {
    Logger.log('');
    Logger.log('======================================');
    Logger.log('❌ ERROR EN COBRANZA');
    Logger.log('======================================');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    Logger.log('======================================');

    throw error;
  }
}

// ==========================================
// FUNCIÓN DE TEST
// ==========================================

/**
 * Test: Cobrar factura con tipo BANCO
 *
 * IMPORTANTE: Cambiar el facturaId por una factura real pendiente de cobro
 */
function testCobrarFactura() {
  // CAMBIAR ESTE ID POR EL DE UNA FACTURA REAL
  const facturaId = 67835721;  // ID de la factura "LA MAYACA SRL"

  Logger.log('🧪 TEST: Cobrando factura con tipo BANCO');
  Logger.log('=========================================');

  const resultado = cobrarFactura(facturaId, {
    tipoCuenta: 'BANCO'
  });

  Logger.log('');
  Logger.log('Resultado final:');
  Logger.log(JSON.stringify(resultado, null, 2));
}

/**
 * Test: Cobrar factura con cheque (VALORES)
 */
function testCobrarFacturaConCheque() {
  // CAMBIAR ESTE ID POR EL DE UNA FACTURA REAL
  const facturaId = 67835721;

  Logger.log('🧪 TEST: Cobrando factura con CHEQUE');
  Logger.log('=====================================');

  const resultado = cobrarFactura(facturaId, {
    tipoCuenta: 'VALORES',
    numCheque: '0000001',
    fechaVtoCheque: '2026-01-15',
    bancoId: 3,
    bancoNombre: 'ABN Amro'
  });

  Logger.log('');
  Logger.log('Resultado final:');
  Logger.log(JSON.stringify(resultado, null, 2));
}
