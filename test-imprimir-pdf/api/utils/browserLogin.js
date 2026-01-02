/**
 * Browser Login Utility - Playwright
 *
 * Maneja el login a Xubio usando Playwright para obtener cookies de sesión
 * Xubio redirige a Visma Connect para autenticación OAuth
 */

import chromiumPkg from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';

/**
 * Realiza login a Xubio usando Playwright y retorna cookies de sesión
 *
 * @param {Object} credentials - Credenciales de login
 * @param {string} credentials.username - Email de usuario
 * @param {string} credentials.password - Contraseña
 * @returns {Promise<Array>} Array de cookies de sesión
 */
export async function loginToXubio(credentials) {
  const { username, password } = credentials;

  console.log('🔐 Iniciando login a Xubio con Playwright...');

  let browser = null;

  try {
    // Configurar @sparticuz/chromium para Vercel
    // CRÍTICO: Deshabilitar modo gráfico en Vercel
    chromiumPkg.setGraphicsMode = false;

    // Lanzar browser headless optimizado para Vercel/AWS Lambda
    browser = await playwrightChromium.launch({
      args: chromiumPkg.args,
      executablePath: await chromiumPkg.executablePath(),
      headless: chromiumPkg.headless || true
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. Navegar a Xubio (auto-redirige a Visma Connect)
    console.log('📍 Navegando a xubio.com...');
    await page.goto('https://xubio.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 2. Esperar formulario de login de Visma Connect
    console.log('⏳ Esperando formulario de login...');
    await page.waitForSelector('input#Username', { timeout: 10000 });

    // 3. Completar formulario
    console.log('✍️ Completando credenciales...');
    await page.fill('input#Username', username);
    await page.fill('input#Password', password);

    // 4. Submit form y esperar navegación
    console.log('🚀 Enviando formulario...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click('input[type="submit"]')
    ]);

    // 5. Verificar que llegamos a Xubio (no más en Visma Connect)
    const currentUrl = page.url();
    console.log('📍 URL actual después del login:', currentUrl);

    if (!currentUrl.includes('xubio.com')) {
      throw new Error('Login falló - No se redirigió a xubio.com. URL actual: ' + currentUrl);
    }

    // 6. Extraer cookies de sesión
    console.log('🍪 Extrayendo cookies de sesión...');
    const cookies = await context.cookies();

    // Filtrar solo cookies de xubio.com (ignorar cookies de Visma Connect)
    const xubioCookies = cookies.filter(c =>
      c.domain.includes('xubio.com')
    );

    console.log(`✅ Login exitoso - ${xubioCookies.length} cookies obtenidas`);

    await browser.close();

    return xubioCookies;

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
