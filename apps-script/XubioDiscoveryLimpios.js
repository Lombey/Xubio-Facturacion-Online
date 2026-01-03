/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp */

const DISCOVERY_VERCEL_URL = 'https://xubio-facturacion-online.vercel.app';

/**
 * Lista los Centros de Costo con el objeto completo para ver los nombres de campos.
 */
function descubrirCentrosDeCosto() {
  Logger.log('🔍 Buscando Centros de Costo (detallado)...');

  try {
    const url = DISCOVERY_VERCEL_URL + '/api/discovery?resource=centroDeCostoBean&activo=1';
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(res.getContentText());
    
    const centros = data.data || data;
    
    if (Array.isArray(centros) && centros.length > 0) {
      Logger.log('🏢 PRIMER CENTRO DE COSTO ENCONTRADO (Raw JSON):');
      Logger.log(JSON.stringify(centros[0], null, 2));
      
      Logger.log('------------------------------------');
      centros.forEach(c => {
        // Intentamos detectar el ID en varios campos comunes
        const realId = c.id || c.ID || c.centroDeCosto_id || c.centrodecostoid;
        Logger.log('Detectado ID: ' + realId + ' - Nombre: ' + c.nombre);
      });
    } else {
      Logger.log('❌ No se encontraron centros o el formato es inválido: ' + res.getContentText());
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}