/**
 * Crear Factura Endpoint (Vercel) - Híbrido XML + Token Oficial
 * 
 * Versión final optimizada con datos del Golden Template.
 */

import { getOfficialToken } from './utils/tokenManager.js';
import { buildXMLPayload } from './utils/buildXMLPayload.js';

/**
 * Obtiene cotización USD (fallback a valor fijo si falla)
 */
async function obtenerCotizacion() {
  try {
    // API del BCRA via estadisticasbcra.com
    const res = await fetch('https://api.estadisticasbcra.com/usd_of', { 
      headers: { 'Authorization': 'BEARER ' }
    });
    if (!res.ok) throw new Error('BCRA API error');
    const data = await res.json();
    return parseFloat(data[data.length - 1].v);
  } catch (e) {
    console.warn('⚠️ [FACTURA] No se pudo obtener cotización BCRA, usando 1455');
    return 1455; 
  }
}

export default async function handler(req, res) {
  // Manejar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  console.log('📝 [FACTURA] Iniciando creación de factura (XML + Token)...');

  try {
    const { 
      clienteId, 
      clienteNombre, 
      provinciaId, 
      provinciaNombre, 
      localidadId, 
      localidadNombre, 
      cantidad = 1 
    } = req.body;

    if (!clienteId || !clienteNombre) {
      return res.status(400).json({ error: 'Faltan datos del cliente (clienteId, clienteNombre)' });
    }

    // 1. Obtener Token Oficial (OAuth2)
    const token = await getOfficialToken();

    // 2. Obtener Cotización real
    const cotizacionUSD = await obtenerCotizacion();

    // 3. Construir XML Legacy (Template GOLD)
    const xmlPayload = buildXMLPayload({
      cliente: {
        id: parseInt(clienteId),
        nombre: clienteNombre,
        provinciaId: parseInt(provinciaId || 1),
        provinciaNombre: provinciaNombre || 'Buenos Aires',
        localidadId: parseInt(localidadId || 147),
        localidadNombre: localidadNombre || 'Saladilla'
      },
      cantidad: parseFloat(cantidad),
      cotizacionUSD
    });

    // 4. Enviar a Xubio usando el Token como autorización
    console.log('📤 [FACTURA] Enviando XML a /NXV/DF_submit...');
    
    const bodyEncoded = 'body=' + encodeURIComponent(xmlPayload);
    const response = await fetch('https://xubio.com/NXV/DF_submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: bodyEncoded
    });

    const responseText = await response.text();
    console.log(`📥 [FACTURA] Response Status: ${response.status}`);

    // Si Xubio redirige (302), significa que el Token no es suficiente para este endpoint "web"
    if (response.status === 302 || responseText.includes('login') || response.status === 401) {
      throw new Error('El endpoint XML requiere sesión web (cookies). El Token de API no tiene permisos aquí.');
    }

    if (!response.ok) {
      throw new Error(`Error de red en Xubio: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    // 5. Validar errores lógicos en el XML de respuesta
    if (responseText.includes('<error>')) {
      const errorMatch = responseText.match(/<error>(.*?)<\/error>/);
      const msg = errorMatch ? errorMatch[1] : 'Error desconocido en respuesta XML';
      throw new Error(`Xubio Error: ${msg}`);
    }

    // 6. Extraer ID de transacción
    const transaccionIdMatch = responseText.match(/<transaccionid[^>]*value="([^"]+)"/);
    const transaccionId = transaccionIdMatch ? transaccionIdMatch[1] : null;

    if (!transaccionId || transaccionId === '0') {
      console.log('🔍 Response completa para debug:', responseText);
      throw new Error('No se recibió un ID de transacción válido. Es posible que la factura no se haya guardado.');
    }

    console.log(`✅ [FACTURA] Creada con éxito. ID: ${transaccionId}`);

    return res.status(200).json({
      success: true,
      data: {
        transaccionId,
        pdfUrl: `https://xubio.com/NXV/transaccion/ver/${transaccionId}`,
        cotizacion: cotizacionUSD,
        metodo: 'Official-Token-XML'
      }
    });

  } catch (error) {
    console.error('❌ [FACTURA] Error fatal:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      isAuthError: error.message.includes('sesión web') || error.message.includes('Token')
    });
  }
}
