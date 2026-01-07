/**
 * POST /api/crear-cobranza-xml
 * Crea una cobranza en Xubio usando XML Legacy (con imputación automática)
 *
 * Este endpoint usa el mismo método que la UI de Xubio para crear cobranzas
 * con imputación directa a facturas.
 */

import { getOfficialToken } from './utils/tokenManager.js';

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

    // 1. Obtener token OAuth
    const token = await getOfficialToken();

    // 2. Obtener datos de la factura via REST API
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
    console.log('Factura obtenida:', JSON.stringify(factura, null, 2));

    // 3. Extraer datos necesarios
    const clienteId = factura.cliente?.ID || factura.cliente?.id;
    const clienteNombre = factura.cliente?.nombre || '';
    const monedaId = factura.moneda?.id || -2;
    const monedaNombre = factura.moneda?.nombre || 'Pesos Argentinos';
    const cotizacion = factura.cotizacion || 1;
    const totalFactura = factura.importetotal;
    const circuitoId = factura.circuitoContable?.id || -2;
    const circuitoNombre = factura.circuitoContable?.nombre || 'default';

    // Calcular importes
    const esUSD = monedaId === -3;
    const importeMonTransaccion = totalFactura; // En moneda de factura (USD o ARS)
    const importeMonPrincipal = esUSD ? (totalFactura * cotizacion) : totalFactura; // Siempre en ARS

    // Intentar obtener itemId del primer item de la factura
    const itemIdOrigen = factura.transaccionProductoItems?.[0]?.transaccionProductoItemId || '';

    // Fecha actual
    const now = new Date();
    const fechaStr = now.toISOString().split('T')[0] + ' 00:00';
    const fechaInsert = now.toISOString().replace('T', ' ').substring(0, 23);

    // 4. Construir XML basado en gold standard
    const xml = construirXMLCobranza({
      facturaId,
      itemIdOrigen,
      clienteId,
      clienteNombre,
      monedaId,
      monedaNombre,
      cotizacion,
      importeMonTransaccion,
      importeMonPrincipal,
      circuitoId,
      circuitoNombre,
      fechaStr,
      fechaInsert
    });

    console.log('XML a enviar:', xml);

    // 5. Enviar XML a Xubio
    const submitUrl = 'https://xubio.com/NXV/DF_submit';
    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': '*/*'
      },
      body: xml
    });

    const responseText = await submitRes.text();
    console.log('Response Code:', submitRes.status);
    console.log('Response Body:', responseText);

    // 6. Parsear respuesta
    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        success: false,
        error: `Error de Xubio: HTTP ${submitRes.status}`,
        debug: { responseText }
      });
    }

    // Verificar si hay error en el XML de respuesta
    if (responseText.includes('error') || responseText.includes('Exception')) {
      return res.status(400).json({
        success: false,
        error: 'Xubio retornó error en XML',
        debug: { responseText }
      });
    }

    // Extraer transaccionId de la respuesta si es posible
    const transaccionIdMatch = responseText.match(/transaccionid[^>]*value="(\d+)"/i);
    const numeroDocMatch = responseText.match(/NumeroDocumento[^>]*value="([^"]+)"/i);

    return res.status(200).json({
      success: true,
      data: {
        cobranzaId: transaccionIdMatch ? transaccionIdMatch[1] : 'ver-en-xubio',
        numeroRecibo: numeroDocMatch ? numeroDocMatch[1] : 'ver-en-xubio',
        factura: factura.numeroDocumento,
        cliente: clienteNombre,
        total: totalFactura,
        metodo: 'XML_LEGACY'
      },
      debug: {
        xmlEnviado: xml.substring(0, 500) + '...',
        responsePreview: responseText.substring(0, 500)
      }
    });

  } catch (error) {
    console.error('Error creando cobranza XML:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al crear cobranza XML'
    });
  }
}

/**
 * Construye el XML de cobranza basado en el gold standard capturado de la UI
 */
