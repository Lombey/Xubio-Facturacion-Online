// /api/auth.js
// Endpoint específico para autenticación con Xubio
// Mueve la construcción de Basic Auth al servidor para mayor seguridad

/**
 * @typedef {Object} VercelRequest
 * @property {string} method
 * @property {any} body
 * @property {Record<string, string>} headers
 * @property {string} url
 */

/**
 * @typedef {Object} VercelResponse
 * @property {(status: number) => VercelResponse} status
 * @property {(data: any) => void} json
 * @property {(data: any) => void} send
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Recibir credenciales del cliente en el body
  /** @type {{ clientId?: string, secretId?: string }} */
  const body = req.body || {};
  const clientId = body.clientId;
  const secretId = body.secretId;

  if (!clientId || !secretId) {
    return res.status(400).json({ 
      error: 'Missing credentials: clientId and secretId are required' 
    });
  }

  try {
    // Construir Basic Auth EN EL SERVIDOR (nunca en el cliente)
    const basic = Buffer.from(`${clientId}:${secretId}`).toString('base64');
    
    const response = await fetch('https://xubio.com/API/1.1/TokenEndpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'grant_type=client_credentials'
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Si la respuesta no es JSON válido, devolver error genérico
      return res.status(response.status).json({ 
        error: 'Failed to obtain token',
        message: 'Invalid response from authentication service'
      });
    }

    if (!response.ok) {
      // No exponer detalles sensibles en el error
      return res.status(response.status).json({ 
        error: 'Failed to obtain token',
        message: data.error_description || data.error || 'Authentication failed'
      });
    }

    // Establecer headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    // Devolver solo el token, nunca las credenciales
    return res.status(200).json({
      access_token: data.access_token || data.token,
      expires_in: data.expires_in || 3600
    });
  } catch (error) {
    // No loguear credenciales en consola
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AUTH] Error obtaining token:', errorMessage);
    
    // Establecer headers CORS también en caso de error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process authentication request'
    });
  }
}

