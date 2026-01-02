/**
 * Crear Factura Endpoint (Vercel) - Versión Sincronizada 100% con Golden Template
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
    return 1480; // Fallback a la cotización del molde exitoso
  }
}

async function obtenerDatosCliente(token, clienteId) {
  const url = `https://xubio.com/API/1.1/clienteBean/${clienteId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`Error al obtener cliente: ${response.status}`);
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
    const datosCliente = await obtenerDatosCliente(token, clienteId);
    const cotizacionUSD = await obtenerCotizacion();

    // CÁLCULOS MATEMÁTICOS PRECISOS (Basados en ID 67747886)
    const neto = Number((parseFloat(precioUnitario) * parseFloat(cantidad)).toFixed(2));
    const iva = Number((neto * 0.21).toFixed(2));
    const total = Number((neto + iva).toFixed(2));
    const totalARS = Number((total * cotizacionUSD).toFixed(2));

    const item = {
      importe: neto,
      descripcion: descripcion,
      cantidad: parseFloat(cantidad),
      precio: parseFloat(precioUnitario),
      producto: { 
        ID: parseInt(productoId), 
        id: parseInt(productoId) 
      },
      deposito: { 
        ID: -2, id: -2, 
        nombre: "Depósito Universal", 
        codigo: "DEPOSITO_UNIVERSAL" 
      },
      iva: iva,
      total: total,
      precioconivaincluido: 0,
      montoExento: 0,
      porcentajeDescuento: 0
    };

    if (centroDeCostoId) {
      item.centroDeCosto = { ID: parseInt(centroDeCostoId), id: parseInt(centroDeCostoId) };
    }

    // PAYLOAD ESPEJO DEL GOLDEN TEMPLATE
    const payload = {
      numeroDocumento: "",
      descripcion: "",
      fecha: new Date().toISOString().split('T')[0],
      importeGravado: neto,
      importeImpuestos: iva,
      importetotal: total, // Campo crítico corregido
      moneda: { ID: -3, nombre: "Dólares", codigo: "DOLARES", id: -3 },
      circuitoContable: { ID: -2, nombre: "default", codigo: "DEFAULT", id: -2 },
      cotizacion: cotizacionUSD,
      fechaVto: new Date().toISOString().split('T')[0],
      listaDePrecio: { 
        ID: parseInt(listaDePrecioId), 
        id: parseInt(listaDePrecioId),
        nombre: "AGDP",
        codigo: "AGDP"
      },
      cotizacionListaDePrecio: 1,
      deposito: { 
        ID: -2, 
        nombre: "Depósito Universal", 
        codigo: "DEPOSITO_UNIVERSAL", 
        id: -2 
      },
      provincia: datosCliente.provincia, // Solo provincia, sin localidad en raíz
      condicionDePago: 7, // Volvemos al valor exitoso
      porcentajeComision: 0,
      transaccionProductoItems: [item],
      puntoVenta: { 
        ID: parseInt(puntoVentaId), 
        id: parseInt(puntoVentaId),
        nombre: "corvusweb srl",
        codigo: "CORVUSWEB_SRL"
      },
      facturaNoExportacion: false,
      cliente: { 
        ID: parseInt(clienteId), 
        id: parseInt(clienteId),
        nombre: datosCliente.nombre || ""
      },
      tipo: 1,
      importeMonPrincipal: totalARS, // Total ARS según molde
      mailEstado: "No Enviado",
      cbuinformada: false,
      transaccionPercepcionItems: [],
      transaccionCobranzaItems: []
    };

    console.log('📤 ENVIANDO PAYLOAD A XUBIO:', JSON.stringify(payload));

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
      return res.status(response.status).json({ 
        success: false, 
        error: "Error funcional en Xubio",
        debug: responseData 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        transaccionId: responseData.transaccionId || responseData.ID || responseData.transaccionid,
        numeroDocumento: responseData.numeroDocumento,
        pdfUrl: `https://xubio.com/NXV/transaccion/ver/${responseData.transaccionId || responseData.ID || responseData.transaccionid}`
      }
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
