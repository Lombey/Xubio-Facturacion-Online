/**
 * Composable para gestionar Cobranzas/Pagos
 * 
 * Separa la lógica de cobranzas del componente principal.
 * 
 * @module composables/useCobranzas
 */

/**
 * Estados de cobranza
 * @typedef {'borrador'|'procesando'|'completada'|'error'} EstadoCobranza
 */

/**
 * Composable para gestionar cobranzas
 * 
 * @param {Object} apiClient - Cliente de API de Xubio
 * @returns {Object} Funciones y estado relacionados con cobranzas
 */
export function useCobranzas(apiClient) {
  // Estado interno
  let estado = 'borrador'; // 'borrador' | 'procesando' | 'completada' | 'error'
  let cobranzaActual = null;
  let errorActual = null;

  /**
   * Valida si se puede crear una cobranza
   * 
   * @param {Object} datosCobranza - Datos de la cobranza a validar
   * @param {string} datosCobranza.clienteId - ID del cliente
   * @param {string} datosCobranza.comprobanteId - ID del comprobante
   * @param {number} datosCobranza.importe - Importe de la cobranza
   * @param {string} datosCobranza.formaPago - Forma de pago
   * @returns {{valido: boolean, errores: string[]}}
   */
  function validarCobranza(datosCobranza) {
    const errores = [];

    if (!datosCobranza.clienteId) {
      errores.push('Cliente no seleccionado');
    }

    if (!datosCobranza.comprobanteId) {
      errores.push('Comprobante no seleccionado');
    }

    const importe = parseFloat(datosCobranza.importe);
    if (!importe || importe <= 0) {
      errores.push('Importe inválido');
    }

    if (!datosCobranza.formaPago) {
      errores.push('Forma de pago no seleccionada');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Crea una cobranza
   * 
   * @param {Object} payload - Payload de la cobranza
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function crearCobranza(payload) {
    estado = 'procesando';
    errorActual = null;

    try {
      const resultado = await apiClient.crearCobranza(payload);
      
      if (resultado.response.ok) {
        estado = 'completada';
        cobranzaActual = resultado.data;
        return resultado;
      } else {
        estado = 'error';
        errorActual = resultado.data;
        throw new Error(`Error creando cobranza: ${resultado.response.status} ${resultado.response.statusText}`);
      }
    } catch (error) {
      estado = 'error';
      errorActual = error;
      throw error;
    }
  }

  /**
   * Obtiene el PDF de una cobranza
   * 
   * @param {string} transaccionId - ID de la transacción
   * @param {string} tipoimpresion - Tipo de impresión (default: '1')
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function obtenerPDF(transaccionId, tipoimpresion = '1') {
    return await apiClient.obtenerPDF(transaccionId, tipoimpresion);
  }

  /**
   * Resetea el estado de la cobranza
   */
  function reset() {
    estado = 'borrador';
    cobranzaActual = null;
    errorActual = null;
  }

  return {
    // Estado (getters)
    get estado() {
      return estado;
    },
    get cobranzaActual() {
      return cobranzaActual;
    },
    get errorActual() {
      return errorActual;
    },
    
    // Métodos
    validarCobranza,
    crearCobranza,
    obtenerPDF,
    reset
  };
}
