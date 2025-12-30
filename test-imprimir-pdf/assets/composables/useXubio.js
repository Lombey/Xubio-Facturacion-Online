/**
 * Composable para interactuar con la API de Xubio
 * Extraído de app.js (líneas 608-668)
 */

const PROXY_BASE = '/api/proxy';

/**
 * Crea un cliente Xubio
 * @param {Function} obtenerToken - Función para obtener/renovar token
 * @param {Function} tokenValido - Función para verificar si el token es válido
 * @param {Function} getAccessToken - Función para obtener el accessToken actual
 * @returns {Object} Cliente con método requestXubio
 */
export function useXubio(obtenerToken, tokenValido, getAccessToken) {
  /**
   * Realiza una petición a la API de Xubio a través del proxy
   * @param {string} endpoint - Endpoint de la API (ej: '/comprobanteVentaBean')
   * @param {string} method - Método HTTP ('GET', 'POST', etc.)
   * @param {object|null} payload - Payload para POST/PUT
   * @param {object|null} queryParams - Parámetros de query string
   * @returns {Promise<{response: Response, data: object}>}
   */
  async function requestXubio(endpoint, method = 'GET', payload = null, queryParams = null) {
    // Verificar y renovar token si es necesario
    if (!tokenValido()) {
      await obtenerToken(true);
    }

    // Construir URL usando el proxy
    let url = `${PROXY_BASE}${endpoint}`;
    
    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url += '?' + params.toString();
    }

    const accessToken = getAccessToken();
    /** @type {Record<string, string>} */
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    };

    if (method !== 'GET' && payload) {
      headers['Content-Type'] = 'application/json';
    }

    /** @type {RequestInit} */
    const options = {
      method: method,
      headers: headers,
      body: method !== 'GET' && payload ? JSON.stringify(payload) : undefined
    };

    console.log('🔍 Request Xubio:', { url, method, payload: payload ? JSON.stringify(payload).substring(0, 200) : null });

    try {
      const response = await fetch(url, options);
      
      console.log('📥 Response recibida:', response.status, response.statusText);

      let data;
      try {
        const text = await response.text();
        console.log('📄 Response body (primeros 500 chars):', text.substring(0, 500));
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`Error parseando respuesta JSON: ${errorMessage}`);
      }

      // Si el token expiró, renovar y reintentar
      if (response.status === 401) {
        console.log('🔄 Token expirado, renovando...');
        await obtenerToken(true);
        const newAccessToken = getAccessToken();
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        options.headers = headers;
        const retryResponse = await fetch(url, options);
        const retryText = await retryResponse.text();
        const retryData = retryText ? JSON.parse(retryText) : null;
        return { response: retryResponse, data: retryData };
      }

      return { response, data };
    } catch (error) {
      console.error('❌ Error en fetch:', error);
      throw error;
    }
  }

  return {
    requestXubio
  };
}

export default useXubio;

