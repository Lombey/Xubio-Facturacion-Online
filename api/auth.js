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

  // Validación mejorada de credenciales
  if (!clientId || !secretId) {
    console.log(JSON.stringify({
      event: 'auth_validation_failed',
      reason: 'missing_credentials',
      has_clientId: !!clientId,
      has_secretId: !!secretId
    }));
    
    return res.status(400).json({ 
      error: 'Missing credentials',
      message: 'clientId and secretId are required' 
    });
  }
  
  // Validación básica de formato (no vacíos después de trim)
  const trimmedClientId = String(clientId).trim();
  const trimmedSecretId = String(secretId).trim();
  
  if (!trimmedClientId || !trimmedSecretId) {
    console.log(JSON.stringify({
      event: 'auth_validation_failed',
      reason: 'empty_credentials_after_trim'
    }));
    
    return res.status(400).json({ 
      error: 'Invalid credentials',
      message: 'clientId and secretId cannot be empty' 
    });
  }

  const startTime = Date.now();
  
  try {
    // Construir Basic Auth EN EL SERVIDOR (nunca en el cliente)
    // Usar valores validados y trimmeados
    const basic = Buffer.from(`${trimmedClientId}:${trimmedSecretId}`).toString('base64');
    
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
      // Logging estructurado para errores de autenticación
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        event: 'auth_failed',
        duration_ms: duration,
        status: response.status,
        error_type: data.error || 'unknown'
      }));
      
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

    // Logging estructurado simple (útil para debugging en Vercel)
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      event: 'auth_success',
      duration_ms: duration,
      expires_in: data.expires_in || 3600
    }));

    // Devolver solo el token, nunca las credenciales
    return res.status(200).json({
      access_token: data.access_token || data.token,
      expires_in: data.expires_in || 3600
    });
  } catch (error) {
    // No loguear credenciales en consola
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    
    // Logging estructurado para errores de red/sistema
    console.error(JSON.stringify({
      event: 'auth_error',
      duration_ms: duration,
      error: errorMessage,
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError'
    }));
    
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

