/**
 * Debounce function - retrasa la ejecución hasta que no haya más llamadas
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait = 300) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null;
  
  /**
   * @param {any[]} args
   */
  return function executedFunction(...args) {
    /** @type {() => void} */
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

