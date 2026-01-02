/**
 * Vercel Function: Proxy genérico para llamadas a Xubio
 * Endpoint: /api/proxy/xubio
 *
 * Permite probar cualquier endpoint de Xubio sin CORS.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bearerToken, ruta, method = 'GET', body = null, domain = 'xubio.com' } = req.body;

  if (!bearerToken) {
    return res.status(400).json({ error: 'bearerToken es requerido' });
  }

  if (!ruta) {
    return res.status(400).json({ error: 'ruta es requerida (ej: /api/dashboard/datosUsuario)' });
  }

  try {
    const url = `https://${domain}${ruta}`;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json, text/plain, */*'
      }
    };

    // Agregar Content-Type y body si es POST/PUT/PATCH
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    console.log(`[Proxy] ${method} ${url}`);

    const response = await fetch(url, options);

    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error en Xubio',
        status: response.status,
        statusText: response.statusText,
        data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(500).json({
      error: 'Error interno del proxy',
      message: error.message
    });
  }
}
