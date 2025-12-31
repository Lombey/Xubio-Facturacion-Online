/**
 * Composable para gestionar Facturas
 * 
 * Centraliza la lógica de creación, validación y generación de PDFs
 * para facturas.
 * 
 * @module composables/useFacturas
 */

import { esClienteValido, esPuntoVentaValido } from '../utils/validators.js';
import { MONEDAS } from '../utils/constants.js';

/**
 * Estados de factura
 * @typedef {'borrador'|'procesando'|'completada'|'error'} EstadoFactura
 */

/**
 * Composable para gestionar facturas
 * 
 * @param {Object} apiClient - Cliente de API de Xubio
 * @returns {Object} Funciones y estado relacionados con facturas
 */
export function useFacturas(apiClient) {
  // Estado interno
  let estado = 'borrador'; // 'borrador' | 'procesando' | 'completada' | 'error'
  let facturaActual = null;
  let errorActual = null;

  /**
   * Valida si se puede crear una factura
   * 
   * @param {Object} datosFactura - Datos de la factura a validar
   * @param {Object} datosFactura.cliente - Cliente seleccionado
   * @param {string} datosFactura.clienteId - ID del cliente
   * @param {Object} datosFactura.puntoVenta - Punto de venta seleccionado
   * @param {string} datosFactura.moneda - Moneda seleccionada
   * @param {string} datosFactura.cotizacion - Cotización (si es moneda extranjera)
   * @param {Array} datosFactura.productos - Productos seleccionados
   * @param {string} datosFactura.jsonManual - JSON manual (opcional)
   * @returns {{valido: boolean, errores: string[]}}
   */
  function validarFactura(datosFactura) {
    const errores = [];

    // Validar cliente
    if (!esClienteValido(datosFactura.cliente) || !datosFactura.clienteId) {
      errores.push('Cliente no válido o no seleccionado');
    }

    // Validar punto de venta
    if (!esPuntoVentaValido(datosFactura.puntoVenta, false)) {
      errores.push('Punto de venta no válido (debe ser activo, editable y sugerido)');
    }

    // Validar productos o JSON manual
    if (!datosFactura.jsonManual?.trim() && (!datosFactura.productos || datosFactura.productos.length === 0)) {
      errores.push('Debe seleccionar productos o proporcionar JSON manual');
    }

    // Validar moneda
    if (!datosFactura.moneda) {
      errores.push('Moneda no seleccionada');
    }

    // Validar cotización si es moneda extranjera
    if (datosFactura.moneda && 
        datosFactura.moneda !== MONEDAS.ARS && 
        datosFactura.moneda !== MONEDAS.PESOS_ARGENTINOS) {
      const cotizacion = parseFloat(datosFactura.cotizacion);
      if (!cotizacion || cotizacion <= 0) {
        errores.push('Cotización inválida para moneda extranjera');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Crea una factura
   * 
   * @param {Object} payload - Payload de la factura
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function crearFactura(payload) {
    estado = 'procesando';
    errorActual = null;

    try {
      const resultado = await apiClient.crearFactura(payload);
      
      if (resultado.response.ok) {
        estado = 'completada';
        facturaActual = resultado.data;
        return resultado;
      } else {
        estado = 'error';
        errorActual = resultado.data;
        throw new Error(`Error creando factura: ${resultado.response.status} ${resultado.response.statusText}`);
      }
    } catch (error) {
      estado = 'error';
      errorActual = error;
      throw error;
    }
  }

  /**
   * Obtiene el PDF de una factura
   * 
   * @param {string} transaccionId - ID de la transacción
   * @param {string} tipoimpresion - Tipo de impresión (default: '1')
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function obtenerPDF(transaccionId, tipoimpresion = '1') {
    return await apiClient.obtenerPDF(transaccionId, tipoimpresion);
  }

  /**
   * Resetea el estado de la factura
   */
  function reset() {
    estado = 'borrador';
    facturaActual = null;
    errorActual = null;
  }

  return {
    // Estado (getters)
    get estado() {
      return estado;
    },
    get facturaActual() {
      return facturaActual;
    },
    get errorActual() {
      return errorActual;
    },
    
    // Métodos
    validarFactura,
    crearFactura,
    obtenerPDF,
    reset
  };
}
