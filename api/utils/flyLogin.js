/**
 * Fly.io Login Client - Cliente para llamar al servicio de login en Fly.io
 *
 * Este módulo se comunica con el servicio Puppeteer + Stealth
 * que corre en Fly.io para obtener cookies de sesión de Xubio
 */

import { getCachedCookies, setCachedCookies } from './cookieCache.js';

// URL del servicio en Fly.io (se actualiza después del deploy)
const FLY_LOGIN_URL = process.env.FLY_LOGIN_URL || 'https://xubio-login.fly.dev';

/**
 * Obtiene cookies de sesión (usa cache o llama a Fly.io si es necesario)
 *
 * @param {Object} credentials - Credenciales de login
 * @param {string} credentials.username - Email de usuario
 * @param {string} credentials.password - Contraseña
 * @param {boolean} forceRefresh - Si true, ignora cache y pide cookies frescas
 * @returns {Promise<Array>} Array de cookies de sesión
 */
export async function getSessionCookies(credentials, forceRefresh = false) {
  // 1. Revisar cache (a menos que se fuerce refresh)
  if (!forceRefresh) {
    const cached = getCachedCookies();
    if (cached) {
      console.log('✅ [FLY-CLIENT] Usando cookies del cache');
      return cached;
    }
  }

  // 2. Cache miss o force refresh → llamar a Fly.io
  console.log('🌐 [FLY-CLIENT] Solicitando cookies a Fly.io...');

  const { username, password } = credentials;

  if (!username || !password) {
    throw new Error('Missing credentials: username and password required');
  }

  try {
    // Crear AbortController para timeout manual (compatible con todas las versiones de Node)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

    const response = await fetch(`${FLY_LOGIN_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || `HTTP ${response.status}`;
      throw new Error(`Fly.io login failed: ${errorMsg}`);
    }

    const data = await response.json();

    if (!data.success || !data.cookies || !Array.isArray(data.cookies)) {
      throw new Error('Invalid response from Fly.io: missing cookies array');
    }

    console.log(`✅ [FLY-CLIENT] ${data.cookies.length} cookies obtenidas de Fly.io`);

    // 3. Cachear cookies (TTL: 55 minutos, para renovar antes de que expiren)
    setCachedCookies(data.cookies, 55);

    return data.cookies;

  } catch (error) {
    console.error('❌ [FLY-CLIENT] Error al obtener cookies de Fly.io:', error.message);

    // Si es timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Timeout: Fly.io login service did not respond in time');
    }

    // Si es error de red
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      throw new Error('Network error: Cannot reach Fly.io login service. Check FLY_LOGIN_URL.');
    }

    // Propagar error original
    throw error;
  }
}

/**
 * Valida si las cookies de sesión son válidas
 * Hace un request simple a un endpoint que requiere autenticación
 *
 * @param {Array} cookies - Array de cookies a validar
 * @returns {Promise<boolean>} true si cookies válidas
 */
export async function validateCookies(cookies) {
  try {
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Request simple a endpoint que requiere auth
    const response = await fetch('https://xubio.com/api/dashboard/cardsdashboard', {
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json'
      }
    });

    return response.ok;

  } catch (error) {
    console.error('Error validando cookies:', error.message);
    return false;
  }
}
