/**
 * POST /api/crear-cobranza
 * Crea una cobranza en Xubio con imputación a factura
 *
 * Patrón: Apps Script → Vercel → Xubio API
 * Credenciales OAuth manejadas en Vercel (variables de entorno)
 */

import { getOfficialToken } from './utils/tokenManager.js';

/**
 * Construir array de instrumentos de cobro según tipo (banco o cheque)
 * @param {string|null} chequeNumero - Número(s) del cheque (ej: "a1/a2/a3") o null para banco
 * @param {number|null} chequeImporte - Importe total del cheque en ARS
 * @param {number} importeTotal - Importe total en moneda principal (ARS) - usado para banco
 * @returns {Array} Array de instrumentos de cobro para el payload
 */
function construirInstrumentosCobro(chequeNumero, chequeImporte, importeTotal) {
  // Si no hay datos de cheque → BANCO (comportamiento default)
  if (!chequeNumero || String(chequeNumero).trim() === '' || !chequeImporte || parseFloat(chequeImporte) <= 0) {
    console.log('💳 Tipo de cobro: BANCO');
    return [{
      cuentaTipo: 2, // 2 = Banco
      cuenta: {
        ID: -14,
        id: -14,
        nombre: 'Banco'
      },
      moneda: {
        ID: -2,
        id: -2,
        nombre: 'Pesos Argentinos'
      },
      cotizacion: 1,
      importe: importeTotal,
      descripcion: ''
    }];
  }

  // Si hay cheque → VALORES A DEPOSITAR (1 sola línea)
  const fechaHoy = new Date().toISOString().split('T')[0];
  console.log(`📝 Tipo de cobro: CHEQUE`);
  console.log(`   Número(s): ${chequeNumero}`);
  console.log(`   Importe: $${chequeImporte}`);
  console.log(`   Fecha: ${fechaHoy}`);

  return [{
    cuentaTipo: 3, // 3 = Valores a Depositar
    cuenta: {
      ID: 681702,
      id: 681702,
      nombre: 'santander cheques'
    },
    moneda: {
      ID: -2,
      id: -2,
      nombre: 'Pesos Argentinos'
    },
    cotizacion: 1,
    importe: parseFloat(chequeImporte),
    banco: {
      ID: 3,
      id: 3,
      nombre: 'ABN Amro'
    },
    numCheque: String(chequeNumero),
    vtoCheque: fechaHoy,
    descripcion: ''
  }];
}

/**
 * Obtener link público del PDF de la cobranza
 */
