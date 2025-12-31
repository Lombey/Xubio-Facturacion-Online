/**
 * Composable para gestionar Puntos de Venta
 * 
 * Implementa patrón Singleton para evitar llamadas redundantes a la API
 * cuando múltiples componentes necesitan los mismos datos.
 * 
 * @module composables/usePuntosDeVenta
 */

import { esPuntoVentaValido } from '../utils/validators.js';
import { VALORES_ACTIVO } from '../utils/constants.js';
import cacheManager from '../utils/cache.js';

// Estado global (Singleton) - compartido entre todas las instancias
/** @type {Array} */
let puntosDeVenta = [];
/** @type {boolean} */
let initialized = false;
/** @type {Promise<Array>|null} */
let loadingPromise = null;

/**
 * Composable para gestionar puntos de venta
 * 
 * @param {Object} apiClient - Cliente de API de Xubio (de createXubioApiClient)
 * @returns {Object} Funciones y estado relacionados con puntos de venta
 */
export function usePuntosDeVenta(apiClient) {
  /**
   * Carga los puntos de venta desde la API (con cache y singleton)
   * 
   * @param {boolean} forceRefresh - Si es true, fuerza la actualización desde la API
   * @returns {Promise<Array>} Lista de puntos de venta
   */
  async function cargar(forceRefresh = false) {
    // Si ya está cargando, reutilizar la misma promise
    if (loadingPromise && !forceRefresh) {
      return loadingPromise;
    }

    // Si ya está inicializado y no se fuerza refresh, retornar datos existentes
    if (initialized && !forceRefresh && puntosDeVenta.length > 0) {
      return puntosDeVenta;
    }

    // Intentar cargar desde cache primero (si no se fuerza refresh)
    if (!forceRefresh) {
      const cached = cacheManager.getCachedData('puntosDeVenta');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        puntosDeVenta = cached;
        initialized = true;
        console.log(`✅ ${cached.length} puntos de venta cargados desde cache`);
        return cached;
      }
    }

    // Cargar desde la API
    loadingPromise = (async () => {
      try {
        const data = await apiClient.getPuntosVenta(1); // activo = 1
        
        if (Array.isArray(data) && data.length > 0) {
          puntosDeVenta = data;
          initialized = true;
          
          // Guardar en cache (1 hora)
          cacheManager.setCachedData('puntosDeVenta', data, 3600000);
          
          console.log(`✅ ${data.length} puntos de venta cargados desde API`);
          return data;
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error cargando puntos de venta:', error);
        throw error;
      } finally {
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  /**
   * Obtiene el punto de venta por defecto (ID 212819 o valor 00004, editable-sugerido)
   * 
   * @returns {Object|null} Punto de venta por defecto o null
   */
  function obtenerPuntoVentaPorDefecto() {
    if (!puntosDeVenta || puntosDeVenta.length === 0) {
      return null;
    }

    // Filtrar solo puntos de venta activos
    const puntosActivos = puntosDeVenta.filter(pv => {
      const esActivo = pv.activo === undefined || 
                       pv.activo === VALORES_ACTIVO.ONE || 
                       pv.activo === VALORES_ACTIVO.ONE_STRING || 
                       pv.activo === VALORES_ACTIVO.TRUE;
      return esActivo;
    });

    if (puntosActivos.length === 0) {
      return null;
    }

    // Buscar primero por ID 212819
    let puntoVentaSeleccionado = puntosActivos.find(pv => {
      const pvId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
      return pvId === 212819 || pvId === '212819';
    });

    // Si no se encuentra por ID, buscar por campo "Punto de Venta" que contenga 00004
    if (!puntoVentaSeleccionado) {
      puntoVentaSeleccionado = puntosActivos.find(pv => {
        const puntoVenta = (pv.puntoVenta || '').toString().trim();
        return puntoVenta === '00004' || puntoVenta.includes('00004');
      });
    }

    // Si tampoco se encuentra, usar el primero disponible
    if (!puntoVentaSeleccionado) {
      puntoVentaSeleccionado = puntosActivos[0];
    }

    return puntoVentaSeleccionado || null;
  }

  /**
   * Obtiene todos los puntos de venta válidos (activos, editable y sugerido)
   * 
   * @returns {Array} Lista de puntos de venta válidos
   */
  function obtenerPuntosVentaValidos() {
    return puntosDeVenta.filter(pv => esPuntoVentaValido(pv, false));
  }

  /**
   * Resetea el estado singleton (útil para tests o recarga completa)
   */
  function reset() {
    puntosDeVenta = [];
    initialized = false;
    loadingPromise = null;
  }

  return {
    // Estado (getters)
    get puntosDeVenta() {
      return puntosDeVenta;
    },
    get initialized() {
      return initialized;
    },
    
    // Métodos
    cargar,
    obtenerPuntoVentaPorDefecto,
    obtenerPuntosVentaValidos,
    reset
  };
}
