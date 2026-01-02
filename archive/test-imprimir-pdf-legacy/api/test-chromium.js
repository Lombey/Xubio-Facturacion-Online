/**
 * Test Chromium Endpoint - Diagnóstico
 *
 * Endpoint simple para verificar que chromium-min funciona
 * Solo intenta lanzar browser y cerrarlo, SIN hacer login
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export default async function handler(req, res) {
  console.log('🧪 [TEST-CHROMIUM] Iniciando test de chromium-min...');

  let browser = null;

  try {
    // Configurar para Vercel serverless
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    console.log('🌍 Environment:', {
      isProduction,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    });

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

    console.log('🚀 [TEST-CHROMIUM] Lanzando browser...');
    console.log('📦 Args:', launchOptions.args?.slice(0, 5));
    console.log('📍 Executable:', launchOptions.executablePath?.substring(0, 100));

    browser = await puppeteer.launch(launchOptions);

    console.log('✅ [TEST-CHROMIUM] Browser lanzado exitosamente');

    // Crear página simple
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'networkidle0', timeout: 10000 });

    const title = await page.title();
    console.log('📄 [TEST-CHROMIUM] Título de página:', title);

    await browser.close();

    console.log('✅ [TEST-CHROMIUM] Test completado exitosamente');

    return res.status(200).json({
      success: true,
      message: 'Chromium-min funciona correctamente',
      data: {
        pageTitle: title,
        chromiumVersion: await browser.version(),
        isProduction,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [TEST-CHROMIUM] Error:', error.message);
    console.error('📚 Stack:', error.stack);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('⚠️ Error cerrando browser:', closeError.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : error.stack.substring(0, 500)
    });
  }
}
