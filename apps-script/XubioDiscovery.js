/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp */

/**
 * Xubio Discovery - Apps Script
 * 
 * Este script contiene funciones para CONSULTAR los IDs reales de tu Xubio.
 * Úsalo para mapear Puntos de Venta, Productos y Clientes.
 */

// CONFIGURACIÓN: URL de tu proyecto en Vercel
const VERCEL_BASE = 'https://xubio-facturacion-online.vercel.app';

/**
 * Consulta genérica al sistema de descubrimiento
 */
function consultarRecurso(resource, params = '') {
  const url = VERCEL_BASE + '/api/discovery?resource=' + resource + params;
  
  Logger.log('🔍 Consultando: ' + resource + '...');
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(response.getContentText());
    
    if (data.success) {
      Logger.log('✅ Datos obtenidos de ' + resource + ':');
      Logger.log(JSON.stringify(data.data, null, 2));
      return data.data;
    } else {
      Logger.log('❌ Error: ' + data.error);
    }
  } catch (e) {
    Logger.log('❌ Error de conexión: ' + e.toString());
  }
}

/**
 * LISTAR PUNTOS DE VENTA
 * Ejecuta esto para ver tus IDs de Punto de Venta y Talonarios
 */
function descubrirPuntosDeVenta() {
  consultarRecurso('puntoVentaBean');
}

/**
 * LISTAR PRODUCTOS
 * Muestra los primeros 10 productos para obtener sus IDs
 */
function descubrirProductos() {
  consultarRecurso('productoBean', '&maxResults=10');
}

/**
 * LISTAR LISTAS DE PRECIO
 */
function descubrirListasPrecio() {
  consultarRecurso('listaPrecioBean');
}

/**
 * BUSCAR CLIENTE POR NOMBRE
 * Ejemplo: buscarCliente('2MCAMPO')
 */
function buscarClientePorNombre(nombre) {
  consultarRecurso('organizacionBean', '&nombre=' + encodeURIComponent(nombre));
}

/**
 * CONSULTA LIBRE (Proxy)
 * Úsala para cualquier endpoint de la API oficial
 */
function consultaLibreProxy(path) {
  const url = VERCEL_BASE + '/api/proxy?path=' + path;
  const res = UrlFetchApp.fetch(url);
  Logger.log(res.getContentText());
}
