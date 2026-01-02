/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp, ContentService */

/**
 * Xubio Facturación vía Vercel - Apps Script
 *
 * Sistema de facturación automática usando endpoints serverless en Vercel
 * Vercel maneja: Playwright login + XML Legacy + Cookies de sesión
 *
 * USO:
 * 1. Configurar VERCEL_BASE_URL con tu dominio de Vercel
 * 2. Configurar variables de entorno en Vercel (XUBIO_USERNAME, XUBIO_PASSWORD)
 * 3. Ejecutar testCrearFactura() para validar
 * 4. Integrar con AppSheet
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

/**
 * URL base de tu deployment en Vercel
 * IMPORTANTE: Cambiar por tu dominio real
 */
const VERCEL_BASE_URL = 'https://tu-proyecto.vercel.app';

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Crea una factura en Xubio usando el endpoint de Vercel
 *
 * @param {Object} params - Parámetros de la factura
 * @param {number} params.clienteId - ID del cliente en Xubio
 * @param {string} params.clienteNombre - Nombre del cliente
 * @param {number} params.provinciaId - ID de la provincia
 * @param {string} params.provinciaNombre - Nombre de la provincia
 * @param {number} params.localidadId - ID de la localidad
 * @param {string} params.localidadNombre - Nombre de la localidad
 * @param {number} [params.cantidad=1] - Cantidad de tolvas/productos
 * @returns {Object} Resultado de la factura
 */
function crearFacturaVercel(params) {
  Logger.log('📋 Iniciando creación de factura vía Vercel...');

  const {
    clienteId,
    clienteNombre,
    provinciaId,
    provinciaNombre,
    localidadId,
    localidadNombre,
    cantidad = 1
  } = params;

  // Validar parámetros
  if (!clienteId || !clienteNombre || !provinciaId || !provinciaNombre || !localidadId || !localidadNombre) {
    throw new Error('Faltan parámetros requeridos: clienteId, clienteNombre, provinciaId, provinciaNombre, localidadId, localidadNombre');
  }

  const url = VERCEL_BASE_URL + '/api/crear-factura';

  const payload = {
    clienteId: parseInt(clienteId),
    clienteNombre: clienteNombre,
    provinciaId: parseInt(provinciaId),
    provinciaNombre: provinciaNombre,
    localidadId: parseInt(localidadId),
    localidadNombre: localidadNombre,
    cantidad: parseInt(cantidad)
  };

  Logger.log('📤 Enviando a Vercel endpoint...');
  Logger.log('🔍 Payload:');
  Logger.log(JSON.stringify(payload, null, 2));

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('📥 Response Code: ' + responseCode);
    Logger.log('📥 Response: ' + responseText);

    if (responseCode !== 200) {
      throw new Error('Error HTTP ' + responseCode + ': ' + responseText);
    }

    const resultado = JSON.parse(responseText);

    if (!resultado.success) {
      throw new Error('Error de Vercel: ' + resultado.error);
    }

    Logger.log('✅ Factura creada exitosamente');
    Logger.log('TransaccionID: ' + resultado.data.transaccionId);
    Logger.log('Número: ' + resultado.data.numeroDocumento);
    Logger.log('Total: USD $' + resultado.data.total);
    Logger.log('PDF: ' + resultado.data.pdfUrl);

    return resultado.data;

  } catch (error) {
    Logger.log('❌ Error al crear factura: ' + error.message);
    throw error;
  }
}

/**
 * Prueba de login (solo para testing)
 * Verifica que las credenciales estén configuradas en Vercel
 */
function testLogin() {
  Logger.log('🧪 Iniciando test de login...');

  const url = VERCEL_BASE_URL + '/api/test-login';

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({}),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('📥 Response Code: ' + responseCode);
    Logger.log('📥 Response: ' + responseText);

    if (responseCode !== 200) {
      throw new Error('Error HTTP ' + responseCode + ': ' + responseText);
    }

    const resultado = JSON.parse(responseText);

    if (resultado.success) {
      Logger.log('✅ Login exitoso!');
      Logger.log('Cookies obtenidas: ' + resultado.data.cookiesCount);
      Logger.log('Cookies válidas: ' + resultado.data.cookiesValid);
    } else {
      Logger.log('❌ Login falló: ' + resultado.error);
    }

    return resultado;

  } catch (error) {
    Logger.log('❌ Error en test de login: ' + error.message);
    throw error;
  }
}

// ==========================================
// TEST FUNCTIONS
// ==========================================

/**
 * Test simple de creación de factura
 * IMPORTANTE: Cambiar los IDs por datos reales de tu Xubio
 */
function testCrearFactura() {
  Logger.log('🧪 Iniciando test de creación de factura...');
  Logger.log('=====================================\n');

  try {
    // Datos de prueba - CAMBIAR POR DATOS REALES
    const resultado = crearFacturaVercel({
      clienteId: 123456,           // ← CAMBIAR: ID real del cliente en Xubio
      clienteNombre: 'Cliente Test',
      provinciaId: 1,               // ← CAMBIAR: 1 = Buenos Aires, etc.
      provinciaNombre: 'Buenos Aires',
      localidadId: 147,             // ← CAMBIAR: 147 = Saladillo, etc.
      localidadNombre: 'Saladillo',
      cantidad: 1
    });

    Logger.log('\n✅ ¡TEST EXITOSO!');
    Logger.log('=====================================');
    Logger.log('TransaccionID: ' + resultado.transaccionId);
    Logger.log('Número: ' + resultado.numeroDocumento);
    Logger.log('Total: USD $' + resultado.total);
    Logger.log('Cotización: $' + resultado.cotizacion);
    Logger.log('PDF URL: ' + resultado.pdfUrl);

  } catch (error) {
    Logger.log('\n❌ TEST FALLÓ');
    Logger.log('=====================================');
    Logger.log('Error: ' + error.message);
  }
}

// ==========================================
// WEBHOOK HANDLER (para AppSheet)
// ==========================================

/**
 * Handler para webhook de AppSheet
 * AppSheet llamará a este endpoint vía POST
 *
 * @param {Object} e - Event object de Apps Script
 * @returns {Object} JSON response
 */
function doPost(e) {
  try {
    // Parsear payload de AppSheet
    const payload = JSON.parse(e.postData.contents);

    Logger.log('📨 Webhook recibido de AppSheet');
    Logger.log('Payload: ' + JSON.stringify(payload, null, 2));

    // Crear factura usando Vercel
    const resultado = crearFacturaVercel({
      clienteId: payload.clienteId,
      clienteNombre: payload.clienteNombre,
      provinciaId: payload.provinciaId,
      provinciaNombre: payload.provinciaNombre,
      localidadId: payload.localidadId,
      localidadNombre: payload.localidadNombre,
      cantidad: payload.cantidad || 1
    });

    // Retornar resultado a AppSheet
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: resultado
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ Error en webhook: ' + error.message);

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler para GET requests (health check)
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Xubio Facturación Vercel API',
    endpoints: {
      POST: '/exec - Crear factura desde AppSheet'
    }
  })).setMimeType(ContentService.MimeType.JSON);
}
