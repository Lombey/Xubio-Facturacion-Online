/**
 * Cookie Cache Manager - In-Memory Cache para Vercel Serverless
 *
 * Cachea cookies de sesión de Xubio en memoria
 * Nota: El cache se pierde en cold starts, lo cual está OK porque
 * simplemente pediremos cookies frescas a Fly.io en ese caso
 */

// Cache global (vive mientras el proceso serverless esté activo)
let cachedCookies = null;
let cacheExpiry = null;

/**
 * Obtiene cookies del cache si están válidas
 *
 * @returns {Array|null} Cookies si válidas, null si expiradas o no existen
 */
export function getCachedCookies() {
  if (!cachedCookies || !cacheExpiry) {
    console.log('🍪 [CACHE] No hay cookies en cache');
    return null;
  }

  const now = Date.now();
  if (now >= cacheExpiry) {
    console.log('🍪 [CACHE] Cookies expiradas');
    cachedCookies = null;
    cacheExpiry = null;
    return null;
  }

  const remainingMinutes = Math.floor((cacheExpiry - now) / 1000 / 60);
  console.log(`🍪 [CACHE] Cookies válidas (expiran en ${remainingMinutes} minutos)`);

  return cachedCookies;
}

/**
 * Guarda cookies en el cache
 *
 * @param {Array} cookies - Array de cookies
 * @param {number} ttlMinutes - Tiempo de vida en minutos (default: 55)
 */
export function setCachedCookies(cookies, ttlMinutes = 55) {
  cachedCookies = cookies;
  cacheExpiry = Date.now() + (ttlMinutes * 60 * 1000);

  console.log(`🍪 [CACHE] Cookies guardadas (TTL: ${ttlMinutes} minutos)`);
}

/**
 * Invalida el cache (forzar refresh)
 */
export function invalidateCache() {
  cachedCookies = null;
  cacheExpiry = null;
  console.log('🍪 [CACHE] Cache invalidado');
}

/**
 * Convierte array de cookies a string Cookie header
 *
 * @param {Array} cookies - Array de objetos cookie
 * @returns {string} String formato "name=value; name2=value2"
 */
export function cookiesToString(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}
