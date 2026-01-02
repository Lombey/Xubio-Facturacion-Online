/**
 * Composable para código de diagnóstico y debug
 * 
 * Mueve el código de debug fuera de app.js para mantener
 * el código de producción limpio.
 * 
 * @module composables/useDiagnostico
 */

import { VALORES_ACTIVO, CAMPOS_DIAGNOSTICO } from '../utils/constants.js';

/**
 * Composable para diagnóstico
 * 
 * @returns {Object} Funciones de diagnóstico
 */
export function useDiagnostico() {
  // Estado interno del log
  const logDiagnostico = [];

  /**
   * Evalúa un valor como booleano (maneja strings, numbers, booleans)
   * 
   * @param {any} valor - Valor a evaluar
   * @returns {boolean}
   */
  function evaluarBooleano(valor) {
    if (valor === VALORES_ACTIVO.TRUE || 
        valor === VALORES_ACTIVO.ONE || 
        valor === VALORES_ACTIVO.ONE_STRING || 
        valor === VALORES_ACTIVO.TRUE_STRING || 
        valor === VALORES_ACTIVO.TRUE_UPPER || 
        valor === VALORES_ACTIVO.TRUE_TITLE) {
      return true;
    }
    return false;
  }

  /**
   * Evalúa el estado editable-sugerido actual de un punto de venta
   * 
   * @param {Object|null} puntoVenta - Punto de venta a evaluar
   * @returns {string}
   */
  function evaluarEditableSugeridoActual(puntoVenta) {
    if (!puntoVenta) return 'N/A';
    const esEditable = evaluarBooleano(puntoVenta.editable) || evaluarBooleano(puntoVenta.editableSugerido);
    const esSugerido = evaluarBooleano(puntoVenta.sugerido) || evaluarBooleano(puntoVenta.editableSugerido);
    return `Editable: ${esEditable}, Sugerido: ${esSugerido}`;
  }

  /**
   * Agrega una entrada al log de diagnóstico
   * 
   * @param {string} mensaje - Mensaje del log
   * @param {boolean} exito - Si la operación fue exitosa
   */
  function agregarLog(mensaje, exito = true) {
    logDiagnostico.unshift({
      mensaje: `[${new Date().toLocaleTimeString()}] ${mensaje}`,
      exito,
      timestamp: new Date()
    });
  }

  /**
   * Limpia el log de diagnóstico
   */
  function limpiarLog() {
    logDiagnostico.length = 0;
  }

  /**
   * Prueba un campo ID específico en un punto de venta
   * 
   * @param {Object} puntoVenta - Punto de venta a probar
   * @param {string} campo - Campo a probar
   */
  function probarCampoId(puntoVenta, campo) {
    const valor = campo === CAMPOS_DIAGNOSTICO.AUTO 
      ? (puntoVenta?.puntoVentaId || puntoVenta?.ID || puntoVenta?.id || puntoVenta?.puntoVenta_id) 
      : puntoVenta?.[campo];

    agregarLog(`Probando campo ID: ${campo} = ${valor}`, !!valor);
    console.log(`🔧 Diagnóstico PV - Probando campo ID: ${campo}`, { campo, valor, puntoVenta });
  }

  /**
   * Prueba un campo editable/sugerido específico en un punto de venta
   * 
   * @param {Object} puntoVenta - Punto de venta a probar
   * @param {string} campo - Campo a probar
   */
  function probarCampoEditable(puntoVenta, campo) {
    let valor;

    if (campo === CAMPOS_DIAGNOSTICO.AUTO) {
      valor = evaluarEditableSugeridoActual(puntoVenta);
    } else if (campo === CAMPOS_DIAGNOSTICO.EDITABLE_SUGERIDO) {
      valor = `editable=${puntoVenta?.editable}, sugerido=${puntoVenta?.sugerido}`;
    } else if (campo === CAMPOS_DIAGNOSTICO.FORZAR_TRUE) {
      valor = 'FORZADO a true';
    } else {
      valor = puntoVenta?.[campo];
    }

    const exito = campo === CAMPOS_DIAGNOSTICO.FORZAR_TRUE || evaluarBooleano(valor);
    agregarLog(`Probando campo Editable: ${campo} = ${valor}`, exito);
    console.log(`🔧 Diagnóstico PV - Probando campo Editable: ${campo}`, { campo, valor, puntoVenta });
  }

  return {
    // Estado
    get logDiagnostico() {
      return [...logDiagnostico]; // Retornar copia
    },
    
    // Métodos
    evaluarBooleano,
    evaluarEditableSugeridoActual,
    agregarLog,
    limpiarLog,
    probarCampoId,
    probarCampoEditable
  };
}
