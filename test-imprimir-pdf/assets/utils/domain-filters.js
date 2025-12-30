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
