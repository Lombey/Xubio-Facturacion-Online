/**
 * Helper específico para logging de llamadas a API
 * 
 * Facilita el testing y mapeo de endpoints mostrando claramente
 * qué se envía y qué se recibe en cada llamada.
 * 
 * @module utils/api-logger
 */

import { logger } from './logger.js';

/**
 * Logger especializado para llamadas a API
 * 
 * @example
 * ```javascript
 * import { apiLogger } from './utils/api-logger.js';
 * 
 * // En una llamada a API:
 * apiLogger.request('POST', '/Facturas', payload, headers);
 * apiLogger.response('POST', '/Facturas', response, 200);
 * apiLogger.error('POST', '/Facturas', error, payload);
 * ```
 */
export const apiLogger = {
  /**
   * Log de request a API
   * 
   * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
   * @param {string} endpoint - Endpoint de la API
   * @param {any} [payload=null] - Payload del request (opcional)
   * @param {Object} [headers={}] - Headers del request (opcional)
   * @param {Object} [queryParams=null] - Query params (opcional)
   */
  request: (method, endpoint, payload = null, headers = {}, queryParams = null) => {
    logger.group(`📤 API Request: ${method} ${endpoint}`, () => {
      logger.debug('Method', { method });
      logger.debug('Endpoint', { endpoint });
      
      if (queryParams) {
        logger.debug('Query Params', queryParams);
      }
      
      if (Object.keys(headers).length > 0) {
        // Ocultar token completo por seguridad, mostrar solo primeros caracteres
        const safeHeaders = { ...headers };
        if (safeHeaders.Authorization) {
          const authValue = safeHeaders.Authorization;
          safeHeaders.Authorization = authValue.substring(0, 20) + '...';
        }
        logger.debug('Headers', safeHeaders);
      }
      
      if (payload) {
        if (typeof payload === 'string') {
          try {
            const parsed = JSON.parse(payload);
            logger.debug('Payload (JSON)', parsed);
            logger.table('Payload Structure', parsed);
          } catch {
            logger.debug('Payload (String)', payload);
          }
        } else if (typeof payload === 'object') {
          logger.debug('Payload', payload);
          logger.table('Payload Structure', payload);
        } else {
          logger.debug('Payload', { value: payload, type: typeof payload });
        }
      } else {
        logger.debug('Payload', { value: 'null/empty' });
      }
    });
  },

  /**
   * Log de response de API
   * 
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {any} response - Response de la API
   * @param {number} status - Status code HTTP
   * @param {Object} [responseHeaders={}] - Headers de la respuesta (opcional)
   */
  response: (method, endpoint, response, status, responseHeaders = {}) => {
    const isSuccess = status >= 200 && status < 300;
    const logLevel = isSuccess ? 'info' : 'warn';
    
    logger.group(`📥 API Response: ${method} ${endpoint}`, () => {
      logger[logLevel](`Status: ${status} ${isSuccess ? '✅' : '⚠️'}`, { status });
      
      if (Object.keys(responseHeaders).length > 0) {
        logger.debug('Response Headers', responseHeaders);
      }
      
      if (response) {
        if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response);
            logger.debug('Response Body (JSON)', parsed);
            logger.table('Response Structure', parsed);
          } catch {
            logger.debug('Response Body (String)', response);
          }
        } else if (typeof response === 'object') {
          logger.debug('Response Body', response);
          
          // Si es un array pequeño, mostrar tabla
          if (Array.isArray(response) && response.length <= 10) {
            logger.table('Response Array', response);
          } 
          // Si es un objeto, mostrar tabla de propiedades principales
          else if (!Array.isArray(response)) {
            const mainProps = Object.keys(response).slice(0, 10);
            const summary = {};
            mainProps.forEach(key => {
              const value = response[key];
              summary[key] = Array.isArray(value) 
                ? `Array[${value.length}]` 
                : typeof value === 'object' && value !== null
                ? 'Object'
                : value;
            });
            logger.table('Response Summary', summary);
          }
        } else {
          logger.debug('Response Body', { value: response, type: typeof response });
        }
      }
    });
  },

  /**
   * Log de error en llamada a API
   * 
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {Error} error - Error ocurrido
   * @param {any} [payload=null] - Payload que se intentó enviar (opcional)
   * @param {number} [status=null] - Status code si está disponible (opcional)
   */
  error: (method, endpoint, error, payload = null, status = null) => {
    logger.group(`❌ API Error: ${method} ${endpoint}`, () => {
      if (status) {
        logger.error(`Status: ${status}`, null, { status });
      }
      
      logger.error('Error Details', error, {
        method,
        endpoint,
        errorName: error?.name,
        errorMessage: error?.message
      });
      
      if (error?.stack) {
        logger.debug('Stack Trace', { stack: error.stack });
      }
      
      if (payload) {
        logger.debug('Failed Request Payload', payload);
      }
    });
  },

  /**
   * Log completo de una llamada a API (request + response/error)
   * Útil para wrappear llamadas completas
   * 
   * @param {string} method - Método HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {Function} apiCall - Función que hace la llamada a API (async)
   * @param {any} [payload=null] - Payload del request (opcional)
   * @param {Object} [headers={}] - Headers del request (opcional)
   * @returns {Promise<any>} Resultado de la llamada a API
   * 
   * @example
   * ```javascript
   * const result = await apiLogger.wrap(
   *   'POST',
   *   '/Facturas',
   *   () => fetch('/api/proxy/Facturas', { method: 'POST', body: JSON.stringify(payload) }),
   *   payload,
   *   headers
   * );
   * ```
   */
  wrap: async (method, endpoint, apiCall, payload = null, headers = {}) => {
    apiLogger.request(method, endpoint, payload, headers);
    
    try {
      const result = await apiCall();
      
      // Intentar extraer status y response del resultado
      let status, response;
      if (result?.response) {
        status = result.response.status || result.response.statusCode;
        response = result.data || result.body || result;
      } else if (result?.status) {
        status = result.status;
        response = result.data || result.body || result;
      } else {
        status = 200; // Asumir éxito si no hay status
        response = result;
      }
      
      apiLogger.response(method, endpoint, response, status);
      return result;
    } catch (error) {
      const status = error?.response?.status || error?.status || null;
      apiLogger.error(method, endpoint, error, payload, status);
      throw error;
    }
  }
};
