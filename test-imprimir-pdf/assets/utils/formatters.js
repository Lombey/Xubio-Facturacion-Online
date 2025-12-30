/**
 * Utilidades de formateo reutilizables
 * Extraídas de app.js
 */

/**
 * Formatea mensajes con saltos de línea HTML
 * @param {string} mensaje
 * @returns {string}
 */
export function formatoMensaje(mensaje) {
  return mensaje ? mensaje.replace(/\n/g, '<br>') : '';
}

/**
 * Formatea un precio a 2 decimales
 * @param {number|string} precio
 * @returns {string}
 */
export function formatearPrecio(precio) {
  if (!precio || precio === 0) {
    return '0.00';
  }
  return parseFloat(String(precio)).toFixed(2);
}

/**
 * Formatea un CUIT con guiones (formato: XX-XXXXXXXX-X)
 * @param {string} cuit - CUIT sin formato o con formato
 * @returns {string} CUIT formateado
 */
export function formatearCUIT(cuit) {
  if (!cuit) return '';
  
  // Remover todos los caracteres no numéricos
  const soloNumeros = cuit.toString().replace(/\D/g, '');
  
  // Si tiene 11 dígitos, formatear como XX-XXXXXXXX-X
  if (soloNumeros.length === 11) {
    return `${soloNumeros.substring(0, 2)}-${soloNumeros.substring(2, 10)}-${soloNumeros.substring(10, 11)}`;
  }
  
  // Si tiene menos de 11 dígitos pero es válido, devolver sin formato
  if (soloNumeros.length > 0 && soloNumeros.length < 11) {
    return soloNumeros;
  }
  
  // Si ya está formateado correctamente, devolverlo tal cual
  if (cuit.match(/^\d{2}-\d{8}-\d{1}$/)) {
    return cuit;
  }
  
  return cuit; // Devolver original si no coincide con ningún patrón
}

/**
 * Formatea un número con separadores de miles (locale es-AR)
 * @param {number|string} numero
 * @returns {string}
 */
export function formatearNumero(numero) {
  return parseFloat(String(numero || 0)).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

