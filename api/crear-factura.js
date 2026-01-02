/**
 * Crear Factura Endpoint - Vercel Serverless
 *
 * Endpoint principal para crear facturas en Xubio
 * Flujo: Obtener cookies (cache o Fly.io) → Construir XML → POST a Xubio
 *
 * URL: https://tu-app.vercel.app/api/crear-factura
 * Método: POST
 * Payload: { clienteId, clienteNombre, provinciaId, provinciaNombre, localidadId, localidadNombre, cantidad }
 */

import { getSessionCookies } from './utils/flyLogin.js';
import { cookiesToString } from './utils/cookieCache.js';
import { buildXMLPayload } from './utils/buildXMLPayload.js';

/**
 * Obtiene cotización USD desde API del BCRA
 * @returns {Promise<number>} Cotización USD oficial
 */
async function obtenerCotizacionBCRA() {
  try {
    console.log('💱 [FACTURA] Consultando cotización BCRA...');

    const response = await fetch('https://api.estadisticasbcra.com/usd_of', {
      headers: {
        'Authorization': 'BEARER ' // API pública sin token requerido
      }
    });

    const data = await response.json();
    const ultimaCotizacion = data[data.length - 1].v;

    console.log(`💱 [FACTURA] Cotización USD: $${ultimaCotizacion}`);

    return parseFloat(ultimaCotizacion);

  } catch (error) {
    console.warn('⚠️ [FACTURA] Error al obtener cotización BCRA:', error.message);
    console.warn('⚠️ [FACTURA] Usando cotización por defecto: 1455');
    return 1455; // Fallback
  }
}

/**
 * Envía factura XML a Xubio usando cookies de sesión
 *
 * @param {string} xmlPayload - Payload XML de la factura
 * @param {string} cookieHeader - Header Cookie con sesión
 * @returns {Promise<string>} Response de Xubio
 */
async function enviarFacturaXubio(xmlPayload, cookieHeader) {
  const url = 'https://xubio.com/NXV/DF_submit';

  // El body debe ser URL-encoded como "body=<df>...</df>"
  const bodyEncoded = 'body=' + encodeURIComponent(xmlPayload);

  console.log('📤 [FACTURA] Enviando a /NXV/DF_submit...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Cookie': cookieHeader,
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: bodyEncoded
  });

  const responseText = await response.text();

  console.log('📥 [FACTURA] Response Code:', response.status);
  console.log('📥 [FACTURA] Response (primeros 500 chars):', responseText.substring(0, 500));

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${responseText}`);
  }

  // Verificar si hay errores en la respuesta XML
  if (responseText.includes('<error>')) {
    const errorMatch = responseText.match(/<error>(.*?)<\/error>/);
    const errorMsg = errorMatch ? errorMatch[1] : 'Error desconocido en respuesta XML';
    throw new Error(`Error de Xubio: ${errorMsg}`);
  }

  return responseText;
}

/**
 * Parsea la respuesta XML de Xubio para extraer datos de la factura
 *
 * @param {string} xmlResponse - Response XML de Xubio
 * @returns {Object} Datos parseados de la factura
 */
function parsearRespuestaXubio(xmlResponse) {
  try {
    // Extraer TransaccionID del XML
    // Formato típico: <transaccionid value="123456"/>
    const transaccionIdMatch = xmlResponse.match(/<transaccionid[^>]*value="([^"]+)"/);
    const transaccionId = transaccionIdMatch ? transaccionIdMatch[1] : null;

    // Extraer NumeroDocumento
    const numeroDocMatch = xmlResponse.match(/<NumeroDocumento[^>]*value="([^"]+)"/);
    const numeroDocumento = numeroDocMatch ? numeroDocMatch[1] : 'Desconocido';

    // Extraer Total
    const totalMatch = xmlResponse.match(/<M_ImporteTotal[^>]*value="([^"]+)"/);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    if (!transaccionId || transaccionId === '0') {
      console.warn('⚠️ [FACTURA] No se encontró TransaccionID válido en respuesta');
      console.warn('Response XML:', xmlResponse.substring(0, 1000));
    }

    return {
      transaccionId: transaccionId,
      numeroDocumento: numeroDocumento,
      total: total,
      pdfUrl: transaccionId ? `https://xubio.com/NXV/transaccion/ver/${transaccionId}` : null
    };

  } catch (error) {
    console.error('❌ [FACTURA] Error al parsear respuesta XML:', error.message);
    throw new Error('Error al procesar respuesta de Xubio: ' + error.message);
  }
}

/**
 * Handler principal del endpoint
 */
export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Solo se permite método POST'
    });
  }

  console.log('📋 [FACTURA] Iniciando creación de factura...');

  try {
    // 1. Validar input
    const {
      clienteId,
      clienteNombre,
      provinciaId,
      provinciaNombre,
      localidadId,
      localidadNombre,
      cantidad = 1
    } = req.body;

    if (!clienteId || !clienteNombre || !provinciaId || !provinciaNombre || !localidadId || !localidadNombre) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Faltan parámetros requeridos: clienteId, clienteNombre, provinciaId, provinciaNombre, localidadId, localidadNombre'
      });
    }

    // 2. Obtener credenciales
    const username = process.env.XUBIO_USERNAME;
    const password = process.env.XUBIO_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({
        error: 'Missing credentials',
        message: 'Variables de entorno XUBIO_USERNAME y XUBIO_PASSWORD no configuradas'
      });
    }

    // 3. Obtener cookies de sesión (usa cache o Fly.io si es necesario)
    console.log('🔐 [FACTURA] Paso 1: Obtener cookies de sesión...');
    const cookies = await getSessionCookies({ username, password });
    const cookieHeader = cookiesToString(cookies);

    // 4. Obtener cotización USD
    console.log('💱 [FACTURA] Paso 2: Obtener cotización USD...');
    const cotizacionUSD = await obtenerCotizacionBCRA();

    // 5. Construir XML
    console.log('🏗️ [FACTURA] Paso 3: Construir payload XML...');
    const xmlPayload = buildXMLPayload({
      cliente: {
        id: parseInt(clienteId),
        nombre: clienteNombre,
        provinciaId: parseInt(provinciaId),
        provinciaNombre,
        localidadId: parseInt(localidadId),
        localidadNombre
      },
      cantidad: parseInt(cantidad),
      cotizacionUSD
    });

    // 6. Enviar a Xubio
    console.log('📤 [FACTURA] Paso 4: Enviar a Xubio...');
    const responseXML = await enviarFacturaXubio(xmlPayload, cookieHeader);

    // 7. Parsear respuesta
    console.log('📊 [FACTURA] Paso 5: Parsear respuesta...');
    const resultado = parsearRespuestaXubio(responseXML);

    console.log('✅ [FACTURA] Factura creada exitosamente');
    console.log('TransaccionID:', resultado.transaccionId);
    console.log('Número:', resultado.numeroDocumento);

    // 8. Retornar resultado
    return res.status(200).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: {
        transaccionId: resultado.transaccionId,
        numeroDocumento: resultado.numeroDocumento,
        total: resultado.total,
        pdfUrl: resultado.pdfUrl,
        cotizacion: cotizacionUSD,
        cantidad: cantidad
      }
    });

  } catch (error) {
    console.error('❌ [FACTURA] Error al crear factura:', error.message);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
