/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
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
