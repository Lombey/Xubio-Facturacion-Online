const BCRA_BASE_URL = 'https://api.bcra.gob.ar';

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
 * Proxy para la API del BCRA
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
      path = req.url.replace('/api/bcra', '').replace(/^\//, '');
    }
    
    // Si aún no hay path, retornar error
    if (!path) {
      return res.status(400).json({
        error: 'Path is required',
        message: 'Debe proporcionar un path en el query parameter "path"'
      });
    }
    
    // Asegurar que el path empiece con /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Construir URL completa del BCRA
    let url = `${BCRA_BASE_URL}${path}`;
    
    // Pasar los query params a la URL del BCRA (excluyendo 'path' que es solo para el proxy)
    if (req.query && typeof req.query === 'object') {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== 'path' && value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    console.log(`[BCRA PROXY] ${req.method} ${url} (path: ${path})`);

    // Preparar headers
    /** @type {Record<string, string>} */
    const headers = {
      'Accept': 'application/json'
    };

    // Preparar opciones del fetch
    /** @type {RequestInit & { redirect?: RequestRedirect }} */
    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: /** @type {RequestRedirect} */ ('manual')
    };

    // Agregar body si existe (POST, PUT, etc.)
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        if (typeof req.body === 'string') {
          fetchOptions.body = req.body;
        } else if (typeof req.body === 'object' && req.body !== null) {
          fetchOptions.body = new URLSearchParams(/** @type {Record<string, string>} */ (req.body)).toString();
        }
      } else {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    // Hacer la petición al BCRA
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

    console.log(`[BCRA PROXY] Response status: ${response.status}, content-type: ${contentType}`);

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
    console.error('[BCRA PROXY] Error:', errorMessage);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: errorMessage,
      type: 'bcra_proxy_error'
    });
  }
}

