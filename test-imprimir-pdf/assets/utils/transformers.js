/**
 * Transformadores de datos puros y testeables
 * 
 * Funciones puras para normalización y transformación de datos.
 * Todas las funciones deben ser:
 * - Puras (sin efectos secundarios)
 * - Testeables (fácilmente testeable con vitest)
 * - Documentadas con JSDoc con tipos definidos
 * 
 * Este módulo reexporta las funciones de normalizers.js para mantener
 * una interfaz consistente y facilitar la migración.
 * 
 * @module utils/transformers
 */

// Reexportar funciones de normalizers.js que ya están implementadas y testeadas
export {
  normalizarPuntoVenta,
  normalizarCliente,
  normalizarProducto,
  normalizarArray
} from './normalizers.js';

// Reexportar tipos para JSDoc
export { 
  /** @typedef {import('./normalizers.js').PuntoVentaRaw} PuntoVentaRaw */
  /** @typedef {import('./normalizers.js').PuntoVentaNormalizado} PuntoVentaNormalizado */
  /** @typedef {import('./normalizers.js').ClienteRaw} ClienteRaw */
  /** @typedef {import('./normalizers.js').ClienteNormalizado} ClienteNormalizado */
  /** @typedef {import('./normalizers.js').ProductoRaw} ProductoRaw */
  /** @typedef {import('./normalizers.js').ProductoNormalizado} ProductoNormalizado */
};
