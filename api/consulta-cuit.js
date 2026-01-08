/**
 * Consulta CUIT - Scraping de cuitonline.com
 *
 * Endpoint: GET /api/consulta-cuit?cuit=33715841199
 * Respuesta: { success: true, data: { cuit: "33-71584119-9", razonSocial: "LA MAYACA SRL", ... } }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { cuit } = req.query;

  if (!cuit) {
    return res.status(400).json({
      success: false,
      error: 'Falta parámetro: cuit'
    });
  }

  // Normalizar CUIT (quitar guiones y espacios)
  const cuitNormalizado = cuit.toString().replace(/\D/g, '');

  if (cuitNormalizado.length !== 11) {
    return res.status(400).json({
      success: false,
      error: 'CUIT inválido: debe tener 11 dígitos'
    });
  }

  try {
    console.log(`🔍 [CONSULTA-CUIT] Buscando: ${cuitNormalizado}`);

    const url = `https://www.cuitonline.com/search.php?q=${cuitNormalizado}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.log(`❌ [CONSULTA-CUIT] Error HTTP: ${response.status}`);
      return res.status(response.status).json({
        success: false,
        error: `Error al consultar cuitonline: HTTP ${response.status}`
      });
    }

    const html = await response.text();

    // Extraer razón social del HTML
    // Patrón: <h2 class="...">RAZON SOCIAL</h2> o similar
    const resultado = extraerDatosDeHTML(html, cuitNormalizado);

    if (!resultado) {
      console.log(`⚠️ [CONSULTA-CUIT] No se encontró: ${cuitNormalizado}`);
      return res.status(404).json({
        success: false,
        error: 'CUIT no encontrado'
      });
    }

    console.log(`✅ [CONSULTA-CUIT] Encontrado: ${resultado.razonSocial}`);

    return res.status(200).json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error(`❌ [CONSULTA-CUIT] Error:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Extrae datos del HTML de cuitonline.com
 */
function extraerDatosDeHTML(html, cuitBuscado) {
  try {
    // Buscar el patrón de razón social en el HTML
    // El formato es: <h2>RAZON SOCIAL</h2> seguido de datos

    // Patrón 1: Buscar en etiqueta h2 (nombre/razón social)
    // Ejemplo: ## LA MAYACA SRL (en markdown) o <h2>LA MAYACA SRL</h2>
    let razonSocial = null;
    let tipoPersona = null;
    let condicionIVA = null;

    // Buscar razón social - patrón <h2 ...>NOMBRE</h2>
    const h2Match = html.match(/<h2[^>]*class="[^"]*card-title[^"]*"[^>]*>([^<]+)<\/h2>/i);
    if (h2Match) {
      razonSocial = h2Match[1].trim();
    }

    // Si no encontró con clase, buscar h2 simple después del CUIT
    if (!razonSocial) {
      const h2SimpleMatch = html.match(/<h2[^>]*>([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s.\-&]+(?:S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?)?)<\/h2>/i);
      if (h2SimpleMatch) {
        razonSocial = h2SimpleMatch[1].trim();
      }
    }

    // Buscar en el texto plano si hay formato "## NOMBRE"
    if (!razonSocial) {
      const mdMatch = html.match(/##\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s.\-&]+(?:S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?)?)\s*\n/);
      if (mdMatch) {
        razonSocial = mdMatch[1].trim();
      }
    }

    // Buscar tipo de persona
    if (html.includes('Persona Jurídica') || html.includes('Persona Juridica')) {
      tipoPersona = 'JURIDICA';
    } else if (html.includes('Persona Física') || html.includes('Persona Fisica')) {
      tipoPersona = 'FISICA';
    }

    // Buscar condición IVA
    const ivaMatch = html.match(/IVA:\s*([^•<\n]+)/i);
    if (ivaMatch) {
      condicionIVA = ivaMatch[1].trim();
    }

    // Si no encontramos razón social, intentar otro patrón
    if (!razonSocial) {
      // Buscar cualquier texto que parezca nombre de empresa después del CUIT
      const cuitFormateado = cuitBuscado.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');
      const patronNombre = new RegExp(`${cuitFormateado}[^A-Z]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s\\.\\-&]{2,}(?:S\\.?A\\.?|S\\.?R\\.?L\\.?|S\\.?A\\.?S\\.?)?)`, 'i');
      const nombreMatch = html.match(patronNombre);
      if (nombreMatch) {
        razonSocial = nombreMatch[1].trim();
      }
    }

    if (!razonSocial) {
      return null;
    }

    // Limpiar razón social
    razonSocial = razonSocial
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .toUpperCase();

    // Formatear CUIT con guiones
    const cuitFormateado = cuitBuscado.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');

    return {
      cuit: cuitFormateado,
      cuitSinGuiones: cuitBuscado,
      razonSocial: razonSocial,
      tipoPersona: tipoPersona,
      condicionIVA: condicionIVA
    };

  } catch (error) {
    console.error('Error extrayendo datos:', error);
    return null;
  }
}
