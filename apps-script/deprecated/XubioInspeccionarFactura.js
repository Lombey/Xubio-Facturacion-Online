/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp */

const INSPECTOR_VERCEL_URL = 'https://xubio-facturacion-online.vercel.app';

/**
 * Consulta una factura existente en Xubio para obtener su estructura real.
 */
function inspeccionarFacturaReal() {
  const facturaId = "CAMBIAR_POR_ID_REAL"; // <--- PONER ID DE FACTURA AQUÍ
  
  const url = INSPECTOR_VERCEL_URL + '/api/proxy?path=/comprobanteVentaBean/' + facturaId;
  Logger.log('🔍 Inspeccionando factura ID: ' + facturaId + '...');
  
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      Logger.log('✅ MOLDE ENCONTRADO (JSON Real):');
      Logger.log(res.getContentText());
    } else {
      Logger.log('❌ Error: ' + res.getContentText());
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}

/**
 * Muestra el JSON completo de las últimas facturas para ver los campos reales.
 */
function listarUltimasFacturas() {
  const url = INSPECTOR_VERCEL_URL + '/api/proxy?path=/comprobanteVentaBean';
  Logger.log('📂 Obteniendo últimas facturas (detallado)...');
  
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(res.getContentText());
    const facturas = data.data || data;
    
    if (Array.isArray(facturas) && facturas.length > 0) {
      Logger.log('📄 PRIMERA FACTURA ENCONTRADA (Raw JSON):');
      Logger.log(JSON.stringify(facturas[0], null, 2));
      
      Logger.log('------------------------------------');
      facturas.slice(0, 3).forEach(f => {
        // Buscamos el ID en posibles campos
        const realId = f.id || f.ID || f.transaccionId || f.transaccionid;
        Logger.log('ID Detectado: ' + realId + ' - Nro: ' + f.numeroDocumento);
      });
    } else {
      Logger.log('No se encontraron facturas o formato inválido.');
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}