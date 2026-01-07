/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp */

/**
 * Xubio Discovery - Versión 2.0 (Proxy Fallback)
 */

const VERCEL_BASE = 'https://xubio-facturacion-online.vercel.app';

/**
 * BUSCAR PRODUCTO POR NOMBRE (Usando el Proxy para evitar errores 500)
 */
function buscarProductoFiltro(nombre) {
  const url = VERCEL_BASE + '/api/proxy?path=/productoBean&nombre=' + encodeURIComponent(nombre);
  Logger.log('🔍 Buscando producto: ' + nombre);
  
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('Resultado: ' + res.getContentText());
}

/**
 * BUSCAR CLIENTE POR NOMBRE
 */
function buscarClienteFiltro(nombre) {
  const url = VERCEL_BASE + '/api/proxy?path=/organizacionBean&nombre=' + encodeURIComponent(nombre);
  Logger.log('🔍 Buscando cliente: ' + nombre);
  
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('Resultado: ' + res.getContentText());
}

/**
 * LISTAR PUNTOS DE VENTA (Confirmar IDs)
 */
function descubrirPuntosDeVenta() {
  const url = VERCEL_BASE + '/api/discovery?resource=puntoVentaBean';
  const res = UrlFetchApp.fetch(url);
  Logger.log('Puntos de Venta: ' + res.getContentText());
}

// ============================================================================
// COTIZACIÓN USD (DolarAPI)
// ============================================================================

/**
 * OBTENER COTIZACIÓN USD OFICIAL (Banco Nación)
 * Usa DolarAPI.com para obtener el tipo de cambio vendedor en tiempo real
 * Retorna: número con el valor vendedor (ej: 1490.50)
 */
function obtenerCotizacionUSD() {
  const url = 'https://dolarapi.com/v1/dolares/oficial';
  Logger.log('💵 Obteniendo cotización USD oficial...');

  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = res.getResponseCode();

    if (code !== 200) {
      throw new Error('DolarAPI retornó HTTP ' + code);
    }

    const data = JSON.parse(res.getContentText());
    const cotizacionVenta = data.venta;

    if (!cotizacionVenta) {
      throw new Error('DolarAPI no retornó valor de venta');
    }

    Logger.log('✅ Cotización USD vendedor: $' + cotizacionVenta);
    return cotizacionVenta;

  } catch (error) {
    Logger.log('❌ Error obteniendo cotización USD: ' + error.message);
    throw new Error('No se pudo obtener cotización USD: ' + error.message);
  }
}

/**
 * TEST: Obtener cotización USD actual
 */
function testCotizacionUSD() {
  Logger.log('🧪 TEST: Obteniendo cotización USD actual');

  try {
    const cotizacion = obtenerCotizacionUSD();
    Logger.log('✅ SUCCESS: Cotización obtenida');
    Logger.log('📊 Valor vendedor Banco Nación: $' + cotizacion);
  } catch (error) {
    Logger.log('❌ FAILED: ' + error.message);
  }
}

// ============================================================================
// GESTIÓN DE CLIENTES (Pre-existentes en Xubio)
// ============================================================================

/**
 * BUSCAR CLIENTE POR CUIT
 * Retorna el cliente si existe, null si no existe
 */
function buscarClientePorCUIT(cuit) {
  // Xubio API usa numeroIdentificacion en lugar de cuit
  const url = VERCEL_BASE + '/api/discovery?resource=clienteBean&numeroIdentificacion=' + encodeURIComponent(cuit);
  Logger.log('🔍 Buscando cliente por CUIT: ' + cuit);

  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = res.getResponseCode();
  const data = JSON.parse(res.getContentText());

  if (code !== 200 || !data.success) {
    Logger.log('⚠️ No se encontró cliente con CUIT: ' + cuit);
    return null;
  }

  // Xubio devuelve array de clientes
  const clientes = data.data || [];
  if (clientes.length === 0) {
    Logger.log('⚠️ No se encontró cliente con CUIT: ' + cuit);
    return null;
  }

  const cliente = clientes[0];
  Logger.log('✅ Cliente encontrado: ' + cliente.nombre + ' (ID: ' + cliente.ID + ')');
  return cliente;
}

/**
 * OBTENER CLIENTE EXISTENTE
 * Busca cliente por CUIT, lanza error si no existe
 * IMPORTANTE: Los clientes deben pre-existir en Xubio (creados manualmente desde la UI)
 */
function obtenerClienteExistente(cuit) {
  Logger.log('🔄 Buscando cliente con CUIT: ' + cuit);

  const cliente = buscarClientePorCUIT(cuit);

  if (!cliente) {
    const error = '❌ Cliente con CUIT ' + cuit + ' NO existe en Xubio. Debe crearse manualmente primero desde la UI web de Xubio.';
    Logger.log(error);
    throw new Error(error);
  }

  Logger.log('✅ Cliente encontrado: ' + cliente.nombre + ' (ID: ' + cliente.cliente_id + ')');
  return cliente;
}

