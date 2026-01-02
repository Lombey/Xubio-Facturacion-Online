/**
 * Proxy Inteligente - Vercel
 * 
 * Redirige peticiones a Xubio inyectando automáticamente el Token oficial.
 */

import { getOfficialToken } from './utils/tokenManager.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getOfficialToken();
    
    // Obtener el path de la query o de la URL
    let path = req.query.path || req.url.replace('/api/proxy', '').split('?')[0];
    if (!path.startsWith('/')) path = '/' + path;

    // Construir URL final (excluyendo 'path' de los params)
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') queryParams.append(key, value);
    }
    
    const url = `https://xubio.com/API/1.1${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log(`📡 [PROXY] ${req.method} ${url}`);

    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('Content-Type') || 'application/json';
    
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      data = await response.text();
    }

    res.status(response.status).json(data);

  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}