/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp, ContentService */

/**
 * Xubio Facturación Vercel - Versión Híbrida (API Oficial + XML)
 * 
 * Este script conecta Google Sheets con los endpoints de Vercel.
 * Vercel se encarga de la autenticación oficial y el envío del XML Legacy.
 */

// CONFIGURACIÓN: Reemplazar con la URL de tu proyecto en Vercel
const VERCEL_BASE_URL = 'https://xubio-facturacion-online.vercel.app';

/**
 * Crea una factura en Xubio usando el motor de Vercel.
 * 
 * @param {Object} data - Datos de la factura
 * @returns {Object} Datos de la factura creada
 */
function crearFacturaXubio(data) {
  const url = VERCEL_BASE_URL + '/api/crear-factura';
  
  const payload = {
    clienteId: data.clienteId,
    clienteNombre: data.clienteNombre,
    provinciaId: data.provinciaId || "1",
    provinciaNombre: data.provinciaNombre || "Buenos Aires",
    localidadId: data.localidadId || "147",
    localidadNombre: data.localidadNombre || "Saladillo",
    cantidad: data.cantidad || 1
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
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📥 Respuesta (' + statusCode + '): ' + responseText);
    
    const result = JSON.parse(responseText);
    
    if (result.success) {
      Logger.log('✅ Factura OK. ID: ' + result.data.transaccionId);
      return result.data;
    } else {
      Logger.log('❌ Error: ' + result.error);
      throw new Error(result.error);
    }
  } catch (e) {
    Logger.log('❌ Error de conexión: ' + e.toString());
    throw e;
  }
}

/**
 * Función de Test: Ejecutar desde el editor para validar
 */
function testCrearFactura() {
  const mockData = {
    clienteId: "8157173", // ID de 2MCAMPO
    clienteNombre: "2MCAMPO",
    provinciaId: "1",
    provinciaNombre: "Buenos Aires",
    localidadId: "147",
    localidadNombre: "Saladillo",
    cantidad: 1
  };
  
  crearFacturaXubio(mockData);
}

/**
 * Webhook para AppSheet (opcional)
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const result = crearFacturaXubio(params);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
