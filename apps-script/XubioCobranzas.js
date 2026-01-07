/**
 * XubioCobranzas.js
 * Script para crear cobranzas en Xubio vía REST API
 *
 * Flujo: Apps Script -> Vercel -> Xubio API
 *
 * USO:
 * 1. Copiar este archivo a Google Apps Script
 * 2. Ejecutar testCrearCobranza() para probar
 */

const VERCEL_BASE_COBRANZA = 'https://sheets-con-xubio.vercel.app';

/**
 * TEST: Crear cobranza para factura de prueba
 * Factura: 67835721 (LA MAYACA SRL, USD 169.40 @ 1490)
 */
function testCrearCobranza() {
  const facturaId = 67835721; // LA MAYACA SRL

  Logger.log('='.repeat(50));
  Logger.log('TEST: Crear Cobranza para Factura ' + facturaId);
  Logger.log('='.repeat(50));

  const url = VERCEL_BASE_COBRANZA + '/api/crear-cobranza';
  const payload = { facturaId: facturaId };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('Llamando a: ' + url);
  Logger.log('Payload: ' + JSON.stringify(payload));
  Logger.log('-'.repeat(50));

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();

    Logger.log('HTTP Code: ' + code);

    // Loguear respuesta en chunks para evitar truncado
    logChunked(text, 'Response');

    const result = JSON.parse(text);

    Logger.log('-'.repeat(50));

    if (result.success) {
      Logger.log('EXITO: Cobranza creada');
      Logger.log('  Cobranza ID: ' + result.data.cobranzaId);
      Logger.log('  Nro Recibo: ' + result.data.numeroRecibo);
      Logger.log('  Factura: ' + result.data.factura);
      Logger.log('  Cliente: ' + result.data.cliente);
      Logger.log('  Total: ' + result.data.total);

      Logger.log('');
      Logger.log('>>> SIGUIENTE PASO: Verificar en Xubio si la cobranza');
      Logger.log('>>> quedo imputada a la factura (Cuenta Corriente)');
    } else {
      Logger.log('ERROR: ' + result.error);
      if (result.debug) {
        Logger.log('Debug info:');
        logChunked(JSON.stringify(result.debug, null, 2), 'Debug');
      }
    }

    return result;

  } catch (error) {
    Logger.log('EXCEPCION: ' + error.message);
    throw error;
  }
}

/**
 * Crear cobranza para cualquier factura por ID
 * @param {number} facturaId - ID de la factura a cobrar
 * @returns {Object} Resultado de la operacion
 */
function crearCobranza(facturaId) {
  if (!facturaId) {
    throw new Error('Falta parametro: facturaId');
  }

  const url = VERCEL_BASE_COBRANZA + '/api/crear-cobranza';
  const payload = { facturaId: parseInt(facturaId) };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code !== 200) {
    Logger.log('Error HTTP ' + code + ': ' + text);
  }

  const result = JSON.parse(text);

  if (!result.success) {
    throw new Error('Error creando cobranza: ' + result.error);
  }

  return result.data;
}

/**
 * Utilidad: Loguear texto largo en chunks de 2000 caracteres
 * @param {string} text - Texto a loguear
 * @param {string} label - Etiqueta para el log
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
