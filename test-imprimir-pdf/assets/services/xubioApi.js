/**
 * Service Layer para centralizar todas las llamadas a la API de Xubio
 * 
 * Este servicio abstrae la comunicación con Xubio y proporciona métodos
 * tipados y consistentes para todas las operaciones.
 * 
 * @module services/xubioApi
 */

import useXubio from '../composables/useXubio.js';

/**
 * Cliente de API de Xubio
 * 
 * @typedef {Object} XubioApiClient
 * @property {(endpoint: string, method?: string, payload?: any, queryParams?: any) => Promise<{response: Response, data: any}>} request
 * @property {() => Promise<Array>} getPuntosVenta
 * @property {(payload: any) => Promise<{response: Response, data: any}>} crearFactura
 * @property {(transaccionId: string, tipoimpresion?: string) => Promise<{response: Response, data: any}>} obtenerPDF
 * @property {(payload: any) => Promise<{response: Response, data: any}>} crearCobranza
 */

/**
 * Crea un cliente de API de Xubio
 * 
 * @param {Function} obtenerToken - Función para obtener/renovar token
 * @param {Function} tokenValido - Función para verificar si el token es válido
 * @param {Function} getAccessToken - Función para obtener el accessToken actual
 * @returns {XubioApiClient} Cliente de API
 */
export function createXubioApiClient(obtenerToken, tokenValido, getAccessToken) {
  const { requestXubio } = useXubio(obtenerToken, tokenValido, getAccessToken);

  /**
   * Obtiene la lista de puntos de venta
   * 
   * @param {boolean} activo - Filtrar solo puntos de venta activos (default: 1)
   * @returns {Promise<Array>} Lista de puntos de venta
   */
  async function getPuntosVenta(activo = 1) {
    const { response, data } = await requestXubio('/puntoVentaBean', 'GET', null, { activo });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo puntos de venta: ${response.status} ${response.statusText}`);
    }
    
    return Array.isArray(data) ? data : [];
  }

  /**
   * Crea una factura
   * 
   * @param {Object} payload - Payload de la factura
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function crearFactura(payload) {
    return await requestXubio('/comprobanteVentaBean', 'POST', payload);
  }

  /**
   * Obtiene el PDF de un comprobante
   * 
   * @param {string} transaccionId - ID de la transacción
   * @param {string} tipoimpresion - Tipo de impresión (default: '1')
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function obtenerPDF(transaccionId, tipoimpresion = '1') {
    return await requestXubio(`/comprobanteVentaBean/${transaccionId}/pdf`, 'GET', null, { tipoimpresion });
  }

  /**
   * Crea una cobranza
   * 
   * @param {Object} payload - Payload de la cobranza
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function crearCobranza(payload) {
    return await requestXubio('/cobranzaBean', 'POST', payload);
  }

  return {
    request: requestXubio,
    getPuntosVenta,
    crearFactura,
    obtenerPDF,
    crearCobranza
  };
}
