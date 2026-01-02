/**
 * Vercel Function: Proxy para crear facturas con API REST
 * Endpoint: /api/proxy/comprobanteVentaBean
 *
 * Este proxy permite evitar CORS al llamar a Xubio desde el navegador.
 * Recibe el Bearer token y el payload de factura, y hace la llamada a Xubio desde el servidor.
 */

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bearerToken, payload } = req.body;

  if (!bearerToken) {
    return res.status(400).json({ error: 'bearerToken es requerido' });
  }

  if (!payload) {
    return res.status(400).json({ error: 'payload es requerido' });
  }

  try {
    const response = await fetch('https://microservice.xubio.com/api/argentina/comprobanteVentaBean', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://app.xubio.com',
        'Referer': 'https://app.xubio.com/'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error en Xubio',
        status: response.status,
        data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en proxy comprobanteVentaBean:', error);
    return res.status(500).json({
      error: 'Error interno del proxy',
      message: error.message
    });
  }
}
