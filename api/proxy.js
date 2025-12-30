const XUBIO_BASE_URL = 'https://xubio.com/API/1.1';

export default async function handler(req, res) {
  // Manejar preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(200).end();
  }

  try {
    // Obtener el path desde query string
    let path = req.query.path || '';
    
    // Si no viene en query, intentar desde la URL
    if (!path && req.url) {
      path = req.url.replace('/api/proxy', '').replace(/^\//, '');
    }
    
    // Si aún no hay path, usar la raíz
    if (!path) {
      path = '/';
    }
    
    // Asegurar que el path empiece con /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Construir URL completa de Xubio
    const url = `${XUBIO_BASE_URL}${path}`;
    
    console.log(`[PROXY] ${req.method} ${url} (path: ${path})`);

    // Preparar headers
    const headers = {
      'Accept': 'application/json'
    };

    // Copiar headers importantes del cliente (Authorization, etc.)
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Preparar opciones del fetch
    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'manual'
    };

    // Agregar body si existe (POST, PUT, etc.)
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      // Si es form-urlencoded, enviar como string
      if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        fetchOptions.body = typeof req.body === 'string' ? req.body : new URLSearchParams(req.body).toString();
      } else {
        // JSON u otro formato
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    console.log(`[PROXY] Fetching with method: ${req.method}, body length: ${fetchOptions.body ? fetchOptions.body.length : 0}`);

    // Hacer la petición a Xubio
    const response = await fetch(url, fetchOptions);
    
    // Leer la respuesta
    const contentType = response.headers.get('Content-Type') || 'application/json';
    let data;
    
    if (contentType.includes('application/json')) {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }
    } else {
      data = await response.arrayBuffer();
    }

    console.log(`[PROXY] Response status: ${response.status}, content-type: ${contentType}`);

    // Establecer headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Content-Type', contentType);

    // Enviar respuesta
    if (data instanceof ArrayBuffer) {
      res.status(response.status).send(Buffer.from(data));
    } else {
      res.status(response.status).json(data);
    }

  } catch (error) {
    console.error('[PROXY] Error:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: error.message,
      type: 'proxy_error'
    });
  }
}

