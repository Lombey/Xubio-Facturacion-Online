// @ts-nocheck
/* eslint-disable no-undef */

/**
 * XUBIO COBRANZA - Directo con OAuth
 *
 * Script simple que:
 * 1. Genera token OAuth
 * 2. Obtiene datos de factura
 * 3. Crea cobranza con imputación
 *
 * Sin endpoints de Vercel, todo directo desde Apps Script
 */

// ==========================================
// CONFIGURACIÓN OAUTH
// ==========================================

const XUBIO_CLIENT_ID = 'TU_CLIENT_ID';
const XUBIO_CLIENT_SECRET = 'TU_CLIENT_SECRET';
const XUBIO_TOKEN_URL = 'https://xubio.com/API/1.1/TokenEndpoint';
const XUBIO_API_BASE = 'https://xubio.com/API/1.1';

// ==========================================
// OBTENER TOKEN OAUTH
// ==========================================

function obtenerTokenXubio() {
  const cache = PropertiesService.getScriptProperties();
  const cachedToken = cache.getProperty('XUBIO_ACCESS_TOKEN');
  const tokenExpiry = cache.getProperty('XUBIO_TOKEN_EXPIRY');

  // Verificar si token en cache es válido
  if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
    Logger.log('✅ Usando token cacheado');
    return cachedToken;
  }

  Logger.log('🔑 Obteniendo nuevo token OAuth...');

  const credentials = XUBIO_CLIENT_ID + ':' + XUBIO_CLIENT_SECRET;
  const basicAuth = Utilities.base64Encode(credentials);

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    payload: 'grant_type=client_credentials',
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(XUBIO_TOKEN_URL, options);
  const json = JSON.parse(response.getContentText());

  if (!json.access_token && !json.token) {
    throw new Error('Error obteniendo token: ' + response.getContentText());
  }

  const accessToken = json.access_token || json.token;

  // Cachear por 1 hora (con margen de seguridad de 5 min)
  const expiryTime = new Date().getTime() + (55 * 60 * 1000);
  cache.setProperty('XUBIO_ACCESS_TOKEN', accessToken);
  cache.setProperty('XUBIO_TOKEN_EXPIRY', expiryTime.toString());

  Logger.log('✅ Token OAuth obtenido y cacheado');
  return accessToken;
}

function invalidarTokenXubio() {
  const cache = PropertiesService.getScriptProperties();
  cache.deleteProperty('XUBIO_ACCESS_TOKEN');
  cache.deleteProperty('XUBIO_TOKEN_EXPIRY');
  Logger.log('🗑️ Token cacheado invalidado');
}

// ==========================================
// CREAR COBRANZA CON IMPUTACIÓN
// ==========================================

function crearCobranzaConImputacion(facturaId) {
  Logger.log('🏁 Iniciando cobranza de factura ID: ' + facturaId);

  const token = obtenerTokenXubio();

  // 1. Obtener datos de la factura
  Logger.log('📥 Obteniendo datos de factura...');
  const facturaUrl = XUBIO_API_BASE + '/comprobanteVentaBean/' + facturaId;
  const facturaRes = UrlFetchApp.fetch(facturaUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (facturaRes.getResponseCode() !== 200) {
    throw new Error('Error al obtener factura: ' + facturaRes.getContentText());
  }

  const factura = JSON.parse(facturaRes.getContentText());

  // 2. Construir payload de cobranza
  const clienteId = factura.cliente.ID || factura.cliente.id;
  const monedaFactura = factura.moneda;
  const cotizacion = factura.cotizacion || 1;
  const total = factura.importetotal;
  const circuitoContable = factura.circuitoContable;

  const esMonedaExtranjera = monedaFactura.id === -3; // USD
  const importeMonPrincipal = esMonedaExtranjera ? (total * cotizacion) : total;

  const fechaISO = new Date().toISOString().split('T')[0];

  const payload = {
    // Cliente
    cliente: {
      cliente_id: parseInt(clienteId),
      nombre: factura.cliente.nombre
    },

    // Circuito contable (heredado de factura)
    circuitoContable: {
      ID: circuitoContable.ID,
      id: circuitoContable.id,
      nombre: circuitoContable.nombre
    },

    // Fecha
    fecha: fechaISO,

    // Moneda y cotización
    monedaCtaCte: {
      ID: monedaFactura.ID,
      id: monedaFactura.id,
      nombre: monedaFactura.nombre
    },
    cotizacion: cotizacion,
    utilizaMonedaExtranjera: esMonedaExtranjera ? 1 : 0,

    // Número de recibo (lo auto-genera Xubio)
    numeroRecibo: '',

    // Instrumento de cobro (BANCO por defecto)
    transaccionInstrumentoDeCobro: [{
      cuentaTipo: 2, // 2 = Banco
      cuenta: {
        ID: -14,
        id: -14,
        nombre: 'Banco'
      },
      moneda: {
        ID: -2,
        id: -2,
        nombre: 'Pesos Argentinos'
      },
      cotizacion: 1,
      importe: importeMonPrincipal,
      descripcion: ''
    }],

    // ⭐ CRÍTICO: Asociación con factura (imputación)
    detalleCobranzas: [{
      idComprobante: parseInt(facturaId),
      importe: total
    }],

    // Retenciones (vacías)
    transaccionRetencionItem: []
  };

  // 3. Crear cobranza
  Logger.log('📤 Payload de cobranza:');
  Logger.log(JSON.stringify(payload, null, 2));

  const cobranzaUrl = XUBIO_API_BASE + '/cobranzaBean';
  const cobranzaRes = UrlFetchApp.fetch(cobranzaUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseCode = cobranzaRes.getResponseCode();
  const responseText = cobranzaRes.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);
  Logger.log('📥 Response: ' + responseText);

  if (responseCode === 401) {
    Logger.log('⚠️ Token expirado, reintentando con token fresco...');
    invalidarTokenXubio();
    return crearCobranzaConImputacion(facturaId); // Retry con token nuevo
  }

  if (responseCode !== 200) {
    throw new Error('Error al crear cobranza: HTTP ' + responseCode + ' - ' + responseText);
  }

  const cobranza = JSON.parse(responseText);

  Logger.log('✅ COBRANZA CREADA CON IMPUTACIÓN');
  Logger.log('Cobranza ID: ' + cobranza.transaccionid);
  Logger.log('Recibo: ' + cobranza.numeroRecibo);
  Logger.log('Factura: ' + factura.numeroDocumento);
  Logger.log('Cliente: ' + factura.cliente.nombre);
  Logger.log('Total: ' + factura.importetotal);

  return {
    success: true,
    cobranzaId: cobranza.transaccionid,
    numeroRecibo: cobranza.numeroRecibo,
    factura: factura.numeroDocumento,
    cliente: factura.cliente.nombre,
    total: factura.importetotal
  };
}

// ==========================================
// TEST
// ==========================================

function testCobranzaSimple() {
  Logger.log('🧪 TEST: Crear cobranza con imputación');
  Logger.log('=========================================');

  try {
    const facturaId = 67835721; // LA MAYACA SRL
    const resultado = crearCobranzaConImputacion(facturaId);

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
