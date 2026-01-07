/**
 * POST /api/crear-cobranza
 * Crea una cobranza en Xubio con imputación a factura
 *
 * Patrón: Apps Script → Vercel → Xubio API
 * Credenciales OAuth manejadas en Vercel (variables de entorno)
 */

import { getOfficialToken } from '../sdk/tokenManager.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Usa POST.'
    });
  }

  try {
    const { facturaId } = req.body;

    if (!facturaId) {
      return res.status(400).json({
        success: false,
        error: 'Falta parámetro requerido: facturaId'
      });
    }

    // 1. Obtener token OAuth (desde variables de entorno de Vercel)
    const token = await getOfficialToken();

    // 2. Obtener datos de la factura
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

      // Instrumento de cobro (BANCO por defecto)
      transaccionInstrumentoDeCobro: [{
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
        importe: importeMonPrincipal,
        descripcion: ''
      }],

      // CRÍTICO: Asociación con factura (cuenta corriente)
      // Basado en gold standard XML: TransaccionTesoreriaCtaCteItems
      transaccionTesoreriaCtaCteItems: [{
        cuentaId: -3, // Deudores por Venta
        monedaIdTransaccion: monedaFactura.id,
        cotizacionMonTransaccion: cotizacion,
        importeMonTransaccion: total,
        importeMonPrincipal: importeMonPrincipal,
        debeHaber: -1,
        organizacionId: parseInt(clienteId),
        transaccionIdOrigen: parseInt(facturaId)
      }],

      // Retenciones (vacías)
      transaccionRetencionItem: []
    };

    // 5. Crear cobranza en Xubio
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
    let cobranza;

    try {
      cobranza = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: 'Respuesta no-JSON de Xubio',
        debug: { statusCode: cobranzaRes.status, body: responseText }
      });
    }

    if (!cobranzaRes.ok) {
      return res.status(cobranzaRes.status).json({
        success: false,
        error: `Error al crear cobranza: HTTP ${cobranzaRes.status}`,
        debug: cobranza
      });
    }

    // 6. Retornar resultado exitoso
    return res.status(200).json({
      success: true,
      data: {
        cobranzaId: cobranza.transaccionid,
        numeroRecibo: cobranza.numeroRecibo,
        factura: factura.numeroDocumento,
        cliente: factura.cliente.nombre,
        total: factura.importetotal
      },
      debug: {
        payload: payload,
        response: cobranza
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
