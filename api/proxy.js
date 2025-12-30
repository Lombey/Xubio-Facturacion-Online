const XUBIO_BASE_URL = 'https://xubio.com/API/1.1';

/**
 * @typedef {Object} VercelRequest
 * @property {string} method
 * @property {any} body
 * @property {Record<string, string>} headers
 * @property {Record<string, string>} query
 * @property {string} url
 */

/**
 * @typedef {Object} VercelResponse
 * @property {(status: number) => VercelResponse} status
 * @property {(data: any) => void} json
 * @property {(data: Buffer) => void} send
 * @property {(header: string, value: string) => void} setHeader
 * @property {() => void} end
 */

/**
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
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
    /** @type {string} */
    let path = (req.query && typeof req.query.path === 'string') ? req.query.path : '';
    
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
    /** @type {Record<string, string>} */
    const headers = {
      'Accept': 'application/json'
    };

    // Copiar headers importantes del cliente (Authorization, etc.)
    const authHeader = req.headers && typeof req.headers.authorization === 'string' ? req.headers.authorization : null;
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const contentTypeHeader = req.headers && typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : null;
    if (contentTypeHeader) {
      headers['Content-Type'] = contentTypeHeader;
    }

    // Preparar opciones del fetch
    /** @type {RequestInit & { redirect?: RequestRedirect }} */
    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: /** @type {RequestRedirect} */ ('manual')
    };

    // Agregar body si existe (POST, PUT, etc.)
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      // Si es form-urlencoded, enviar como string
      if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        if (typeof req.body === 'string') {
          fetchOptions.body = req.body;
        } else if (typeof req.body === 'object' && req.body !== null) {
          fetchOptions.body = new URLSearchParams(/** @type {Record<string, string>} */ (req.body)).toString();
        }
      } else {
        // JSON u otro formato
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const bodyLength = fetchOptions.body ? (typeof fetchOptions.body === 'string' ? fetchOptions.body.length : 0) : 0;
    console.log(`[PROXY] Fetching with method: ${req.method}, body length: ${bodyLength}`);

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PROXY] Error:', errorMessage);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: errorMessage,
      type: 'proxy_error'
    });
  }
}