function construirXMLCobranza(params) {
  const {
    facturaId,
    itemIdOrigen,
    clienteId,
    clienteNombre,
    monedaId,
    monedaNombre,
    cotizacion,
    importeMonTransaccion,
    importeMonPrincipal,
    circuitoId,
    circuitoNombre,
    fechaStr,
    fechaInsert
  } = params;

  // Formatear cotización con 6 decimales
  const cotizacionStr = cotizacion.toFixed(6);

  const xmlContent = `<df><config><javaClass value="app.nexivia.ui.transaccion.form.CobranzaNXVForm"/><lightMode value="0"/><userDataValues><userDataValue name="auditID"><![CDATA[-1]]></userDataValue><userDataValue name="isTransaction"><![CDATA[true]]></userDataValue><userDataValue name="NoProponerAplicaciones"><![CDATA[1]]></userDataValue><userDataValue name="standardXml"><![CDATA[claseVO=CobranzaARNXVVO|docID=228]]></userDataValue><userDataValue name="titulo"><![CDATA[Nuevo - ${clienteNombre} - Cobranza]]></userDataValue><userDataValue name="PonerReadOnly"><![CDATA[1]]></userDataValue><userDataValue name="auditClass"><![CDATA[app.nexivia.transacciones.tesoreria.cobranzas.model.CobranzaNXVVO]]></userDataValue><userDataValue name="EsLPG"><![CDATA[false]]></userDataValue><userDataValue name="v_Cobranza_Aplicada"><![CDATA[false]]></userDataValue><userDataValue name="v_Transaccion_Conciliada"><![CDATA[false]]></userDataValue><userDataValue name="TransaccionSubTipoID"><![CDATA[228]]></userDataValue><userDataValue name="utilizaCotizacionOrigen"><![CDATA[true]]></userDataValue><userDataValue name="vo"><![CDATA[CobranzaARNXVVO]]></userDataValue><userDataValue name="action"><![CDATA[save]]></userDataValue></userDataValues></config><dataset><data><pk value="-1"/><EmpresaID type="C" id="234054" value="corvusweb srl"/><ComprobanteElectronicomxID type="C" id="0" value=""/><M_IdsExtractos value=""/><M_Cuentaid value="" type="LNG"/><M_EstadoFK type="C" id="0" value=""/><M_EstadoID value=""/><OrganizacionID type="C" id="${clienteId}" value="${clienteNombre}"/><NumeroDocumento value=""/><Fecha type="date" value="${fechaStr}"/><FacturacionTenantID type="C" id="0" value=""/><MostrarOpciones value="0"/><OrganizacionSucursalItemID type="C" id="0" value=""/><MonedaID type="C" id="${monedaId}" value="${monedaNombre}"/><Cotizacion value="${cotizacion}" type="DEC"/><leyendaCotizacion value=""/><UtilizaMonedaExtranjera value="0"/><NumeroInterno value="0" type="LNG"/><Descripcion type="cdata"><![CDATA[]]></Descripcion><CircuitoContableID type="C" id="${circuitoId}" value="${circuitoNombre}"/><TransaccionTesoreriaIngresoItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID type="cdata"/><AsientoItemID type="cdata"/><M_CuentaTipo type="C" id="2" value="Banco"/><CuentaID type="C" id="-14" value="Banco"/><MonedaIDTransaccion type="C" id="-2" value="Pesos Argentinos"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteMonTransaccion value="${importeMonPrincipal}" type="DEC"/><ImporteMonPrincipal value="${importeMonPrincipal}"/><M_Banco type="C" id="" value=""/><Descripcion value=""/><M_NumeroCheque value=""/><FechaVto type="date" value=""/><DebeHaber value="1" type="LNG"/><operacionbancariaid type="C" id="" value=""/><control1 value=""/><importemonsecundaria value=""/><organizacionid type="C" id="" value=""/><productoid type="C" id="" value=""/><itemid value=""/><centrodecostoid type="C" id="" value=""/><documentofisicoid type="C" id="" value=""/><importetotal value=""/><importecanceladomontransaccion value=""/><estadoiddocumentofisico type="C" id="" value=""/><itemtipo value="0"/><importecanceladomonprincipal value=""/></row></TransaccionTesoreriaIngresoItems><TransaccionTesoreriaEgresoItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><CuentaID type="C" id="0" value=""/><Descripcion value=""/><MonedaIDTransaccion type="C" id="-2" value="Pesos Argentinos"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteMonTransaccion value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><FechaVto type="date" value=""/><DebeHaber value="-1" type="LNG"/></row></TransaccionTesoreriaEgresoItems><TransaccionTesoreriaCtaCteItems type="D" count="1"><row><pk value="0"/><TransaccionID type="cdata"/><M_ItemIDOrigen value="${itemIdOrigen}"/><M_TransaccionIDOrigen value="${facturaId}"/><M_CotizacionItemOrigen value=""/><AsientoItemID type="cdata"/><CuentaID type="C" id="-3" value="Deudores por Venta"/><MonedaIDTransaccion type="C" id="${monedaId}" value="${monedaNombre}"/><CotizacionMonTransaccion value="${cotizacionStr}"/><ImporteMonTransaccion value="${importeMonTransaccion.toFixed(2)}"/><ImporteMonPrincipal value="${importeMonPrincipal.toFixed(2)}"/><Descripcion value=""/><FechaVto type="date" value=""/><DebeHaber value="-1"/><operacionbancariaid type="C" id="" value=""/><control1 value=""/><importemonsecundaria value=""/><organizacionid type="C" id="${clienteId}" value=""/><productoid type="C" id="" value=""/><itemid value=""/><centrodecostoid type="C" id="" value=""/><documentofisicoid type="C" id="" value=""/><importetotal value=""/><importecanceladomontransaccion value=""/><estadoiddocumentofisico type="C" id="" value=""/><itemtipo value="2"/><importecanceladomonprincipal value=""/></row></TransaccionTesoreriaCtaCteItems><M_AgregarRetenciones value="0"/><TransaccionTesoreriaRetencionItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><CuentaID type="C" id="0" value=""/><M_RetencionTipo type="CB" id="-1" value=""/><RetencionID type="C" id="0" value=""/><Descripcion value=""/><MonedaIDTransaccion type="C" id="-2" value="Pesos Argentinos"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteISAR value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><ImporteMonTransaccion value="0" type="DEC"/><FechaVto type="date" value="${fechaStr}"/><NroComprobanteRetencion value=""/></row></TransaccionTesoreriaRetencionItems><TransaccionAsientoItems type="D" count="0"/><ImporteIva value="" type="DEC"/><ImporteIva8 value="" type="DEC"/><ImporteGravado value="" type="DEC"/><ImporteGravado8 value="" type="DEC"/><ImporteExento value="" type="DEC"/><ImporteNoComputable value="" type="DEC"/><ImporteImpuesto value="" type="DEC"/><ImporteNoObjetoDeImpuesto value="" type="DEC"/><ImporteRetencionIva value="" type="DEC"/><TotalConcepto value="0" type="DEC"/><TotalIngresosMonPrincipal value="${importeMonPrincipal}" type="DEC"/><TotalEgresosMonPrincipal value="0" type="DEC"/><TotalRetencionMonPrincipal value="0" type="DEC"/><TotalCtaCteMonPrincipal value="${importeMonPrincipal}" type="DEC"/><transaccionsubtipoid type="C" id="228" value="${clienteNombre} - Cobranza"/><externalid value=""/><foliosustitucionid value=""/><noeditable value="0"/><comprobanteelectronicomanual value=""/><esanticipo value="0"/><numparcialidad value=""/><usuarioidinsert value=""/><fechainsert value="${fechaInsert}"/><generadoautomaticamente value=""/><motivocancelacionid value=""/><nombre value=""/><fechatimbrado value=""/><obtuvocae value=""/><talonarioid type="C" id="8410592" value=""/><importededucciones value=""/><transaccionid value="-1"/><importeretencionisr value=""/><formadepagoid type="C" id="" value=""/><debitobancofrances value=""/><importeimpuestos value=""/><eliminable value=""/><importeretencionieps value=""/><transacciontipoid type="C" id="-5" value=""/><origenid value=""/><importetotal value=""/><usocfdi value=""/><pagomercadopagoid value=""/><tipocomprobantesat value=""/><transacciontareaid value=""/></data></dataset></df>`;

  return xmlContent;
}
