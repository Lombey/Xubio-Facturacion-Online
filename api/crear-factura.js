/**
 * Crear Factura Endpoint (Vercel) - Versión Sincronizada 100% con Golden Template
 */

import { getOfficialToken } from './utils/tokenManager.js';

async function obtenerCotizacion() {
  try {
    // DolarAPI - Dólar oficial Banco Nación (vendedor)
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
    if (!res.ok) throw new Error('DolarAPI error HTTP ' + res.status);

    const data = await res.json();
    const cotizacionVenta = parseFloat(data.venta);

    if (!cotizacionVenta || isNaN(cotizacionVenta)) {
      throw new Error('DolarAPI no retornó valor de venta válido');
    }

    console.log('💵 Cotización USD (DolarAPI): $' + cotizacionVenta);
    return cotizacionVenta;

  } catch (e) {
    console.error('⚠️ Error obteniendo cotización, usando fallback: ' + e.message);
    return 1480; // Fallback
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

async function obtenerPrecioDeLista(token, listaId, productoId) {
  const url = `https://xubio.com/API/1.1/listaPrecioBean/${listaId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`Error al obtener lista de precios: ${response.status}`);
  const data = await response.json();
  
  const item = (data.listaPrecioItem || []).find(i => 
    (i.producto.ID === parseInt(productoId)) || (i.producto.id === parseInt(productoId))
  );
  
  if (!item) throw new Error(`Producto ${productoId} no encontrado en lista de precios ${listaId}`);
  return parseFloat(item.precio);
}

async function obtenerLinkPdfPublico(token, transaccionId) {
  try {
    const url = `https://xubio.com/API/1.1/imprimirPDF?idtransaccion=${transaccionId}&tipoimpresion=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Error obteniendo PDF: ${response.status}`);
    const data = await response.json();
    return data.urlPdf; // Este es el link público de descarga
  } catch (e) {
    console.error('⚠️ Error al obtener link público del PDF:', e.message);
    // Fallback al link interno si falla el público, aunque no sea ideal
    return `https://xubio.com/NXV/transaccion/ver/${transaccionId}`;
  }
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
      externalId, // <-- Extraer ID externo
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

    // OBTENER PRECIO DE XUBIO (Fuente de Verdad)
    let precioFinal = parseFloat(precioUnitario);
    try {
      console.log(`🔎 Buscando precio en lista ${listaDePrecioId} para producto ${productoId}...`);
      const precioXubio = await obtenerPrecioDeLista(token, listaDePrecioId, productoId);
      console.log(`✅ Precio encontrado en Xubio: ${precioXubio}`);
      precioFinal = precioXubio;
    } catch (e) {
      console.warn(`⚠️ No se pudo obtener precio de Xubio: ${e.message}. Usando precio fallback: ${precioFinal}`);
    }

    // CÁLCULOS MATEMÁTICOS PRECISOS (Basados en ID 67747886)
    const neto = Number((precioFinal * parseFloat(cantidad)).toFixed(2));
    const iva = Number((neto * 0.21).toFixed(2));
    const total = Number((neto + iva).toFixed(2));
    const totalARS = Number((total * cotizacionUSD).toFixed(2));

    const item = {
      importe: neto,
      descripcion: descripcion, // Item description
      cantidad: parseFloat(cantidad),
      precio: precioFinal,
      producto: {
        ID: parseInt(productoId),
        id: parseInt(productoId)
      },
      deposito: {
        ID: -2, id: -2,
        nombre: "Depósito Universal",
        codigo: "DEPOSITO_UNIVERSAL"
      },
      // IMPORTANTE: NO incluir campo "iva" (validación de Xubio)
      total: total,
      precioconivaincluido: 0,
      montoExento: 0,
      porcentajeDescuento: 0
    };

    if (centroDeCostoId) {
      item.centroDeCosto = { ID: parseInt(centroDeCostoId), id: parseInt(centroDeCostoId) };
    }

    const DESCRIPCION_BANCARIA = `CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5`;

    // PAYLOAD ESPEJO DEL GOLDEN TEMPLATE
    const payload = {
      numeroDocumento: "",
      descripcion: DESCRIPCION_BANCARIA, // <-- Descripción general de la factura
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
      externalId: externalId, // IDEMPOTENCIA: Evita duplicados si AppSheet reintenta
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

    const response = await fetch('https://xubio.com/API/1.1/facturar', {
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

    const transaccionId = responseData.transaccionId || responseData.ID || responseData.transaccionid;
    
    // OBTENER LINK PÚBLICO DEL PDF
    const publicPdfUrl = await obtenerLinkPdfPublico(token, transaccionId);

    return res.status(200).json({
      success: true,
      data: {
        transaccionId: transaccionId,
        numeroDocumento: responseData.numeroDocumento,
        pdfUrl: publicPdfUrl // Link público directo
      }
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
