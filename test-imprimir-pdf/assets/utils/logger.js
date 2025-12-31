/**
 * Logger estructurado para reemplazar console.log disperso
 * 
 * Este módulo proporciona logging estructurado con niveles y contexto,
 * reemplazando las 118+ llamadas a console.log/debug/warn/error dispersas
 * en app.js.
 * 
 * @module utils/logger
 */

/**
 * Niveles de logging disponibles
 * @enum {number}
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

/**
 * Determina el nivel de logging según el entorno
 * - Desarrollo: DEBUG (muestra todo)
 * - Producción: INFO (oculta DEBUG)
 * 
 * @type {number}
 */
const getCurrentLevel = () => {
  // En desarrollo, mostrar todo
  if (import.meta.env.DEV) {
    return LOG_LEVELS.DEBUG;
  }
  
  // En producción, solo INFO y superiores
  return LOG_LEVELS.INFO;
};

/**
 * Formatea un mensaje de log con contexto estructurado
 * 
 * @param {string} level - Nivel del log (DEBUG, INFO, WARN, ERROR)
 * @param {string} message - Mensaje principal
 * @param {Object} context - Contexto adicional (opcional)
 * @returns {string} Mensaje formateado
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` | Context: ${JSON.stringify(context)}`
    : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
};

/**
 * Logger estructurado
 * 
 * @example
 * ```javascript
 * import { logger } from './utils/logger.js';
 * 
 * logger.debug('Cargando productos', { clienteId: '123' });
 * logger.info('Factura creada exitosamente', { transaccionId: '456' });
 * logger.warn('Token próximo a expirar', { expiresIn: 60 });
 * logger.error('Error al crear factura', error, { endpoint: '/Facturas' });
 * ```
 */
export const logger = {
  /**
   * Log de nivel DEBUG
   * Solo visible en desarrollo
   * 
   * @param {string} message - Mensaje del log
   * @param {Object} [context={}] - Contexto adicional
   */
  debug: (message, context = {}) => {
    if (getCurrentLevel() <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, context));
    }
  },
  
  /**
   * Log de nivel INFO
   * Información general de la aplicación
   * 
   * @param {string} message - Mensaje del log
   * @param {Object} [context={}] - Contexto adicional
   */
  info: (message, context = {}) => {
    if (getCurrentLevel() <= LOG_LEVELS.INFO) {
      console.log(`✅ ${formatMessage('INFO', message, context)}`);
    }
  },
  
  /**
   * Log de nivel WARN
   * Advertencias que no bloquean la ejecución
   * 
   * @param {string} message - Mensaje del log
   * @param {Object} [context={}] - Contexto adicional
   */
  warn: (message, context = {}) => {
    if (getCurrentLevel() <= LOG_LEVELS.WARN) {
      console.warn(`⚠️ ${formatMessage('WARN', message, context)}`);
    }
  },
  
  /**
   * Log de nivel ERROR
   * Errores que requieren atención
   * 
   * @param {string} message - Mensaje del log
   * @param {Error|null} [error=null] - Objeto Error (opcional)
   * @param {Object} [context={}] - Contexto adicional
   */
  error: (message, error = null, context = {}) => {
    if (getCurrentLevel() <= LOG_LEVELS.ERROR) {
      const errorContext = error 
        ? { 
            ...context, 
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            }
          }
        : context;
      console.error(`❌ ${formatMessage('ERROR', message, errorContext)}`);
    }
  },
  
  /**
   * Log de grupo (para agrupar logs relacionados)
   * Útil para debugging de flujos complejos
   * 
   * @param {string} label - Etiqueta del grupo
   * @param {Function} fn - Función que contiene los logs
   * 
   * @example
   * ```javascript
   * logger.group('Crear Factura', () => {
   *   logger.debug('Validando datos');
   *   logger.debug('Llamando API');
   *   logger.info('Factura creada');
   * });
   * ```
   */
  group: (label, fn) => {
    if (getCurrentLevel() <= LOG_LEVELS.DEBUG) {
      console.group(`🔧 ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      // En producción, ejecutar función sin agrupar
      fn();
    }
  },
  
  /**
   * Log de tabla (para estructuras complejas)
   * 
   * @param {string} label - Etiqueta de la tabla
   * @param {Array|Object} data - Datos a mostrar
   */
  table: (label, data) => {
    if (getCurrentLevel() <= LOG_LEVELS.DEBUG) {
      console.log(`📊 ${label}:`);
      console.table(data);
    }
  }
};

/**
 * Configuración del logger (para futuro uso)
 * Permite cambiar el nivel dinámicamente
 */
export const loggerConfig = {
  /**
   * Establece el nivel de logging
   * 
   * @param {number} level - Nivel de logging (LOG_LEVELS.DEBUG, etc.)
   */
  setLevel: (level) => {
    // Por ahora, el nivel se determina automáticamente por entorno
    // En el futuro, se puede hacer configurable
    logger._level = level;
  },
  
  /**
   * Obtiene el nivel actual de logging
   * 
   * @returns {number} Nivel actual
   */
  getLevel: () => getCurrentLevel()
};

// Exportar niveles para uso externo
export { LOG_LEVELS };
