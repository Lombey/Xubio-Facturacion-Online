/**
 * Filtros de dominio - Lógica de negocio separada de UI
 * Reutilizable en componentes, modales, procesos en segundo plano, etc.
 */

import { formatearCUIT } from './formatters.js';

/**
 * @typedef {Object} ClienteParaFiltro
 * @property {string} [name]
 * @property {string} [razonSocial]
 * @property {string} [nombre]
 * @property {string} [cuit]
 * @property {Object} [metadata]
 * @property {Object} [metadata.original]
 * @property {string} [metadata.original.cuit]
 * @property {Object} [metadata.original.identificacionTributaria]
 * @property {string} [metadata.original.identificacionTributaria.numero]
 */

/**
 * Filtra clientes según búsqueda (por CUIT, razón social o nombre)
 * @param {ClienteParaFiltro[] | null | undefined} clientes - Array de clientes (normalizados o crudos)
 * @param {string | null | undefined} busqueda - Texto de búsqueda
 * @returns {ClienteParaFiltro[] | null | undefined} Array de clientes filtrados
 */
export function filtrarClientes(clientes, busqueda) {
  if (!Array.isArray(clientes) || !busqueda || !busqueda.trim()) {
    return clientes;
  }
  
  const busquedaLower = busqueda.toLowerCase().replace(/[-\s]/g, '');
  
  return clientes.filter(c => {
    // Manejar tanto clientes normalizados como crudos
    const razonSocial = (c.name || c.razonSocial || c.nombre || '').toLowerCase().replace(/[-\s]/g, '');
    const nombre = (c.nombre || '').toLowerCase().replace(/[-\s]/g, '');
    const cuit = formatearCUIT(c.cuit || c.metadata?.original?.cuit || c.metadata?.original?.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
    const cuitSinFormato = (c.cuit || c.metadata?.original?.cuit || c.metadata?.original?.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
    
    return razonSocial.includes(busquedaLower) || 
           nombre.includes(busquedaLower) || 
           cuit.includes(busquedaLower) ||
           cuitSinFormato.includes(busquedaLower);
  });
}

/**
 * @typedef {Object} ProductoParaFiltro
 * @property {string} [name]
 * @property {string} [nombre]
 * @property {string} [code]
 * @property {string} [codigo]
 * @property {string} [description]
 * @property {string} [descripcion]
 */

/**
 * Filtra productos según búsqueda (por nombre, código o descripción)
 * @param {ProductoParaFiltro[] | null | undefined} productos - Array de productos (normalizados o crudos)
 * @param {string | null | undefined} busqueda - Texto de búsqueda
 * @returns {ProductoParaFiltro[] | null | undefined} Array de productos filtrados
 */
export function filtrarProductos(productos, busqueda) {
  if (!Array.isArray(productos) || !busqueda || !busqueda.trim()) {
    return productos;
  }
  
  const busquedaLower = busqueda.toLowerCase();
  
  return productos.filter(p => {
    // Manejar tanto productos normalizados como crudos
    const nombre = (p.name || p.nombre || '').toLowerCase();
    const codigo = (p.code || p.codigo || '').toLowerCase();
    const descripcion = (p.description || p.descripcion || '').toLowerCase();
    
    return nombre.includes(busquedaLower) || 
           codigo.includes(busquedaLower) || 
           descripcion.includes(busquedaLower);
  });
}

/**
 * @typedef {Object} PuntoVentaParaFiltro
 * @property {string} [nombre]
 * @property {string} [codigo]
 * @property {string} [puntoVenta]
 * @property {number} [puntoVentaId]
 * @property {number} [ID]
 * @property {number} [id]
 * @property {boolean} [editable]
 * @property {boolean} [sugerido]
 * @property {boolean} [editableSugerido]
 */

/**
 * Filtra puntos de venta según búsqueda (por nombre, código o punto de venta)
 * Solo muestra puntos editable-sugerido (requerido por la API)
 * @param {PuntoVentaParaFiltro[] | null | undefined} puntosDeVenta - Array de puntos de venta
 * @param {string | null | undefined} busqueda - Texto de búsqueda
 * @returns {PuntoVentaParaFiltro[] | null | undefined} Array de puntos de venta filtrados (solo editable-sugerido)
 */
export function filtrarPuntosDeVenta(puntosDeVenta, busqueda) {
  if (!Array.isArray(puntosDeVenta)) {
    return [];
  }
  
  // Primero filtrar solo puntos editable-sugerido (requerido por la API)
  const puntosEditableSugerido = puntosDeVenta.filter(pv => {
    const esEditable = pv.editable === true || pv.editable === 1 || pv.editableSugerido === true || pv.editableSugerido === 1;
    const esSugerido = pv.sugerido === true || pv.sugerido === 1 || pv.editableSugerido === true || pv.editableSugerido === 1;
    return (esEditable && esSugerido) || (pv.editableSugerido === true || pv.editableSugerido === 1);
  });
  
  // Si no hay búsqueda, retornar todos los editable-sugerido
  if (!busqueda || !busqueda.trim()) {
    return puntosEditableSugerido;
  }
  
  // Filtrar por búsqueda
  const busquedaLower = busqueda.toLowerCase();
  
  return puntosEditableSugerido.filter(pv => {
    const nombre = (pv.nombre || '').toLowerCase();
    const codigo = (pv.codigo || '').toLowerCase();
    const puntoVenta = (pv.puntoVenta || '').toLowerCase();
    const id = String(pv.puntoVentaId || pv.ID || pv.id || '').toLowerCase();
    
    return nombre.includes(busquedaLower) || 
           codigo.includes(busquedaLower) || 
           puntoVenta.includes(busquedaLower) ||
           id.includes(busquedaLower);
  });
}
