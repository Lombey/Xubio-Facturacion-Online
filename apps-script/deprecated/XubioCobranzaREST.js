// @ts-nocheck
/* eslint-disable no-undef */

/**
 * XUBIO COBRANZA - REST API vía Vercel
 *
 * PATRÓN: Apps Script → Vercel → Xubio API
 * Credenciales OAuth manejadas en Vercel (variables de entorno)
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

const VERCEL_URL_COBRANZA = 'https://xubio-facturacion-online.vercel.app';

// ==========================================
// CREAR COBRANZA (vía Vercel)
// ==========================================

function crearCobranzaREST(facturaId) {
  Logger.log('🏁 Iniciando cobranza de factura ID: ' + facturaId);

  const url = VERCEL_URL_COBRANZA + '/api/crear-cobranza';

  const payload = {
    facturaId: parseInt(facturaId)
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando request a Vercel...');

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    Logger.log('❌ Respuesta NO-JSON desde Vercel');
    Logger.log('Response Code: ' + responseCode);
    Logger.log('Response: ' + responseText);
    throw new Error('Respuesta no-JSON desde Vercel: HTTP ' + responseCode);
  }

  if (!result.success) {
    Logger.log('❌ ERROR EN VERCEL');
    Logger.log('Error: ' + (result.error || 'Sin mensaje de error'));
    if (result.debug) {
      Logger.log('🔍 Debug:');
      // Loguear en chunks para evitar truncado
      const debugStr = JSON.stringify(result.debug, null, 2);
      for (let i = 0; i < debugStr.length; i += 2000) {
        Logger.log(debugStr.substring(i, i + 2000));
      }
    }
    throw new Error(result.error || 'Error desconocido desde Vercel');
  }

  Logger.log('✅ COBRANZA CREADA');
  Logger.log('Cobranza ID: ' + result.data.cobranzaId);
  Logger.log('Recibo: ' + result.data.numeroRecibo);
  Logger.log('Factura: ' + result.data.factura);
  Logger.log('Cliente: ' + result.data.cliente);
  Logger.log('Total: ' + result.data.total);

  return {
    success: true,
    cobranzaId: result.data.cobranzaId,
    numeroRecibo: result.data.numeroRecibo,
    factura: result.data.factura,
    cliente: result.data.cliente,
    total: result.data.total
  };
}

// ==========================================
// TEST: CREAR COBRANZA
// ==========================================

function testCobranzaREST() {
  Logger.log('🧪 TEST: Crear cobranza vía Vercel');
  Logger.log('=========================================');

  try {
    const facturaId = 67835721; // LA MAYACA SRL
    const resultado = crearCobranzaREST(facturaId);

    Logger.log('\n======================================');
    Logger.log('✅ RESULTADO EXITOSO');
    Logger.log('======================================');
    Logger.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    Logger.log('\n======================================');
    Logger.log('❌ ERROR');
    Logger.log('======================================');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}
