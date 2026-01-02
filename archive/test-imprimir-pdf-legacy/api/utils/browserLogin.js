/**
 * Browser Login Utility - Puppeteer + @sparticuz/chromium-min
 *
 * Maneja el login a Xubio usando Puppeteer para obtener cookies de sesión
 * Xubio redirige a Visma Connect para autenticación OAuth
 *
 * Usa chromium-min que descarga el binario desde GitHub CDN en runtime
 * para evitar problemas de dependencias del sistema (libnss3.so, etc.)
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

/**
 * Realiza login a Xubio usando Puppeteer y retorna cookies de sesión
 *
 * @param {Object} credentials - Credenciales de login
 * @param {string} credentials.username - Email de usuario
 * @param {string} credentials.password - Contraseña
 * @returns {Promise<Array>} Array de cookies de sesión
 */
export async function loginToXubio(credentials) {
  const { username, password } = credentials;

  console.log('🔐 Iniciando login a Xubio con Puppeteer...');

  let browser = null;

  try {
    // Configurar para Vercel serverless
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    // Configuración optimizada para Vercel con chromium-min
    const launchOptions = isProduction ? {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        // URL del binario desde GitHub CDN - v143.0.0 (x64 para Vercel)
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar'
      ),
      headless: chromium.headless,
    } : {
      headless: true
    };

    console.log('🚀 Lanzando browser con chromium-min (CDN download)...');
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // Configurar User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Navegar a Xubio (auto-redirige a Visma Connect)
    console.log('📍 Navegando a xubio.com...');
    await page.goto('https://xubio.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 2. Esperar formulario de login de Visma Connect
    console.log('⏳ Esperando formulario de login...');
    await page.waitForSelector('input#Username', { timeout: 10000 });

    // 3. Completar formulario
    console.log('✍️ Completando credenciales...');
    await page.type('input#Username', username);
    await page.type('input#Password', password);

    // 4. Submit form y esperar navegación
    console.log('🚀 Enviando formulario...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('input[type="submit"]')
    ]);

    // 5. Verificar que llegamos a Xubio (no más en Visma Connect)
    const currentUrl = page.url();
    console.log('📍 URL actual después del login:', currentUrl);

    if (!currentUrl.includes('xubio.com')) {
      throw new Error('Login falló - No se redirigió a xubio.com. URL actual: ' + currentUrl);
    }

    // 6. Extraer cookies de sesión (Puppeteer format)
    console.log('🍪 Extrayendo cookies de sesión...');
    const cookies = await page.cookies();

    // Filtrar solo cookies de xubio.com
    const xubioCookies = cookies.filter(c => c.domain.includes('xubio.com'));

    // Convertir de formato Puppeteer a formato compatible con Playwright
    const compatibleCookies = xubioCookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite || 'Lax'
    }));

    console.log(`✅ Login exitoso - ${compatibleCookies.length} cookies obtenidas`);

    await browser.close();

    return compatibleCookies;

  } catch (error) {
    console.error('❌ Error durante login:', error.message);

    if (browser) {
      await browser.close();
    }

    throw new Error('Login falló: ' + error.message);
  }
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

/**
 * Verifica si las cookies de sesión son válidas
 * Hace un request simple a un endpoint que requiere autenticación
 *
 * @param {Array} cookies - Array de cookies a validar
 * @returns {Promise<boolean>} true si cookies válidas
 */
export async function validateCookies(cookies) {
  try {
    const cookieHeader = cookiesToString(cookies);

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
