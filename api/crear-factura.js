/**
 * Crear Factura Endpoint (Vercel) - Híbrido XML + Token Oficial
 * 
 * Intenta enviar el XML Legacy usando el Bearer Token oficial.
 */

import { getOfficialToken } from './utils/tokenManager.js';
import { buildXMLPayload } from './utils/buildXMLPayload.js';

/**
 * Obtiene cotización USD (fallback a valor fijo si falla)
 */
async function obtenerCotizacion() {
  try {
    const res = await fetch('https://api.estadisticasbcra.com/usd_of', { 
      headers: { 'Authorization': 'BEARER ' }
    });
    const data = await res.json();
    return parseFloat(data[data.length - 1].v);
  } catch (e) {
    return 1455; 
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  console.log('📝 [FACTURA] Iniciando proceso híbrido (XML + Token)...');

  try {
    const { clienteId, clienteNombre, provinciaId, provinciaNombre, localidadId, localidadNombre, cantidad = 1 } = req.body;

    // 1. Obtener Token Oficial
    const token = await getOfficialToken();

    // 2. Obtener Cotización
    const cotizacionUSD = await obtenerCotizacion();

    // 3. Construir XML Legacy
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

    // 4. Intentar envío a endpoint Legacy usando Bearer Token
    console.log('📤 [FACTURA] Enviando XML a /NXV/DF_submit con Bearer Token...');
    
    const bodyEncoded = 'body=' + encodeURIComponent(xmlPayload);
    const response = await fetch('https://xubio.com/NXV/DF_submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': '*/*'
      },
      body: bodyEncoded
    });

    const responseText = await response.text();
    console.log(`📥 [FACTURA] Status: ${response.status}`);

    // DIAGNÓSTICO: Si no es 200, ¿por qué?
    if (!response.ok) {
      console.error('❌ [FACTURA] Error del servidor:', responseText.substring(0, 500));
      
      // Si recibimos un 302 o un 401/403, es que el endpoint legacy NO acepta Bearer Token
      if ([302, 401, 403].includes(response.status)) {
        throw new Error('EL endpoint Legacy no acepta el Token oficial. Debemos usar la API REST JSON corregida.');
      }
      
      throw new Error(`Xubio devolvió error ${response.status}`);
    }

    // 5. Verificar si hay errores XML dentro de la respuesta exitosa (típico de Xubio)
    if (responseText.includes('<error>')) {
      const errorMatch = responseText.match(/<error>(.*?)<\/error>/);
      throw new Error(`Error de Xubio (XML): ${errorMatch ? errorMatch[1] : 'Desconocido'}`);
    }

    // 6. Parsear éxito
    const transaccionIdMatch = responseText.match(/<transaccionid[^>]*value="([^"]+)"/);
    const transaccionId = transaccionIdMatch ? transaccionIdMatch[1] : null;

    console.log('✅ [FACTURA] Creada con ID:', transaccionId);

    return res.status(200).json({
      success: true,
      data: {
        transaccionId,
        pdfUrl: `https://xubio.com/NXV/transaccion/ver/${transaccionId}`,
        metodo: 'XML-Hybrid'
      }
    });

  } catch (error) {
    console.error('❌ [FACTURA] Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: error.message.includes('Token') ? 'Estamos probando si el endpoint acepta el token.' : undefined
    });
  }
}