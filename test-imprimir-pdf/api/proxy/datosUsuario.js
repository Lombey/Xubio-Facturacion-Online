/**
 * Vercel Function: Proxy para verificar Bearer Token
 * Endpoint: /api/proxy/datosUsuario
 *
 * Este proxy permite evitar CORS al llamar a Xubio desde el navegador.
 * Recibe el Bearer token y hace la llamada a Xubio desde el servidor.
 */

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bearerToken } = req.body;

  if (!bearerToken) {
    return res.status(400).json({ error: 'bearerToken es requerido' });
  }

  try {
    const response = await fetch('https://xubio.com/api/dashboard/datosUsuario', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json'
      }
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
    console.error('Error en proxy datosUsuario:', error);
    return res.status(500).json({
      error: 'Error interno del proxy',
      message: error.message
    });
  }
}
