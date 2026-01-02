/**
 * Fly.io Login Service - Puppeteer + Stealth para Xubio
 *
 * Servicio dedicado para hacer login a Xubio y obtener cookies de sesión.
 * Usa puppeteer completo + plugin stealth para evitar detección de bot.
 *
 * Endpoints:
 * - POST /login - Hace login y retorna cookies
 * - GET /health - Health check
 */

import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configurar stealth plugin
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 8080;

// Cache de cookies y keep-alive
let cookieCache = null;
let sessionKeepAlive = null;

/**
 * Mantener sesión viva con requests periódicos a Xubio
 */
function startSessionKeepAlive(cookies) {
  // Limpiar intervalo anterior si existe
  if (sessionKeepAlive) {
    clearInterval(sessionKeepAlive);
  }

  console.log('🔄 Iniciando keep-alive de sesión (cada 30 min)...');

  sessionKeepAlive = setInterval(async () => {
    console.log('🔄 Renovando sesión de Xubio...');

    try {
      // GET simple a Xubio para mantener sesión viva
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      const response = await fetch('https://xubio.com/NXV/home', {
        headers: { Cookie: cookieString }
      });

      if (response.ok) {
        console.log('✅ Sesión renovada exitosamente');
      } else {
        console.log('❌ Sesión expirada, limpiando cache');
        cookieCache = null;
        clearInterval(sessionKeepAlive);
        sessionKeepAlive = null;
      }
    } catch (error) {
      console.error('⚠️ Error renovando sesión:', error.message);
    }
  }, 30 * 60 * 1000); // Cada 30 minutos
}

// Middleware
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xubio-login',
    timestamp: new Date().toISOString()
  });
});

/**
 * Login endpoint
 *
 * Body: { username: string, password: string }
 * Response: { cookies: Array<Cookie> }
 */
app.post('/login', async (req, res) => {
  // Chequear cache primero
  if (cookieCache) {
    console.log('✅ Usando cookies del cache (sesión activa)');
    return res.json({
      success: true,
      cookies: cookieCache,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }

  // Usar credenciales del body o de variables de entorno (más seguro)
  const username = req.body.username || process.env.XUBIO_USERNAME;
  const password = req.body.password || process.env.XUBIO_PASSWORD;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'username and password are required (via body or env vars)'
    });
  }

  console.log('🔐 Iniciando login a Xubio con Puppeteer + Stealth...');

  let browser = null;

  try {
    // Lanzar browser con stealth
    console.log('🚀 Lanzando browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Configurar viewport y User-Agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Navegar a endpoint de login de Xubio (auto-redirige a Visma Connect)
    console.log('📍 Navegando a xubio.com/NXV/vismaConnect/login...');
    await page.goto('https://xubio.com/NXV/vismaConnect/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // 2. PASO 1: Esperar campo de email
    console.log('⏳ Esperando campo de email...');
    await page.waitForSelector('input#Username', { timeout: 15000 });

    // 3. Completar email (con delay entre caracteres para parecer humano)
    console.log('✍️ Ingresando email...');
    await page.type('input#Username', username, { delay: 100 });

    // Pequeño delay antes de hacer click
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Click "Continuar"
    console.log('🚀 Click en "Continuar"...');
    await page.click('#LoginButton');

    // 5. PASO 2: Esperar que aparezca campo de password
    console.log('⏳ Esperando campo de password...');
    await page.waitForSelector('input#Password', { visible: true, timeout: 20000 });

    // 6. Completar password (con delay entre caracteres)
    console.log('✍️ Ingresando password...');
    await page.type('input#Password', password, { delay: 100 });

    // Pequeño delay antes de hacer click
    await new Promise(resolve => setTimeout(resolve, 500));

    // 7. Click "Iniciar sesión" y esperar navegación final
    console.log('🚀 Click en "Iniciar sesión"...');
    await page.click('#LoginButton');

    // Esperar que redirija a xubio.com (verificar URL cambia)
    console.log('⏳ Esperando redirección a xubio.com...');
    await page.waitForFunction(
      () => window.location.href.includes('xubio.com') && !window.location.href.includes('visma'),
      { timeout: 60000 }
    );

    // 8. Verificar que llegamos a Xubio
    const currentUrl = page.url();
    console.log('📍 URL actual después del login:', currentUrl);

    if (!currentUrl.includes('xubio.com')) {
      throw new Error('Login falló - No se redirigió a xubio.com. URL actual: ' + currentUrl);
    }

    // 9. Extraer cookies de sesión
    console.log('🍪 Extrayendo cookies de sesión...');
    const cookies = await page.cookies();

    // Filtrar solo cookies de xubio.com
    const xubioCookies = cookies.filter(c => c.domain.includes('xubio.com'));

    // Convertir a formato estándar
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

    // Guardar cookies en cache
    cookieCache = compatibleCookies;

    // Activar keep-alive para mantener sesión viva
    startSessionKeepAlive(compatibleCookies);

    // Retornar cookies
    res.json({
      success: true,
      cookies: compatibleCookies,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error durante login:', error.message);

    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Xubio Login Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: POST http://localhost:${PORT}/login`);
});
