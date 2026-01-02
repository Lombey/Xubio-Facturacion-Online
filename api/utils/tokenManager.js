/**
 * Token Manager - Vercel Serverless
 * 
 * Gestiona la obtención y el cacheo del Bearer Token oficial de Xubio.
 */

let cachedToken = null;
let tokenExpiry = null;

/**
 * Obtiene un token de acceso oficial de Xubio.
 * Usa cache en memoria mientras el proceso de Vercel esté vivo.
 */
export async function getOfficialToken() {
  // 1. Verificar cache
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('🎫 [AUTH] Usando token oficial del cache');
    return cachedToken;
  }

  const clientId = process.env.XUBIO_CLIENT_ID;
  const secretId = process.env.XUBIO_SECRET_ID;

  if (!clientId || !secretId) {
    throw new Error('Variables de entorno XUBIO_CLIENT_ID o XUBIO_SECRET_ID no configuradas en Vercel');
  }

  console.log('🎫 [AUTH] Solicitando nuevo token a Xubio...');

  const basic = Buffer.from(`${clientId.trim()}:${secretId.trim()}`).toString('base64');
  
  const response = await fetch('https://xubio.com/API/1.1/TokenEndpoint', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en autenticación Xubio (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token || data.token;
  
  if (!token) {
    throw new Error('No se recibió access_token en la respuesta de Xubio');
  }

  // Cachear (Xubio suele dar 3600s, guardamos 50 min para seguridad)
  cachedToken = token;
  const expiresIn = parseInt(data.expires_in || 3600, 10);
  tokenExpiry = Date.now() + (expiresIn * 0.9 * 1000); 

  console.log('🎫 [AUTH] Token obtenido y cacheado');
  return token;
}
