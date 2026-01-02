/**
 * Crear Factura Endpoint (Vercel) - MODO AUTOMÁTICO
 * 
 * Basado en el Discovery real: Punto de Venta 212819 (Automático)
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

    // Lógica de Precios
    const PRECIO_UNITARIO = 490;
    const subtotal = PRECIO_UNITARIO * parseFloat(cantidad);
    const iva = parseFloat((subtotal * 0.21).toFixed(2));
    const total = subtotal + iva;

    // PAYLOAD MINIMALISTA (Para Punto de Venta Automático)
    const payload = {
      circuitoContable: { ID: -2 }, 
      comprobante: 1, 
      tipo: 1, 
      cliente: { cliente_id: parseInt(clienteId) },
      fecha: new Date().toISOString().split('T')[0],
      fechaVto: new Date().toISOString().split('T')[0],
      condicionDePago: 2, // Contado
      puntoVenta: { ID: 212819 }, // corvusweb srl
      vendedor: { ID: 0 },
      deposito: { ID: -2 }, 
      
      transaccionProductoItems: [{
        cantidad: parseFloat(cantidad),
        precio: PRECIO_UNITARIO,
        descripcion: "CONECTIVIDAD ANUAL POR TOLVA",
        producto: { ID: 2751338 },
        iva: iva,
        importe: subtotal,
        total: total
        // centroDeCosto: eliminado por ser opcional y probable causa de error
      }],

      moneda: { ID: -3 }, // Dólares
      cotizacion: cotizacionUSD,
      cotizacionListaDePrecio: 1,
      utilizaMonedaExtranjera: 1,

      // Campos requeridos inicializados en cero/vacío
      cantComprobantesCancelados: 0,
      cantComprobantesEmitidos: 0,
      cbuinformada: 0,
      facturaNoExportacion: false,
      porcentajeComision: 0,
      transaccionCobranzaItems: [],
      transaccionPercepcionItems: []
    };

    console.log('📤 Enviando JSON minimalista a Xubio...');
    
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
    
    if (!response.ok) {
      console.error('❌ Error de Xubio:', responseData);
      throw new Error(responseData.message || responseData.error || `Error ${response.status}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        transaccionId: responseData.transaccionId || responseData.ID,
        numeroDocumento: responseData.numeroDocumento,
        total: responseData.total || total,
        pdfUrl: `https://xubio.com/NXV/transaccion/ver/${responseData.transaccionId || responseData.ID}`
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
