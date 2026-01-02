/**
 * Discovery Endpoint - Vercel (Robust Version)
 */

import { getOfficialToken } from './utils/tokenManager.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { resource, ...params } = req.query;

  if (!resource) return res.status(400).json({ error: 'Falta parámetro resource' });

  try {
    const token = await getOfficialToken();
    const queryParams = new URLSearchParams(params).toString();
    const url = `https://xubio.com/API/1.1/${resource}${queryParams ? '?' + queryParams : ''}`;
    
    console.log(`🔍 [DISCOVERY] Llamando a: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return res.status(response.status).json({
        success: response.ok,
        status: response.status,
        data: data
      });
    } catch (e) {
      // Si no es JSON, devolvemos el texto (probablemente error HTML de Xubio)
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: 'Xubio devolvió HTML (posible error 500 interno)',
        raw: text.substring(0, 500)
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}