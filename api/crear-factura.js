/**
 * Crear Factura Endpoint (Vercel) - Versión Final Robusta (Golden Template)
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

/**
 * Obtiene los datos completos de un cliente para extraer su ubicación y otros datos.
 */
async function obtenerDatosCliente(token, clienteId) {
  const url = `https://xubio.com/API/1.1/clienteBean/${clienteId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`Error al obtener datos del cliente: ${response.status}`);
  return await response.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      clienteId, 
      cantidad = 1,
      productoId = 2751338,
      puntoVentaId = 212819,
      listaDePrecioId = 15386,
      centroDeCostoId = null,
      precioUnitario = 490,
      descripcion = "CONECTIVIDAD ANUAL POR TOLVA"
    } = req.body;

    if (!clienteId) return res.status(400).json({ error: 'Falta clienteId' });

    const token = await getOfficialToken();
    
    // PASO 1: Enriquecimiento automático (Búsqueda del cliente)
    const datosCliente = await obtenerDatosCliente(token, clienteId);
    const cotizacionUSD = await obtenerCotizacion();

    // Cálculos de montos (siguiendo molde exitoso)
    const neto = parseFloat(precioUnitario) * parseFloat(cantidad);
    const iva = parseFloat((neto * 0.21).toFixed(2));
    const total = neto + iva;
    const netoARS = parseFloat((neto * cotizacionUSD).toFixed(2));

    // PASO 2: Construcción del Payload (Golden Template)
    const payload = {
      circuitoContable: { ID: -2, id: -2 }, 
      comprobante: 1, 
      tipo: 1, 
      cliente: { ID: parseInt(clienteId), id: parseInt(clienteId) },
      fecha: new Date().toISOString().split('T')[0],
      fechaVto: new Date().toISOString().split('T')[0],
      condicionDePago: 7, // Valor exitoso según ID 67747886
      puntoVenta: { ID: parseInt(puntoVentaId), id: parseInt(puntoVentaId) },
      vendedor: { ID: 0 },
      deposito: { ID: -2, id: -2 }, 
      listaDePrecio: { ID: parseInt(listaDePrecioId), id: parseInt(listaDePrecioId) },
      
      // Datos automáticos del cliente
      provincia: datosCliente.provincia,
      localidad: datosCliente.localidad,

      transaccionProductoItems: [{
        cantidad: parseFloat(cantidad),
        precio: parseFloat(precioUnitario),
        descripcion: descripcion,
        producto: { ID: parseInt(productoId), id: parseInt(productoId) },
        deposito: { ID: -2, id: -2 }, // Obligatorio según molde
        iva: iva,
        importe: neto,
        total: total,
        precioconivaincluido: 0,
        montoExento: 0,
        porcentajeDescuento: 0
      }],

      // Inyectar Centro de Costo solo si se envía
      ...(centroDeCostoId && { 
        transaccionProductoItems: [{
          ...payload.transaccionProductoItems[0],
          centroDeCosto: { ID: parseInt(centroDeCostoId), id: parseInt(centroDeCostoId) }
        }]
      }),

      moneda: { ID: -3, id: -3 }, // Dólares
      cotizacion: cotizacionUSD,
      cotizacionListaDePrecio: 1,
      utilizaMonedaExtranjera: 1,

      // Campos de montos específicos del molde
      importetotal: total,
      importeMonPrincipal: netoARS,

      // Otros campos obligatorios del molde
      cantComprobantesCancelados: 0,
      cantComprobantesEmitidos: 0,
      cbuinformada: false,
      facturaNoExportacion: false,
      mailEstado: "No Enviado",
      transaccionCobranzaItems: [],
      transaccionPercepcionItems: []
    };

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
      // Capturamos el error detallado de Xubio
      return res.status(response.status).json({ 
        success: false, 
        error: responseData.message || responseData.error || responseData.FunctionalException || "Error desconocido en Xubio",
        debug: responseData 
      });
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
    return res.status(500).json({ success: false, error: error.message });
  }
}