/**
 * Test Login Endpoint - Vercel Serverless
 *
 * Endpoint de prueba para validar login con Playwright
 * Retorna cookies de sesión obtenidas
 *
 * URL: https://tu-app.vercel.app/api/test-login
 * Método: POST
 */

import { loginToXubio, cookiesToString, validateCookies } from './utils/browserLogin.js';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Solo se permite método POST'
    });
  }

  console.log('🧪 [TEST-LOGIN] Iniciando test de login...');

  try {
    // Obtener credenciales de variables de entorno
    const username = process.env.XUBIO_USERNAME;
    const password = process.env.XUBIO_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({
        error: 'Missing credentials',
        message: 'Variables de entorno XUBIO_USERNAME y XUBIO_PASSWORD no configuradas'
      });
    }

    // Ejecutar login con Playwright
    console.log('🔐 [TEST-LOGIN] Ejecutando login con Playwright...');
    const cookies = await loginToXubio({ username, password });

    console.log(`✅ [TEST-LOGIN] Login exitoso - ${cookies.length} cookies obtenidas`);

    // Validar cookies
    console.log('🍪 [TEST-LOGIN] Validando cookies...');
    const isValid = await validateCookies(cookies);

    // Convertir a formato string
    const cookieHeader = cookiesToString(cookies);

    // Retornar resultado
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        cookiesCount: cookies.length,
        cookiesValid: isValid,
        cookieHeader: cookieHeader.substring(0, 100) + '...', // Primeros 100 chars
        cookies: cookies.map(c => ({
          name: c.name,
          domain: c.domain,
          path: c.path,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite,
          expires: c.expires
        }))
      }
    });

  } catch (error) {
    console.error('❌ [TEST-LOGIN] Error:', error.message);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
