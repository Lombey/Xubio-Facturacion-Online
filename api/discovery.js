/**
 * Discovery Endpoint - Vercel
 * 
 * Permite consultar recursos de Xubio para obtener IDs reales.
 * Uso: /api/discovery?resource=puntoVentaBean
 */

import { getOfficialToken } from './utils/tokenManager.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { resource = 'puntoVentaBean', ...params } = req.query;

  try {
    const token = await getOfficialToken();
    
    // Construir URL de consulta
    const queryParams = new URLSearchParams(params).toString();
    const url = `https://xubio.com/API/1.1/${resource}${queryParams ? '?' + queryParams : ''}`;
    
    console.log(`🔍 [DISCOVERY] Consultando ${resource}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      resource,
      count: Array.isArray(data) ? data.length : 1,
      data: data
    });

  } catch (error) {
    console.error('❌ Error en Discovery:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