/**
 * TEST: Buscar cliente existente
 * Los clientes deben pre-existir en Xubio (creados manualmente)
 */
function testBuscarClienteExistente() {
  // Usar CUIT de un cliente que sabés que existe en tu Xubio
  const cuit = '30-71614098-4'; // Cambiar por CUIT real de tu base

  Logger.log('🧪 TEST: Buscando cliente pre-existente');

  try {
    const cliente = obtenerClienteExistente(cuit);
    Logger.log('✅ SUCCESS: Cliente encontrado');
    Logger.log('📊 Datos del cliente:');
    Logger.log(JSON.stringify(cliente, null, 2));
  } catch (error) {
    Logger.log('❌ FAILED: ' + error.message);
  }
}

/**
 * TEST: Buscar cliente que NO existe (debe lanzar error)
 */
function testBuscarClienteNoExiste() {
  const cuit = '20-99999999-9'; // CUIT que NO existe

  Logger.log('🧪 TEST: Buscando cliente que NO existe (debe fallar)');

  try {
    const cliente = obtenerClienteExistente(cuit);
    Logger.log('❌ UNEXPECTED: Cliente encontrado cuando no debería existir');
  } catch (error) {
    Logger.log('✅ SUCCESS: Error esperado - ' + error.message);
  }
}

// ============================================================================
// FACTURACIÓN COMPLETA (Integración Total)
// ============================================================================

/**
 * CREAR FACTURA COMPLETA
 * Función principal que integra todos los componentes:
 * - Busca cliente por CUIT
 * - Obtiene cotización USD actual
 * - Crea factura con producto CONECTIVIDAD ANUAL POR TOLVA
 * - Retorna link al PDF
 *
 * @param {string} cuit - CUIT del cliente (debe pre-existir en Xubio)
 * @param {number} cantidad - Cantidad de items (default: 1)
 * @param {string} externalId - ID externo para idempotencia (RowKey de AppSheet)
 * @returns {Object} { transaccionId, numeroDocumento, pdfUrl }
 */
function crearFacturaCompleta(cuit, cantidad, externalId) {
  cantidad = cantidad || 1;
  externalId = externalId || 'TEST-' + new Date().getTime();

  Logger.log('🚀 Iniciando creación de factura...');
  Logger.log('📋 CUIT: ' + cuit);
  Logger.log('📦 Cantidad: ' + cantidad);
  Logger.log('🆔 External ID: ' + externalId);

  try {
    // 1. Buscar cliente por CUIT
    Logger.log('');
    Logger.log('▶️ PASO 1/3: Buscando cliente...');
    const cliente = obtenerClienteExistente(cuit);
    const clienteId = cliente.cliente_id;

    // 2. Construir payload para Vercel
    Logger.log('');
    Logger.log('▶️ PASO 2/3: Construyendo payload...');
    const payload = {
      clienteId: clienteId,
      // Precio se obtiene automáticamente en el backend desde Xubio (Lista AGDP)
      cantidad: cantidad,
      descripcion: 'CONECTIVIDAD ANUAL POR TOLVA',
      externalId: externalId,
      // IDs hardcodeados (del documento XUBIO_RECURSOS_ID.md)
      productoId: 2751338,         // CONECTIVIDAD ANUAL POR TOLVA
      puntoVentaId: 212819,        // corvusweb srl
      centroDeCostoId: 57329,      // kit sistema agdp
      listaDePrecioId: 15386       // AGDP
    };

    Logger.log('📄 Payload construido correctamente (Precio se resolverá en backend)');

    // 3. Llamar al endpoint de Vercel
    Logger.log('');
    Logger.log('▶️ PASO 3/3: Creando factura en Xubio...');
    const url = VERCEL_BASE + '/api/crear-factura';
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const responseText = res.getContentText();

    if (code !== 200) {
      Logger.log('❌ Error HTTP ' + code);
      Logger.log('📦 Response (primeros 500 chars):');
      Logger.log(responseText.substring(0, 500));
      throw new Error('Error creando factura: HTTP ' + code);
    }

    const result = JSON.parse(responseText);

    if (!result.success) {
      Logger.log('❌ Error funcional: ' + (result.error || 'Sin mensaje'));
      if (result.debug) {
        Logger.log('🔍 Debug Info:');
        const debugStr = JSON.stringify(result.debug, null, 2);
        // Loguear en chunks de 2000 caracteres
        for (let i = 0; i < debugStr.length; i += 2000) {
          Logger.log(debugStr.substring(i, i + 2000));
        }
      }
      throw new Error(result.error || 'Error desconocido al crear factura');
    }

    // Éxito
    Logger.log('');
    Logger.log('✅ ¡FACTURA CREADA EXITOSAMENTE!');
    Logger.log('🆔 ID Transacción: ' + result.data.transaccionId);
    Logger.log('📄 Número Documento: ' + result.data.numeroDocumento);
    Logger.log('🔗 PDF: ' + result.data.pdfUrl);

    return result.data;

  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERROR CRÍTICO: ' + error.message);
    throw error;
  }
}

