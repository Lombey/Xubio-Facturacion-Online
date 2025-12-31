/**
 * @typedef {Object} CacheEntry
 * @property {any} data - Datos cacheados
 * @property {number} timestamp - Timestamp de cuando se guardó
 * @property {number} ttl - Tiempo de vida en milisegundos
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} currentSize - Tamaño actual en bytes
 * @property {number} maxSize - Tamaño máximo en bytes
 * @property {number} usagePercent - Porcentaje de uso
 * @property {number} entries - Número de entradas en cache
 */

/**
 * Sistema de Cache con TTL y límite de tamaño
 * Reemplaza el sistema actual en app.js (líneas 320-456)
 */
class CacheManager {
  constructor() {
    /** @type {number} */
    this.maxSize = 10 * 1024 * 1024; // 10MB límite total
    /** @type {number} */
    this.currentSize = 0;
    /** @type {string} */
    this.prefix = 'xubio_cache_';
    
    // TTL por tipo de dato (reutilizado de app.js)
    /** @type {Record<string, number>} */
    this.ttlMap = {
      'clientes': 24 * 60 * 60 * 1000,      // 24 horas
      'productos': 12 * 60 * 60 * 1000,     // 12 horas
      'listaPrecios': 6 * 60 * 60 * 1000,   // 6 horas
      'maestros': 7 * 24 * 60 * 60 * 1000,  // 7 días
      'monedas': 7 * 24 * 60 * 60 * 1000    // 7 días (datos estables)
    };
    
    // Inicializar tamaño actual
    this.calcularTamañoActual();
  }
  
  /**
   * Calcula el tamaño actual del cache
   */
  calcularTamañoActual() {
    this.currentSize = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            this.currentSize += new Blob([item]).size;
          }
        } catch (_e) {
          // Ignorar errores
        }
      }
    });
  }
  
  /**
   * Calcula tamaño aproximado de un objeto
   * @param {any} obj
   */
  calcularTamañoObjeto(obj) {
    return new Blob([JSON.stringify(obj)]).size;
  }
  
  /**
   * Obtiene datos del cache si no han expirado
   * @param {string} key - Clave del cache
   * @returns {any|null} Datos cacheados o null si expiró/no existe
   */
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();
      
      // Si expiró, eliminar y retornar null
      if (now - timestamp > ttl) {
        localStorage.removeItem(`${this.prefix}${key}`);
        this.calcularTamañoActual();
        console.log(`⏰ Cache expirado para: ${key}`);
        return null;
      }
      
      const edad = Math.floor((now - timestamp) / 1000 / 60);
      console.log(`✅ Cache válido para: ${key} (edad: ${edad} minutos)`);
      return data;
    } catch (error) {
      console.error(`❌ Error leyendo cache ${key}:`, error);
      localStorage.removeItem(`${this.prefix}${key}`);
      this.calcularTamañoActual();
      return null;
    }
  }
  
  /**
   * Guarda datos en el cache con TTL y límite de tamaño
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a cachear
   * @param {number} ttl - TTL en milisegundos (opcional, usa getTTL si no se proporciona)
   */
  /**
   * @param {string} key
   * @param {any} data
   * @param {number|null} ttl
   */
  setCachedData(key, data, ttl = null) {
    try {
      // Si no se proporciona TTL, intentar inferirlo del tipo
      const finalTtl = ttl || this.getTTL(key) || 60 * 60 * 1000; // Default: 1 hora
      
      const entry = {
        data,
        timestamp: Date.now(),
        ttl: finalTtl
      };
      
      const entrySize = this.calcularTamañoObjeto(entry);
      
      // Verificar si hay espacio suficiente
      if (this.currentSize + entrySize > this.maxSize) {
        console.warn(`⚠️ Cache casi lleno (${Math.round(this.currentSize / 1024 / 1024 * 100) / 100}MB), limpiando caches viejos...`);
        this.limpiarCachesExpirados();
        
        // Si aún no hay espacio, evict los más viejos
        if (this.currentSize + entrySize > this.maxSize) {
          this.evictOldest();
        }
      }
      
      // Guardar
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
      this.currentSize += entrySize;
      
      console.log(`💾 Cache guardado para: ${key} (TTL: ${Math.floor(finalTtl / 1000 / 60)} minutos, tamaño: ${Math.round(entrySize / 1024)}KB)`);
    } catch (error) {
      console.error(`❌ Error guardando cache ${key}:`, error);
      // Si localStorage está lleno, intentar limpiar
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.limpiarCachesExpirados();
        this.evictOldest();
      }
    }
  }
  
  /**
   * Elimina los caches más antiguos hasta tener espacio
   */
  evictOldest() {
    const keys = Object.keys(localStorage);
    /** @type {Array<{key: string, timestamp: number}>} */
    const cacheEntries = [];
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            cacheEntries.push({ key, timestamp });
          }
        } catch (e) {
          // Ignorar
        }
      }
    });
    
    // Ordenar por timestamp (más antiguos primero)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Eliminar los más antiguos hasta tener espacio
    let evicted = 0;
    for (const entry of cacheEntries) {
      if (this.currentSize < this.maxSize * 0.8) break; // Dejar 20% de margen
      
      localStorage.removeItem(entry.key);
      evicted++;
    }
    
    this.calcularTamañoActual();
    if (evicted > 0) {
      console.log(`🗑️ Evicted ${evicted} caches antiguos para liberar espacio`);
    }
  }
  
  /**
   * Invalida un cache específico
   * @param {string} key
   */
  invalidarCache(key) {
    const fullKey = `${this.prefix}${key}`;
    const item = localStorage.getItem(fullKey);
    if (item) {
      localStorage.removeItem(fullKey);
      this.calcularTamañoActual();
      console.log(`🗑️ Cache invalidado: ${key}`);
    }
  }
  
  /**
   * Limpia todos los caches expirados
   */
  limpiarCachesExpirados() {
    const keys = Object.keys(localStorage);
    let limpiados = 0;
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (Date.now() - timestamp > ttl) {
              localStorage.removeItem(key);
              limpiados++;
            }
          }
        } catch (_error) {
          localStorage.removeItem(key);
          limpiados++;
        }
      }
    });
    
    this.calcularTamañoActual();
    if (limpiados > 0) {
      console.log(`🧹 Limpiados ${limpiados} caches expirados`);
    }
  }
  
  /**
   * Obtiene el TTL recomendado para un tipo de dato
   * @param {string} tipo - Tipo de dato
   * @returns {number} TTL en milisegundos
   */
  getTTL(tipo) {
    return this.ttlMap[tipo] || 60 * 60 * 1000; // Default: 1 hora
  }
  
  /**
   * Limpia todos los caches manualmente
   * @returns {number} Número de caches limpiados
   */
  limpiarTodosLosCaches() {
    const keys = Object.keys(localStorage);
    let limpiados = 0;
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
        limpiados++;
      }
    });
    
    this.currentSize = 0;
    console.log(`🗑️ Limpiados ${limpiados} caches manualmente`);
    return limpiados;
  }
  
  /**
   * Obtiene estadísticas del cache
   * @returns {CacheStats} Estadísticas del cache
   */
  getStats() {
    return {
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.currentSize / this.maxSize) * 100),
      entries: Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).length
    };
  }
}

// Exportar instancia singleton
export const cacheManager = new CacheManager();
export default cacheManager;

