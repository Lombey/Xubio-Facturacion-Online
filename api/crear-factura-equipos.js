/**
 * Crear Factura Equipos Endpoint (Vercel)
 * Facturación de múltiples equipos (Kits AGDP) en una sola factura
 *
 * Soporta múltiples items: Kits + Licencias opcionales
 */

import { getOfficialToken } from './utils/tokenManager.js';
import { obtenerOcrearCliente } from './utils/clienteHelper.js';

// URL base de Vercel - siempre usar producción para llamadas internas
// (VERCEL_URL puede apuntar a preview deployments con código desactualizado)
const VERCEL_BASE = 'https://xubio-facturacion-online.vercel.app';

async function obtenerCotizacion() {
  try {
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
    return 1480;
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
    return `https://xubio.com/NXV/transaccion/ver/${transaccionId}`;
  }
}

async function solicitarCAE(token, transaccionId) {
  try {
    console.log('📋 Solicitando CAE para transacción:', transaccionId);
    const url = 'https://xubio.com/API/1.1/solicitarCAE';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ transaccionId: parseInt(transaccionId) })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error solicitando CAE: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ CAE obtenido:', data.CAE || data.cae);
    return data;
  } catch (e) {
    console.error('⚠️ Error al solicitar CAE:', e.message);
    return null;
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
      cuit,                 // CUIT del cliente (nuevo - reemplaza clienteId)
      clienteId: clienteIdLegacy,  // Mantener compatibilidad hacia atrás
      items = [],           // Array de { productoId, cantidad, precio, descripcion }
      externalId,
      descuento = 0,        // Porcentaje de descuento (ej: 25 = 25%)
      puntoVentaId = 212819,
      listaDePrecioId = 15386,
      centroDeCostoId = 57329
    } = req.body;

    // Validar que venga CUIT o clienteId (legacy)
    if (!cuit && !clienteIdLegacy) {
      return res.status(400).json({ error: 'Falta cuit o clienteId' });
    }
    if (!items || items.length === 0) return res.status(400).json({ error: 'Falta items' });

    const descuentoPct = parseFloat(descuento) || 0;
    const factorDescuento = descuentoPct > 0 ? (1 - descuentoPct / 100) : 1;

    console.log('📦 Creando factura de equipos...');
    console.log('   Items:', items.length);
    if (descuentoPct > 0) {
      console.log('   Descuento:', descuentoPct + '%');
    }

    const token = await getOfficialToken();

    // Obtener o crear cliente
    let clienteId;
    let datosCliente;

    if (cuit) {
      // Nuevo flujo: obtener o crear cliente por CUIT
      const clienteResult = await obtenerOcrearCliente(cuit, VERCEL_BASE);
      clienteId = clienteResult.cliente_id;

      if (clienteResult.esNuevo) {
        console.log('   🆕 Cliente NUEVO creado automáticamente');
      }

      // Obtener datos completos del cliente
      datosCliente = await obtenerDatosCliente(token, clienteId);
    } else {
      // Legacy: usar clienteId directamente
      clienteId = clienteIdLegacy;
      datosCliente = await obtenerDatosCliente(token, clienteId);
    }

    console.log('   Cliente:', datosCliente.nombre, '(ID:', clienteId, ')');
    const cotizacionUSD = await obtenerCotizacion();

    // Construir items para Xubio
    const transaccionProductoItems = [];
    let totalNeto = 0;

    for (const item of items) {
      const cantidad = parseFloat(item.cantidad) || 1;
      const precio = parseFloat(item.precio) || 0;
      const importeSinDescuento = Number((precio * cantidad).toFixed(2));
      const importe = Number((importeSinDescuento * factorDescuento).toFixed(2)); // Aplicar descuento
      totalNeto += importe;

      const xubioItem = {
        importe: importe,
        descripcion: item.descripcion || 'PRODUCTO',
        cantidad: cantidad,
        precio: precio,
        producto: {
          ID: parseInt(item.productoId),
          id: parseInt(item.productoId)
        },
        deposito: {
          ID: -2, id: -2,
          nombre: "Depósito Universal",
          codigo: "DEPOSITO_UNIVERSAL"
        },
        total: Number((importe * 1.21).toFixed(2)), // Neto con descuento + IVA
        precioconivaincluido: 0,
        montoExento: 0,
        porcentajeDescuento: descuentoPct
      };

      if (centroDeCostoId) {
        xubioItem.centroDeCosto = { ID: parseInt(centroDeCostoId), id: parseInt(centroDeCostoId) };
      }

      transaccionProductoItems.push(xubioItem);
      if (descuentoPct > 0) {
        console.log(`   Item: ${item.descripcion} x${cantidad} @ $${precio} - ${descuentoPct}% = $${importe}`);
      } else {
        console.log(`   Item: ${item.descripcion} x${cantidad} @ $${precio} = $${importe}`);
      }
    }

    // Calcular totales
    const iva = Number((totalNeto * 0.21).toFixed(2));
    const total = Number((totalNeto + iva).toFixed(2));
    const totalARS = Number((total * cotizacionUSD).toFixed(2));

    console.log('   Total Neto USD:', totalNeto);
    console.log('   IVA:', iva);
    console.log('   Total USD:', total);

    const DESCRIPCION_BANCARIA = `CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5`;

    const payload = {
      numeroDocumento: "",
      descripcion: DESCRIPCION_BANCARIA,
      fecha: new Date().toISOString().split('T')[0],
      importeGravado: totalNeto,
      importeImpuestos: iva,
      importetotal: total,
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
      provincia: datosCliente.provincia,
      condicionDePago: 7,
      porcentajeComision: 0,
      transaccionProductoItems: transaccionProductoItems,
      puntoVenta: {
        ID: parseInt(puntoVentaId),
        id: parseInt(puntoVentaId),
        nombre: "corvusweb srl",
        codigo: "CORVUSWEB_SRL"
      },
      facturaNoExportacion: false,
      externalId: externalId,
      cliente: {
        ID: parseInt(clienteId),
        id: parseInt(clienteId),
        nombre: datosCliente.nombre || ""
      },
      tipo: 1,
      importeMonPrincipal: totalARS,
      mailEstado: "No Enviado",
      cbuinformada: false,
      transaccionPercepcionItems: [],
      transaccionCobranzaItems: []
    };

    console.log('📤 Enviando a Xubio...');

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
      console.error('❌ Error Xubio:', JSON.stringify(responseData));
      return res.status(response.status).json({
        success: false,
        error: "Error funcional en Xubio",
        debug: responseData
      });
    }

    const transaccionId = responseData.transaccionId || responseData.ID || responseData.transaccionid;

    // Solicitar CAE
    await solicitarCAE(token, transaccionId);

    // Obtener PDF
    const publicPdfUrl = await obtenerLinkPdfPublico(token, transaccionId);

    console.log('✅ Factura creada:', responseData.numeroDocumento);

    return res.status(200).json({
      success: true,
      data: {
        transaccionId: transaccionId,
        numeroDocumento: responseData.numeroDocumento,
        pdfUrl: publicPdfUrl,
        totalUSD: total,
        totalARS: totalARS,
        itemsFacturados: items.length
      }
    });

  } catch (error) {
    console.error('❌ ERROR CRÍTICO:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
