/**
 * Debug Xubio Page - Toma screenshot de la página de Xubio
 *
 * Útil para ver qué página se carga y qué selectores tiene
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export default async function handler(req, res) {
  console.log('🔍 [DEBUG] Iniciando debug de página Xubio...');

  let browser = null;

  try {
    // Configurar para Vercel serverless
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    const launchOptions = isProduction ? {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar'
      ),
      headless: chromium.headless,
    } : {
      headless: true
    };

    console.log('🚀 [DEBUG] Lanzando browser...');
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navegar a xubio.com
    console.log('📍 [DEBUG] Navegando a https://xubio.com...');
    await page.goto('https://xubio.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const url = page.url();
    const title = await page.title();

    console.log('📍 [DEBUG] URL actual:', url);
    console.log('📄 [DEBUG] Título:', title);

    // Extraer todos los inputs de la página
    const inputs = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input'));
      return elements.map(el => ({
        id: el.id,
        name: el.name,
        type: el.type,
        placeholder: el.placeholder,
        className: el.className
      }));
    });

    console.log('🔍 [DEBUG] Inputs encontrados:', inputs.length);

    // Extraer todos los botones
    const buttons = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      return elements.map(el => ({
        text: el.textContent?.trim(),
        type: el.type,
        className: el.className
      }));
    });

    console.log('🔘 [DEBUG] Botones encontrados:', buttons.length);

    // Tomar screenshot (base64)
    const screenshot = await page.screenshot({ encoding: 'base64' });

    await browser.close();

    return res.status(200).json({
      success: true,
      data: {
        url,
        title,
        inputs,
        buttons,
        screenshot: `data:image/png;base64,${screenshot.substring(0, 100)}...` // Primeros 100 chars
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error.message);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
