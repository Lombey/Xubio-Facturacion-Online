/**
 * Validadores puros y testeables
 * 
 * Funciones puras para validación de datos de negocio.
 * Todas las funciones deben ser:
 * - Puras (sin efectos secundarios)
 * - Testeables (fácilmente testeable con vitest)
 * - Documentadas con JSDoc
 * 
 * @module utils/validators
 */

import { VALORES_ACTIVO } from './constants.js';

/**
 * @typedef {Object} PuntoVenta
 * @property {number|string|undefined} puntoVentaId
 * @property {number|string|undefined} ID
 * @property {number|string|undefined} id
 * @property {number|string|undefined} puntoVenta_id
 * @property {boolean|number|string|undefined} activo
 * @property {boolean|undefined} editable
 * @property {boolean|undefined} sugerido
 */

/**
 * Valida si un punto de venta es válido para crear facturas
 * 
 * Un punto de venta es válido si:
 * - Tiene un ID (puntoVentaId, ID, id, o puntoVenta_id)
 * - Está activo (activo === true, 1, '1', o undefined se considera activo)
 * - Es editable y sugerido (requerido por API de Xubio)
 * 
 * @param {PuntoVenta|null|undefined} puntoVenta - Punto de venta a validar
 * @param {boolean} modoPrueba - Si es true, solo valida que tenga ID (modo relajado)
 * @returns {boolean} true si el punto de venta es válido
 */
export function esPuntoVentaValido(puntoVenta, modoPrueba = false) {
  if (!puntoVenta) {
    return false;
  }

  // Obtener ID del punto de venta (puede venir en diferentes campos)
  const puntoVentaId = puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVenta_id;

  // Modo prueba: solo validar que tenga ID
  if (modoPrueba) {
    return !!puntoVentaId;
  }

  // Validación completa: debe tener ID, estar activo, y ser editable+sugerido
  if (!puntoVentaId) {
    return false;
  }

  // Verificar que esté activo (undefined se considera activo por defecto)
  const esActivo = puntoVenta.activo === undefined || 
                   puntoVenta.activo === VALORES_ACTIVO.ONE || 
                   puntoVenta.activo === VALORES_ACTIVO.ONE_STRING || 
                   puntoVenta.activo === VALORES_ACTIVO.TRUE;

  if (!esActivo) {
    return false;
  }

  // Debe ser editable Y sugerido (requerido por API de Xubio)
  const esValidoXubio = puntoVenta.editable && puntoVenta.sugerido;

  return esValidoXubio;
}

/**
 * @typedef {Object} Cliente
 * @property {number|string|undefined} cliente_id
 * @property {number|string|undefined} ID
 * @property {number|string|undefined} id
 * @property {string|undefined} razonSocial
 * @property {string|undefined} nombre
 */

/**
 * Valida si un cliente es válido
 * 
 * Un cliente es válido si tiene un ID y un nombre/razón social
 * 
 * @param {Cliente|null|undefined} cliente - Cliente a validar
 * @returns {boolean} true si el cliente es válido
 */
export function esClienteValido(cliente) {
  if (!cliente) {
    return false;
  }

  // Debe tener un ID
  const clienteId = cliente.cliente_id || cliente.ID || cliente.id;
  if (!clienteId) {
    return false;
  }

  // Debe tener nombre o razón social
  const tieneNombre = !!(cliente.razonSocial || cliente.nombre);

  return tieneNombre;
}

/**
 * @typedef {Object} Producto
 * @property {number|string|undefined} productoid
 * @property {number|string|undefined} ID
 * @property {number|string|undefined} id
 * @property {string|undefined} nombre
 * @property {string|undefined} codigo
 */

/**
 * Valida si un producto es válido
 * 
 * Un producto es válido si tiene un ID
 * 
 * @param {Producto|null|undefined} producto - Producto a validar
 * @returns {boolean} true si el producto es válido
 */
export function esProductoValido(producto) {
  if (!producto) {
    return false;
  }

  // Debe tener un ID
  const productoId = producto.productoid || producto.ID || producto.id;
  
  return !!productoId;
}
