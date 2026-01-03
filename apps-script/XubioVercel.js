/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp */

/**
 * XUBIO FACTURADOR VERCEL - Versión Final
 */
const VERCEL_URL = 'https://xubio-facturacion-online.vercel.app';

/**
 * Crea una factura en Xubio usando el motor de Vercel.
 */
function crearFactura(params) {
  const url = VERCEL_URL + '/api/crear-factura';
  
  const payload = {
    clienteId: params.clienteId || "8157173", // Por defecto 2MCAMPO
    cantidad: params.cantidad || 1
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando a Vercel...');
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      Logger.log('✅ FACTURA CREADA OK');
      Logger.log('ID: ' + result.data.transaccionId);
      Logger.log('PDF: ' + result.data.pdfUrl);
      return result.data;
    } else {
      Logger.log('❌ ERROR: ' + result.error);
      throw new Error(result.error);
    }
  } catch (e) {
    Logger.log('❌ FALLO CRÍTICO: ' + e.toString());
    throw e;
  }
}

/**
 * Función para probar desde el editor.
 */
function testFactura() {
  crearFactura({
    clienteId: "8157173",
    cantidad: 1
  });
}