/**
 * TEST: Crear factura completa de prueba
 */
function testCrearFacturaCompleta() {
  // Usar datos de un cliente real que existe
  const cuit = '20-21767208-3'; // ABEL NATALIO LATTANZI (del test anterior)
  const cantidad = 1;
  const externalId = 'TEST-' + new Date().getTime();

  Logger.log('🧪 TEST: Crear factura completa');
  Logger.log('================================================');

  try {
    const resultado = crearFacturaCompleta(cuit, cantidad, externalId);

    Logger.log('');
    Logger.log('================================================');
    Logger.log('✅ TEST EXITOSO');
    Logger.log('📊 Resultado:');
    Logger.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    Logger.log('');
    Logger.log('================================================');
    Logger.log('❌ TEST FALLIDO');
    Logger.log('Error: ' + error.message);
  }
}

// ============================================================================
// WEB APP - INTEGRACIÓN CON APPSHEET
// ============================================================================

/**
 * ACTUALIZAR FACTURA EN GOOGLE SHEETS
 * Busca por ID REF y actualiza la columna FACTURA 2026 y LINK PDF
 *
 * @param {string} idRef - ID único de la fila (columna 20)
 * @param {string} numeroDocumento - Número de factura generada (ej: "A-00004-00001682")
 * @param {string} pdfUrl - URL del PDF de la factura
 */
function actualizarFacturaEnSheet(idRef, numeroDocumento, pdfUrl) {
  const spreadsheetId = '1URTOFW_OIM1JG0HKarhjigd-JgQSgFPCItbvDRa3p-o';
  const sheetName = 'CONECTIVIDADES RPG0503';

  Logger.log('📝 Actualizando sheet...');
  Logger.log('   ID REF: ' + idRef);
  Logger.log('   Factura: ' + numeroDocumento);
  Logger.log('   PDF: ' + pdfUrl);

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('No se encontró la hoja: ' + sheetName);
    }

    // Obtener todos los datos
    const data = sheet.getDataRange().getValues();

    // Buscar fila por ID REF (columna 20 = índice 19)
    let filaEncontrada = -1;
    for (let i = 1; i < data.length; i++) { // Empezar en 1 para skipear headers
      if (String(data[i][19]) === String(idRef)) {
        filaEncontrada = i + 1; // +1 porque getValues() es 0-indexed
        break;
      }
    }

    if (filaEncontrada === -1) {
      throw new Error('No se encontró registro con ID REF: ' + idRef);
    }

    // Actualizar columna 13 (FACTURA 2026) = índice M
    sheet.getRange(filaEncontrada, 13).setValue(numeroDocumento);
    
    // Actualizar columna 21 (LINK PDF) = índice U
    if (pdfUrl) {
      sheet.getRange(filaEncontrada, 21).setValue(pdfUrl);
    }

    Logger.log('✅ Sheet actualizada - Fila: ' + filaEncontrada);

  } catch (error) {
    Logger.log('❌ Error actualizando sheet: ' + error.message);
    throw error;
  }
}

/**
 * NOTA: doPost() movido a router.gs
 * El router detecta automáticamente si es facturación o cobranza
 * según los campos del request (si viene "cuit" = facturación)
 *
 * Las funciones que usa el router desde este archivo:
 * - crearFacturaCompleta(cuit, cantidad, externalId)
 * - actualizarFacturaEnSheet(idRef, numeroDocumento, pdfUrl)
 */

/**
 * TEST: Simular webhook de AppSheet
 */
function testWebhook() {
  Logger.log('🧪 TEST: Simulando webhook de AppSheet');
  Logger.log('================================================');

  // Simular request de AppSheet
  const mockRequest = {
    postData: {
      contents: JSON.stringify({
        cuit: '20-21767208-3',
        cantidad: 2,
        idRef: 'TEST-WEBHOOK-' + new Date().getTime()
      })
    }
  };

  const response = doPost(mockRequest);
  const responseData = JSON.parse(response.getContent());

  Logger.log('');
  Logger.log('================================================');
  Logger.log('📤 Response:');
  Logger.log(JSON.stringify(responseData, null, 2));
}
