/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* global Logger, UrlFetchApp */

const VERCEL_URL_DISCOVERY = 'https://xubio-facturacion-online.vercel.app';

/**
 * Verifica si el Cliente y el Producto que estamos usando existen.
 */
function verificarDatosFactura() {
  const idsATestear = {
    clienteId: "8157173",
    productoId: "2751338"
  };

  Logger.log('🔍 Verificando existencia de Cliente y Producto...');

  // 1. Verificar Cliente
  try {
    const resCliente = UrlFetchApp.fetch(VERCEL_URL_DISCOVERY + '/api/proxy?path=/organizacionBean/' + idsATestear.clienteId, { muteHttpExceptions: true });
    Logger.log('👤 Resultado Cliente (' + idsATestear.clienteId + '): ' + (resCliente.getResponseCode() === 200 ? '✅ EXISTE' : '❌ NO ENCONTRADO'));
    if (resCliente.getResponseCode() !== 200) Logger.log('Detalle: ' + resCliente.getContentText());
  } catch (e) {
    Logger.log('❌ Error verificando cliente: ' + e.toString());
  }

  // 2. Verificar Producto
  try {
    const resProducto = UrlFetchApp.fetch(VERCEL_URL_DISCOVERY + '/api/proxy?path=/productoBean/' + idsATestear.productoId, { muteHttpExceptions: true });
    Logger.log('📦 Resultado Producto (' + idsATestear.productoId + '): ' + (resProducto.getResponseCode() === 200 ? '✅ EXISTE' : '❌ NO ENCONTRADO'));
    if (resProducto.getResponseCode() !== 200) Logger.log('Detalle: ' + resProducto.getContentText());
  } catch (e) {
    Logger.log('❌ Error verificando producto: ' + e.toString());
  }
}

/**
 * Lista los últimos 5 productos de tu cuenta.
 */
function listarProductosRecientes() {
  const url = VERCEL_URL_DISCOVERY + '/api/proxy?path=/productoBean';
  Logger.log('📦 Obteniendo lista de productos...');
  
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const responseData = JSON.parse(res.getContentText());
    const productos = responseData.data || responseData; // Manejar si viene envuelto en .data
    
    Logger.log('Lista de productos (Top 5): ' + JSON.stringify(productos.slice(0, 5), null, 2));
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}

/**
 * Lista los últimos 5 clientes de tu cuenta.
 */
function listarClientesRecientes() {
  const url = VERCEL_URL_DISCOVERY + '/api/proxy?path=/organizacionBean';
  Logger.log('👥 Obteniendo lista de clientes...');
  
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const responseData = JSON.parse(res.getContentText());
    const clientes = responseData.data || responseData;
    
    Logger.log('Lista de clientes (Top 5): ' + JSON.stringify(clientes.slice(0, 5), null, 2));
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}