async function obtenerLinkPdfPublico(token, transaccionId) {
  try {
    const url = `https://xubio.com/API/1.1/imprimirPDF?idtransaccion=${transaccionId}&tipoimpresion=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Error obteniendo PDF: ${response.status}`);
    const data = await response.json();
    return data.urlPdf;
  } catch (e) {
    console.error('⚠️ Error al obtener link público del PDF:', e.message);
    return null; // Retornar null si falla, no bloquear la cobranza
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    const { facturaId: facturaIdParam, numeroDocumento, chequeNumero, chequeImporte } = req.body;
    let facturaId = facturaIdParam;

    if (!facturaId && !numeroDocumento) {
      return res.status(400).json({
        success: false,
        error: 'Falta parámetro requerido: facturaId o numeroDocumento'
      });
    }

    // 1. Obtener token OAuth (desde variables de entorno de Vercel)
    const token = await getOfficialToken();

    // 2. Si recibimos numeroDocumento, buscar el facturaId primero
    if (!facturaId && numeroDocumento) {
      console.log('Buscando factura por numeroDocumento:', numeroDocumento);
      const searchUrl = `https://xubio.com/API/1.1/comprobanteVentaBean?numeroDocumento=${encodeURIComponent(numeroDocumento)}`;
      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!searchRes.ok) {
        const errorText = await searchRes.text();
        throw new Error(`Error buscando factura: HTTP ${searchRes.status} - ${errorText}`);
      }

      const searchResults = await searchRes.json();

      // Xubio retorna array de resultados
      if (!searchResults || searchResults.length === 0) {
        throw new Error(`No se encontró factura con número: ${numeroDocumento}`);
      }

      facturaId = searchResults[0].transaccionid;
      console.log('Factura encontrada, ID:', facturaId);
    }

    // 3. Obtener datos completos de la factura
    const facturaUrl = `https://xubio.com/API/1.1/comprobanteVentaBean/${facturaId}`;
    const facturaRes = await fetch(facturaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!facturaRes.ok) {
      const errorText = await facturaRes.text();
      throw new Error(`Error al obtener factura: HTTP ${facturaRes.status} - ${errorText}`);
    }

    const factura = await facturaRes.json();

    // 3. Validar datos de factura
    if (!factura.cliente || !factura.importetotal) {
      throw new Error('Factura incompleta: falta cliente o importetotal');
    }

    // 4. Construir payload de cobranza
    const clienteId = factura.cliente.ID || factura.cliente.id;
    const monedaFactura = factura.moneda;
    const cotizacion = factura.cotizacion || 1;
    const total = factura.importetotal;
    const circuitoContable = factura.circuitoContable;

    const esMonedaExtranjera = monedaFactura.id === -3; // USD
    const importeMonPrincipal = esMonedaExtranjera ? (total * cotizacion) : total;

    // Obtener itemId del primer item de la factura (transaccionCVItemId)
    const primerItem = factura.transaccionProductoItems?.[0] || {};
    const itemIdOrigen = primerItem.transaccionCVItemId || null;
    console.log('itemIdOrigen (transaccionCVItemId):', itemIdOrigen);

    const fechaISO = new Date().toISOString().split('T')[0];

    const payload = {
      // Cliente (requiere cliente_id Y nombre)
      cliente: {
        cliente_id: parseInt(clienteId),
        nombre: factura.cliente.nombre
      },

      // Circuito contable (heredado de factura)
      circuitoContable: {
        ID: circuitoContable.ID,
        id: circuitoContable.id,
        nombre: circuitoContable.nombre
      },

      // Fecha
      fecha: fechaISO,

      // Moneda y cotización (heredadas de factura)
      monedaCtaCte: {
        ID: monedaFactura.ID,
        id: monedaFactura.id,
        nombre: monedaFactura.nombre
      },
      cotizacion: cotizacion,
      utilizaMonedaExtranjera: esMonedaExtranjera ? 1 : 0,

      // Número de recibo (lo auto-genera Xubio)
      numeroRecibo: '',

      // Observación con datos de la factura a imputar
      observacion: `IMPUTAR A: ${factura.numeroDocumento} - ${factura.cliente.nombre} - Total: ${total} ${monedaFactura.nombre}`,

      // Instrumento de cobro: CHEQUES o BANCO según request
      transaccionInstrumentoDeCobro: construirInstrumentosCobro(chequeNumero, chequeImporte, importeMonPrincipal),

      // CRÍTICO: Asociación con factura (imputación)
      // Intento 1: detalleCobranzas (documentado en SDK pero ignorado por Xubio)
      detalleCobranzas: [{
        idComprobante: parseInt(facturaId),
        importe: total
      }],

      // Intento 2: transaccionTesoreriaCtaCteItems (campo XML Legacy, no documentado en REST)
      // Basado en M_TransaccionIDOrigen y M_ItemIDOrigen del XML gold standard
      transaccionTesoreriaCtaCteItems: [{
        transaccionIdOrigen: parseInt(facturaId),
        itemIdOrigen: itemIdOrigen,  // transaccionCVItemId de la factura
        importeMonTransaccion: total,
        importeMonPrincipal: importeMonPrincipal,
        organizacionId: parseInt(clienteId),
        monedaIdTransaccion: monedaFactura.id,
        cotizacionMonTransaccion: cotizacion
      }],

      // Retenciones (vacías)
      transaccionRetencionItem: []
    };

    // 5. Crear cobranza en Xubio
    console.log('📤 Payload completo a enviar:');
    console.log(JSON.stringify(payload, null, 2));

    const cobranzaUrl = 'https://xubio.com/API/1.1/cobranzaBean';
    const cobranzaRes = await fetch(cobranzaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await cobranzaRes.text();
    console.log('📥 Response Code:', cobranzaRes.status);
    console.log('📥 Response Body:', responseText);

    let cobranza;

    try {
      cobranza = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Xubio retornó no-JSON:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Respuesta no-JSON de Xubio',
        debug: { statusCode: cobranzaRes.status, body: responseText }
      });
    }

    if (!cobranzaRes.ok) {
      console.error('❌ Xubio retornó error:', cobranza);
      return res.status(cobranzaRes.status).json({
        success: false,
        error: `Error al crear cobranza: HTTP ${cobranzaRes.status}`,
        debug: cobranza
      });
    }

    console.log('✅ Cobranza creada:', cobranza);

    // 6. Obtener PDF de la cobranza
    const cobranzaId = cobranza.transaccionid;
    const pdfUrl = await obtenerLinkPdfPublico(token, cobranzaId);
    console.log('📄 PDF URL:', pdfUrl);

    // 7. Retornar resultado exitoso
    return res.status(200).json({
      success: true,
      data: {
        cobranzaId: cobranzaId,
        numeroRecibo: cobranza.numeroRecibo,
        factura: factura.numeroDocumento,
        cliente: factura.cliente.nombre,
        total: factura.importetotal,
        pdfUrl: pdfUrl
      }
    });

  } catch (error) {
    console.error('❌ Error creando cobranza:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al crear cobranza'
    });
  }
}
