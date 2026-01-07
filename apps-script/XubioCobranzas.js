/**
 * XubioCobranzas.js
 * Script para crear cobranzas en Xubio vía REST API
 *
 * Flujo: Apps Script -> Vercel -> Xubio API
 *
 * USO:
 * 1. Copiar este archivo a Google Apps Script
 * 2. Ejecutar testCrearCobranza() para probar
 * 3. Desplegar como Web App para usar con AppSheet
 */

const VERCEL_BASE_COBRANZA = 'https://xubio-facturacion-online.vercel.app';

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * CREAR COBRANZA POR NÚMERO DE FACTURA
 * Llama al endpoint de Vercel que busca la factura y crea la cobranza
 *
 * @param {string} numeroDocumento - Número de factura (ej: "A-00004-00001685")
 * @returns {Object} { cobranzaId, numeroRecibo, factura, cliente, total, pdfUrl }
 */
function crearCobranzaPorFactura(numeroDocumento) {
  if (!numeroDocumento) {
    throw new Error('Falta parámetro: numeroDocumento');
  }

  Logger.log('🚀 Creando cobranza para factura: ' + numeroDocumento);

  const url = VERCEL_BASE_COBRANZA + '/api/crear-cobranza';
  const payload = { numeroDocumento: numeroDocumento };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  Logger.log('HTTP Code: ' + code);

  if (code !== 200) {
    Logger.log('Error: ' + text);
    throw new Error('Error HTTP ' + code + ' creando cobranza');
  }

  const result = JSON.parse(text);

  if (!result.success) {
    Logger.log('Error: ' + result.error);
    throw new Error('Error creando cobranza: ' + result.error);
  }

  Logger.log('✅ Cobranza creada exitosamente');
  Logger.log('   Recibo: ' + result.data.numeroRecibo);
  Logger.log('   PDF: ' + result.data.pdfUrl);

  return result.data;
}

// ============================================================================
// INTEGRACIÓN CON GOOGLE SHEETS
// ============================================================================

/**
 * ACTUALIZAR COBRANZA EN GOOGLE SHEETS
 * Busca por ID REF y actualiza la columna 22 (LINK_PDF_COBRANZA)
 *
 * @param {string} idRef - ID único de la fila (columna 20)
 * @param {string} pdfUrl - URL del PDF de la cobranza
 */
function actualizarCobranzaEnSheet(idRef, pdfUrl) {
  const spreadsheetId = '1URTOFW_OIM1JG0HKarhjigd-JgQSgFPCItbvDRa3p-o';
  const sheetName = 'CONECTIVIDADES RPG0503';

  Logger.log('📝 Actualizando sheet con cobranza...');
  Logger.log('   ID REF: ' + idRef);
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
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][19]) === String(idRef)) {
        filaEncontrada = i + 1; // +1 porque getValues() es 0-indexed
        break;
      }
    }

    if (filaEncontrada === -1) {
      throw new Error('No se encontró registro con ID REF: ' + idRef);
    }

    // Actualizar columna 22 (LINK_PDF_COBRANZA) = índice V
    if (pdfUrl) {
      sheet.getRange(filaEncontrada, 22).setValue(pdfUrl);
    }

    Logger.log('✅ Sheet actualizada - Fila: ' + filaEncontrada);

  } catch (error) {
    Logger.log('❌ Error actualizando sheet: ' + error.message);
    throw error;
  }
}

// ============================================================================
// WEBHOOK PARA APPSHEET
// ============================================================================

/**
 * NOTA: doPost() movido a router.gs
 * El router detecta automáticamente si es facturación o cobranza
 * según los campos del request (si NO viene "cuit" = cobranza)
 *
 * Las funciones que usa el router desde este archivo:
 * - crearCobranzaPorFactura(numeroDocumento)
 * - obtenerFacturaDeSheet(idRef)
 * - actualizarCobranzaEnSheet(idRef, pdfUrl)
 */

/**
 * OBTENER NÚMERO DE FACTURA DE LA SHEET
 * Lee la columna 13 (FACTURA 2026) de la fila con el idRef indicado
 */
function obtenerFacturaDeSheet(idRef) {
  const spreadsheetId = '1URTOFW_OIM1JG0HKarhjigd-JgQSgFPCItbvDRa3p-o';
  const sheetName = 'CONECTIVIDADES RPG0503';

  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('No se encontró la hoja: ' + sheetName);
  }

  const data = sheet.getDataRange().getValues();

  // Buscar fila por ID REF (columna 20 = índice 19)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][19]) === String(idRef)) {
      // Columna 13 = índice 12 (FACTURA 2026)
      return data[i][12];
    }
  }

  return null;
}

// ============================================================================
// FUNCIONES DE TEST
// ============================================================================

/**
 * TEST: Crear cobranza para factura de prueba
 */
function testCrearCobranza() {
  const numeroDocumento = 'A-00004-00001685'; // Cambiar por factura real

  Logger.log('='.repeat(50));
  Logger.log('TEST: Crear Cobranza para Factura ' + numeroDocumento);
  Logger.log('='.repeat(50));

  try {
    const resultado = crearCobranzaPorFactura(numeroDocumento);

    Logger.log('-'.repeat(50));
    Logger.log('EXITO: Cobranza creada');
    Logger.log('  Cobranza ID: ' + resultado.cobranzaId);
    Logger.log('  Nro Recibo: ' + resultado.numeroRecibo);
    Logger.log('  Factura: ' + resultado.factura);
    Logger.log('  Cliente: ' + resultado.cliente);
    Logger.log('  Total: ' + resultado.total);
    Logger.log('  PDF: ' + resultado.pdfUrl);

    Logger.log('');
    Logger.log('>>> La cobranza incluye observacion con factura a imputar');
    Logger.log('>>> Imputar manualmente en Xubio: Cuenta Corriente > Aplicar');

    return resultado;

  } catch (error) {
    Logger.log('EXCEPCION: ' + error.message);
    throw error;
  }
}

/**
 * TEST: Simular webhook de AppSheet
 */
function testWebhookCobranza() {
  Logger.log('🧪 TEST: Simulando webhook de AppSheet para cobranza');
  Logger.log('================================================');

  // Simular request de AppSheet
  const mockRequest = {
    postData: {
      contents: JSON.stringify({
        idRef: '1', // Cambiar por ID real
        numeroDocumento: 'A-00004-00001685' // O dejarlo vacío para leer de sheet
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

/**
 * Utilidad: Loguear texto largo en chunks de 2000 caracteres
 */
function logChunked(text, label) {
  const chunkSize = 2000;
  const chunks = Math.ceil(text.length / chunkSize);

  if (chunks === 1) {
    Logger.log(label + ': ' + text);
  } else {
    for (let i = 0; i < chunks; i++) {
      const chunk = text.substring(i * chunkSize, (i + 1) * chunkSize);
      Logger.log(label + ' [' + (i + 1) + '/' + chunks + ']: ' + chunk);
    }
  }
}
