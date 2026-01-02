/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp */

/**
 * XUBIO FACTURADOR VERCEL - Versión Dinámica con Logs Detallados
 */
const VERCEL_URL_DINAMICO = 'https://xubio-facturacion-online.vercel.app';

function crearFacturaXubio(params) {
  const url = VERCEL_URL_DINAMICO + '/api/crear-factura';
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(params),
    muteHttpExceptions: true // Permite capturar errores sin que el script se detenga
  };

  Logger.log('📤 Enviando factura a Vercel...');
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    const result = JSON.parse(responseText);
    
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
        Logger.log('🔍 DEBUG XUBIO: ' + JSON.stringify(result.debug, null, 2));
      }
      throw new Error(result.error);
    }
  } catch (e) {
    Logger.log('❌ FALLO CRÍTICO: ' + e.toString());
    throw e;
  }
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
