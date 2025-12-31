/**
 * Normalizadores de datos de Xubio API
 * Convierte respuestas inconsistentes de la API a una interfaz consistente
 */

/**
 * @typedef {Object} ClienteRaw
 * @property {number} [cliente_id]
 * @property {number} [ID]
 * @property {number} [id]
 * @property {string} [razonSocial]
 * @property {string} [nombre]
 * @property {string} [codigo]
 * @property {string} [cuit]
 * @property {Object} [identificacionTributaria]
 * @property {string} [identificacionTributaria.numero]
 */

/**
 * @typedef {Object} ClienteNormalizado
 * @property {number | null} id
 * @property {string} name
 * @property {string} code
 * @property {string} cuit
 * @property {Object} metadata
 * @property {ClienteRaw} metadata.original
 * @property {string} [metadata.razonSocial]
 * @property {string} [metadata.nombre]
 * @property {Object} [metadata.identificacionTributaria]
 */

/**
 * Normaliza un cliente de Xubio a formato consistente
 * @param {ClienteRaw | null | undefined} clienteRaw - Cliente crudo de la API
 * @returns {ClienteNormalizado | null} Cliente normalizado
 */
export function normalizarCliente(clienteRaw) {
  if (!clienteRaw) return null;
  
  return {
    id: clienteRaw.cliente_id || clienteRaw.ID || clienteRaw.id || null,
    name: clienteRaw.razonSocial || clienteRaw.nombre || '',
    code: clienteRaw.codigo || '',
    cuit: clienteRaw.cuit || clienteRaw.identificacionTributaria?.numero || '',
    metadata: {
      original: clienteRaw, // Mantener referencia al objeto original
      razonSocial: clienteRaw.razonSocial,
      nombre: clienteRaw.nombre,
      identificacionTributaria: clienteRaw.identificacionTributaria
    }
  };
}

/**
 * @typedef {Object} ProductoRaw
 * @property {number} [productoid]
 * @property {number} [ID]
 * @property {number} [id]
 * @property {string} [nombre]
 * @property {string} [codigo]
 * @property {number} [precioAGDP]
 * @property {number} [precio]
 * @property {string} [descripcion]
 * @property {number} [tasaIva]
 * @property {number} [tasaIVA]
 */

/**
 * @typedef {Object} ProductoNormalizado
 * @property {number | null} id
 * @property {string} name
 * @property {string} code
 * @property {number} price
 * @property {string} description
 * @property {Object} metadata
 * @property {ProductoRaw} metadata.original
 * @property {number} [metadata.precioAGDP]
 * @property {number} [metadata.precio]
 * @property {number} [metadata.tasaIVA]
 */

/**
 * Normaliza un producto de Xubio a formato consistente
 * @param {ProductoRaw | null | undefined} productoRaw - Producto crudo de la API
 * @returns {ProductoNormalizado | null} Producto normalizado
 */
export function normalizarProducto(productoRaw) {
  if (!productoRaw) return null;
  
  return {
    id: productoRaw.productoid || productoRaw.ID || productoRaw.id || null,
    name: productoRaw.nombre || '',
    code: productoRaw.codigo || '',
    price: productoRaw.precioAGDP || productoRaw.precio || 0,
    description: productoRaw.descripcion || productoRaw.nombre || '',
    metadata: {
      original: productoRaw,
      precioAGDP: productoRaw.precioAGDP,
      precio: productoRaw.precio,
      tasaIVA: productoRaw.tasaIva || productoRaw.tasaIVA
    }
  };
}

/**
 * @typedef {Object} PuntoVentaRaw
 * @property {number} [puntoVentaId]
 * @property {number} [ID]
 * @property {number} [id]
 * @property {string} [nombre]
 * @property {string} [codigo]
 * @property {string} [puntoVenta]
 * @property {boolean} [editable]
 * @property {boolean} [sugerido]
 * @property {boolean} [editableSugerido]
 * @property {string} [modoNumeracion]
 */

/**
 * @typedef {Object} PuntoVentaNormalizado
 * @property {number | null} id
 * @property {string} name
 * @property {string} code
 * @property {boolean} editable
 * @property {boolean} sugerido
 * @property {boolean} editableSugerido
 * @property {string} modoNumeracion
 * @property {Object} metadata
 * @property {PuntoVentaRaw} metadata.original
 */

/**
 * Normaliza un punto de venta de Xubio
 * @param {PuntoVentaRaw | null | undefined} puntoVentaRaw - Punto de venta crudo de la API
 * @returns {PuntoVentaNormalizado | null} Punto de venta normalizado
 */
export function normalizarPuntoVenta(puntoVentaRaw) {
  if (!puntoVentaRaw) return null;
  
  // Mapeo de modoNumeracion basado en datos reales:
  // "1" suele ser "automatico"
  // "editablesugerido" es el valor requerido
  const modo = String(puntoVentaRaw.modoNumeracion || '').toLowerCase();
  const esEditableSugerido = modo === 'editablesugerido' || modo === '2'; // '2' es el estándar para manual/sugerido
  
  return {
    id: puntoVentaRaw.puntoVentaId || puntoVentaRaw.ID || puntoVentaRaw.id || null,
    name: puntoVentaRaw.nombre || '',
    code: puntoVentaRaw.codigo || puntoVentaRaw.puntoVenta || '',
    // Si la API no envía el flag booleano, nos basamos en el modo de numeración
    editable: puntoVentaRaw.editable !== undefined ? puntoVentaRaw.editable : esEditableSugerido,
    sugerido: puntoVentaRaw.sugerido !== undefined ? puntoVentaRaw.sugerido : esEditableSugerido,
    modoNumeracion: puntoVentaRaw.modoNumeracion === "1" ? "Automático (1)" : (puntoVentaRaw.modoNumeracion || 'N/A'),
    metadata: {
      original: puntoVentaRaw
    }
  };
}

/**
 * Normaliza un array de items
 * @template T
 * @template R
 * @param {T[] | null | undefined} itemsRaw - Array de items crudos
 * @param {(item: T) => R | null} normalizer - Función normalizadora
 * @returns {R[]} Array de items normalizados (sin nulls)
 */
export function normalizarArray(itemsRaw, normalizer) {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw.map(normalizer).filter(/** @param {R | null} item */ (item) => item !== null);
}
