/**
 * Crear Factura Endpoint (Vercel) - API REST OFICIAL (JSON)
 * 
 * Traduce la lógica del "Golden Template" XML al formato JSON oficial.
 */

import { getOfficialToken } from './utils/tokenManager.js';

async function obtenerCotizacion() {
  try {
    const res = await fetch('https://api.estadisticasbcra.com/usd_of', { 
      headers: { 'Authorization': 'BEARER ' }
    });
    const data = await res.json();
    return parseFloat(data[data.length - 1].v);
  } catch (e) {
    return 1455; 
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { clienteId, cantidad = 1 } = req.body;
    if (!clienteId) return res.status(400).json({ error: 'Falta clienteId' });

    const token = await getOfficialToken();
    const cotizacionUSD = await obtenerCotizacion();

    // VALORES DEL GOLDEN TEMPLATE (Traducidos a JSON)
    const PRECIO_UNITARIO = 490;
    const subtotal = PRECIO_UNITARIO * parseFloat(cantidad);
    const iva = parseFloat((subtotal * 0.21).toFixed(2));
    const total = subtotal + iva;

    // PAYLOAD JSON OFICIAL (Validado contra Swagger de Xubio)
    const payload = {
      circuitoContable: { ID: -2 }, // default
      comprobante: 1, // Factura
      tipo: 1, // Factura A
      cliente: { cliente_id: parseInt(clienteId) },
      fecha: new Date().toISOString().split('T')[0],
      fechaVto: new Date().toISOString().split('T')[0],
      condicionDePago: 2, // Contado (Valor estándar en API REST)
      puntoVenta: { ID: 212819 }, // corvusweb srl
      talonario: { ID: 11290129 }, // Facturas de Venta A
      vendedor: { ID: 0 },
      deposito: { ID: -2 }, // Depósito Universal
      
      // Items de Producto
      transaccionProductoItems: [{
        cantidad: parseFloat(cantidad),
        precio: PRECIO_UNITARIO,
        descripcion: "CONECTIVIDAD ANUAL POR TOLVA - Incluye Licencia para uso de un equipo por un año",
        producto: { ID: 2751338 },
        iva: iva,
        importe: subtotal,
        total: total,
        centroDeCosto: { ID: 1 } // IMPORTANTE: Valor requerido en API REST
      }],

      // Moneda
      moneda: { ID: -3 }, // Dólares
      cotizacion: cotizacionUSD,
      cotizacionListaDePrecio: 1,
      utilizaMonedaExtranjera: 1,

      // Campos obligatorios para evitar errores de validación
      cantComprobantesCancelados: 0,
      cantComprobantesEmitidos: 0,
      cbuinformada: 0,
      facturaNoExportacion: false,
      porcentajeComision: 0,
      transaccionCobranzaItems: [],
      transaccionPercepcionItems: []
    };

    console.log('📤 Enviando a API REST Oficial...');
    
    const response = await fetch('https://xubio.com/API/1.1/comprobanteVentaBean', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log(`📥 Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || `Error Xubio ${response.status}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        transaccionId: responseData.transaccionId || responseData.ID,
        numeroDocumento: responseData.numeroDocumento,
        pdfUrl: `https://xubio.com/NXV/transaccion/ver/${responseData.transaccionId || responseData.ID}`
      }
    });

  } catch (error) {
    console.error('❌ Error API REST:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}