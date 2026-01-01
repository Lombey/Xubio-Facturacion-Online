/**
 * Build XML Payload Utility
 *
 * Construye el payload XML Legacy para crear facturas en Xubio
 * Basado en template GOLD validado en producción
 */

/**
 * Configuración de la empresa (corvusweb srl)
 */
const CONFIG_EMPRESA = {
  empresaId: 234054,
  empresaNombre: 'corvusweb srl',
  puntoVentaId: 212819,
  talonarioId: 11290129,
  listaPrecioId: 15386,
  descripcionBancaria: `CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5`
};

/**
 * Producto principal AGDP
 */
const PRODUCTO_AGDP = {
  id: 2751338,
  nombre: 'CONECTIVIDAD ANUAL POR TOLVA',
  descripcion: 'Incluye Licencia para uso de un equipo por un año  - Incluye Licencia usuario y acceso a la plataforma web de AGDP - Incluye servicio soporte post venta REMOTO - Incluye mesa de ayuda',
  precio: 490, // USD
  iva: 21
};

/**
 * Formatea fecha a formato compatible con Xubio XML
 * @param {Date} date - Fecha a formatear
 * @param {string} format - Formato: 'date' (yyyy-MM-dd) o 'datetime' (yyyy-MM-dd HH:mm)
 * @returns {string} Fecha formateada
 */
function formatDate(date, format = 'date') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'date') {
    return `${year}-${month}-${day}`;
  }

  // datetime
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Construye el payload XML completo para crear una factura
 *
 * @param {Object} params - Parámetros de la factura
 * @param {Object} params.cliente - Datos del cliente
 * @param {number} params.cliente.id - ID del cliente en Xubio
 * @param {string} params.cliente.nombre - Nombre del cliente
 * @param {number} params.cliente.provinciaId - ID de provincia
 * @param {string} params.cliente.provinciaNombre - Nombre de provincia
 * @param {number} params.cliente.localidadId - ID de localidad
 * @param {string} params.cliente.localidadNombre - Nombre de localidad
 * @param {number} params.cantidad - Cantidad de productos (default: 1)
 * @param {number} params.cotizacionUSD - Cotización USD a ARS
 * @returns {string} Payload XML completo
 */
export function buildXMLPayload(params) {
  const { cliente, cantidad = 1, cotizacionUSD } = params;

  // Fecha actual (Argentina timezone UTC-3)
  const ahora = new Date();
  const fechaISO = formatDate(ahora, 'date');
  const fechaDisplay = formatDate(ahora, 'datetime');

  // Calcular totales
  const subtotal = PRODUCTO_AGDP.precio * cantidad;
  const iva = parseFloat((subtotal * (PRODUCTO_AGDP.iva / 100)).toFixed(2));
  const total = subtotal + iva;

  // Totales en pesos (para asiento contable)
  const totalARS = total * cotizacionUSD;
  const ivaARS = iva * cotizacionUSD;
  const subtotalARS = subtotal * cotizacionUSD;

  // Construir XML basado en template GOLD
  const xml = `<df>
  <config>
    <javaClass value="app.nexiviaAR.ui.transaccion.form.FacturaVentaNXVARForm"/>
    <lightMode value="0"/>
    <userDataValues>
      <userDataValue name="auditID"><![CDATA[0]]></userDataValue>
      <userDataValue name="isTransaction"><![CDATA[true]]></userDataValue>
      <userDataValue name="v_PuntoVenta_Electronico"><![CDATA[true]]></userDataValue>
      <userDataValue name="standardXml"><![CDATA[claseVO=FacturaVentaARNXVVO|docID=220|adhocXmlFile=facturaVentaARNXV]]></userDataValue>
      <userDataValue name="TransaccionCategoriaID"><![CDATA[-8]]></userDataValue>
      <userDataValue name="v_Talonario_Modo"><![CDATA[1]]></userDataValue>
      <userDataValue name="v_Factura_Aplicada"><![CDATA[false]]></userDataValue>
      <userDataValue name="auditClass"><![CDATA[app.nexivia.transacciones.compraVenta.ventas.facturaVenta.model.FacturaVentaNXVVO]]></userDataValue>
      <userDataValue name="v_ListaPrecio_MonedaID"><![CDATA[-3]]></userDataValue>
      <userDataValue name="v_Categoria_Fiscal"><![CDATA[1]]></userDataValue>
      <userDataValue name="v_Transaccion_Conciliada"><![CDATA[false]]></userDataValue>
      <userDataValue name="TransaccionSubTipoID"><![CDATA[220]]></userDataValue>
      <userDataValue name="vo"><![CDATA[FacturaVentaARNXVVO]]></userDataValue>
      <userDataValue name="action"><![CDATA[save]]></userDataValue>
    </userDataValues>
  </config>
  <dataset>
    <data>
      <pk value="0"/>
      <EmpresaID type="C" id="${CONFIG_EMPRESA.empresaId}" value="${CONFIG_EMPRESA.empresaNombre}"/>
      <OrganizacionID type="C" id="${cliente.id}" value="${cliente.nombre}"/>
      <PuntoVentaID type="C" id="${CONFIG_EMPRESA.puntoVentaId}" value="${CONFIG_EMPRESA.empresaNombre}"/>
      <TalonarioID type="C" id="${CONFIG_EMPRESA.talonarioId}" value="Facturas de Venta A"/>
      <Tipo type="CB" id="1" value="Factura"/>
      <NumeroDocumento value=""/>
      <Fecha type="date" value="${fechaDisplay}"/>
      <FechaVencimiento type="date" value="${fechaDisplay}"/>
      <FechaEmision type="date" value="${fechaDisplay}"/>
      <FechaCotizacion type="date" value="${fechaDisplay}"/>
      <CondicionDePago type="CB" id="7" value="Otra"/>
      <CantComprobantesEmitidos value=""/>
      <CantComprobantesCancelados value=""/>
      <ProvinciaID type="C" id="${cliente.provinciaId}" value="${cliente.provinciaNombre}"/>
      <LocalidadID type="C" id="${cliente.localidadId}" value="${cliente.localidadNombre}"/>
      <MonedaID type="C" id="-3" value="Dólares"/>
      <Cotizacion value="${cotizacionUSD}" type="DEC"/>
      <CotizacionLista value="1" type="DEC"/>
      <ListaPrecioID type="C" id="${CONFIG_EMPRESA.listaPrecioId}" value="AGDP"/>
      <DepositoID type="C" id="-2" value="Depósito Universal"/>
      <VendedorID type="C" id="0" value=""/>
      <PorcentajeComision value="0" type="DEC"/>
      <PorcentajeDescuentoGenerico value="0" type="DEC"/>
      <CircuitoContableID type="C" id="-2" value="default"/>
      <ObservacionPredeterminadaID type="C" id="0" value=""/>
      <CBUInformada type="CB" id="0" value="Sin Leyenda"/>
      <NumeroInterno value="123456789" type="LNG"/>
      <TienePeriodoServicio value="0"/>
      <FacturaNoExportacion value="0"/>
      <anulacion value="0"/>
      <externalid value=""/>
      <Descripcion type="cdata"><![CDATA[${CONFIG_EMPRESA.descripcionBancaria}]]></Descripcion>
      <TransaccionCVItems type="D" count="1">
        <row>
          <pk value="0"/>
          <ProductoID type="C" id="${PRODUCTO_AGDP.id}" value="${PRODUCTO_AGDP.nombre}"/>
          <CentroDeCostoID type="C" id="" value=""/>
          <Descripcion value="${PRODUCTO_AGDP.descripcion}"/>
          <Cantidad value="${cantidad}.0000"/>
          <Precio value="${(subtotal / cantidad).toFixed(4)}"/>
          <PrecioConIvaIncluido value="0.0000"/>
          <PorcentajeDescuento value="0.000000"/>
          <Importe value="${subtotal.toFixed(4)}"/>
          <ImporteConIvaIncluido value="0.0000"/>
          <ImporteImpuesto value="${iva.toFixed(4)}"/>
          <ImporteExento value="0.0000"/>
          <ImporteTotal value="${total.toFixed(4)}"/>
          <EditoImpuesto value="0"/>
          <Tipo value="1"/>
          <porcentajetasaimpositiva value="${PRODUCTO_AGDP.iva}.00"/>
          <depositoid type="C" id="-2" value="Depósito Universal"/>
        </row>
      </TransaccionCVItems>
      <M_MostrarDeducciones value="1"/>
      <TransaccionCVItemsDeducciones type="D" count="1">
        <row index="1">
          <pk value="0"/>
          <TransaccionID value=""/>
          <TransaccionCVItemID value=""/>
          <ProductoID type="C" id="0" value=""/>
          <CentroDeCostoID type="C" id="0" value=""/>
          <Descripcion value=""/>
          <Precio value="0" type="DEC"/>
          <PrecioConIvaIncluido value="0" type="DEC"/>
          <Importe value="0" type="DEC"/>
          <ImporteConIvaIncluido value="0" type="DEC"/>
          <ImporteImpuesto value="0" type="DEC"/>
          <ImporteExento value="0" type="DEC"/>
          <ImporteTotal value="0" type="DEC"/>
          <EditoImpuesto value="0"/>
          <Tipo value="4" type="LNG"/>
        </row>
      </TransaccionCVItemsDeducciones>
      <M_AgregarRetenciones value="0"/>
      <TransaccionTesoreriaRetencionItemsLPG type="D" count="1">
        <row index="1">
          <pk value="0"/>
          <TransaccionID value=""/>
          <AsientoItemID value=""/>
          <CuentaID type="C" id="0" value=""/>
          <M_RetencionTipo type="CB" id="-1" value=""/>
          <RetencionID type="C" id="0" value=""/>
          <Descripcion value=""/>
          <ImporteMonTransaccion value="0" type="DEC"/>
          <ImporteMonPrincipal value="0" type="DEC"/>
          <FechaVto type="date" value="${fechaDisplay}"/>
          <NroComprobanteRetencion value=""/>
          <CotizacionMonTransaccion value="1" type="DEC"/>
          <MonedaIDTransaccion value="-1" type="DEC"/>
        </row>
      </TransaccionTesoreriaRetencionItemsLPG>
      <M_AgregarRemitos value="0"/>
      <ComprobanteRemitosItems type="D" count="1">
        <row index="1">
          <pk value="0"/>
          <TransaccionID value=""/>
          <ComprobanteRemitoID value=""/>
          <RemitoID type="C" id="0" value=""/>
          <Descripcion value=""/>
        </row>
      </ComprobanteRemitosItems>
      <M_AgregarPercepciones value="0"/>
      <TransaccionCVItemsPercepciones type="D" count="1">
        <row index="1">
          <pk value="0"/>
          <TransaccionID value=""/>
          <TransaccionCVItemID value=""/>
          <ProductoID type="C" id="0" value=""/>
          <Descripcion value=""/>
          <ProductoRetencionRelacionadoID type="C" id="0" value=""/>
          <ImporteISAR value="0" type="DEC"/>
          <TasaRetencion type="CB" id="" value="null"/>
          <Importe value="0" type="DEC"/>
          <Tipo value="2" type="LNG"/>
        </row>
      </TransaccionCVItemsPercepciones>
      <M_AgregarContado value="0"/>
      <TransaccionTesoreriaIngresoItems type="D" count="1">
        <row index="1">
          <pk value="0"/>
          <TransaccionID value=""/>
          <AsientoItemID value=""/>
          <M_CuentaTipo type="C" id="0" value=""/>
          <CuentaID type="C" id="0" value=""/>
          <MonedaIDTransaccion type="C" id="-2" value="Pesos Argentinos"/>
          <CotizacionMonTransaccion value="1" type="DEC"/>
          <ImporteMonTransaccion value="0" type="DEC"/>
          <ImporteMonPrincipal value="0" type="DEC"/>
          <M_Banco type="C" id="0" value=""/>
          <Descripcion value=""/>
          <M_NumeroCheque value=""/>
          <FechaVto type="date" value=""/>
          <DebeHaber value="1" type="LNG"/>
        </row>
      </TransaccionTesoreriaIngresoItems>
      <TransaccionAsientoItems type="D" count="3">
        <row>
          <pk value="0"/>
          <TransaccionID type="cdata"><![CDATA[0]]></TransaccionID>
          <AsientoItemID type="cdata"><![CDATA[0]]></AsientoItemID>
          <CuentaID type="C" id="-3" value="Deudores por Venta"/>
          <M_ImporteMonPrincipalDebe value="${totalARS.toFixed(4)}"/>
          <M_ImporteMonPrincipalHaber value="0"/>
          <descripcion value=""/>
          <operacionbancariaid type="C" id="" value=""/>
          <control1 value=""/>
          <importemonsecundaria value="0.0000"/>
          <organizacionid type="C" id="${cliente.id}" value="${cliente.nombre}"/>
          <productoid type="C" id="" value=""/>
          <debehaber value="1"/>
          <importemontransaccion value="${total.toFixed(4)}"/>
          <importemonprincipal value="${totalARS.toFixed(4)}"/>
          <monedaidtransaccion type="C" id="-3" value="Dólares"/>
          <fechavto type="date" value="${fechaDisplay}"/>
          <itemid value=""/>
          <centrodecostoid type="C" id="" value=""/>
          <documentofisicoid type="C" id="" value=""/>
          <importetotal value="${total.toFixed(4)}"/>
          <importecanceladomontransaccion value="0.0000"/>
          <itemtipo value=""/>
          <estadoiddocumentofisico type="C" id="" value=""/>
          <cotizacionmontransaccion value="${cotizacionUSD}.000000"/>
          <importecanceladomonprincipal value="0.0000"/>
        </row>
        <row>
          <pk value="0"/>
          <TransaccionID type="cdata"><![CDATA[0]]></TransaccionID>
          <AsientoItemID type="cdata"><![CDATA[0]]></AsientoItemID>
          <CuentaID type="C" id="-8" value="IVA Débito Fiscal"/>
          <M_ImporteMonPrincipalDebe value="0"/>
          <M_ImporteMonPrincipalHaber value="${ivaARS.toFixed(4)}"/>
          <descripcion value=""/>
          <operacionbancariaid type="C" id="" value=""/>
          <control1 value=""/>
          <importemonsecundaria value="0.0000"/>
          <organizacionid type="C" id="" value=""/>
          <productoid type="C" id="" value=""/>
          <debehaber value="-1"/>
          <importemontransaccion value="${iva.toFixed(4)}"/>
          <importemonprincipal value="${ivaARS.toFixed(4)}"/>
          <monedaidtransaccion type="C" id="-3" value="Dólares"/>
          <fechavto type="date" value=""/>
          <itemid value=""/>
          <centrodecostoid type="C" id="" value=""/>
          <documentofisicoid type="C" id="" value=""/>
          <importetotal value="${total.toFixed(4)}"/>
          <importecanceladomontransaccion value="0.0000"/>
          <itemtipo value=""/>
          <estadoiddocumentofisico type="C" id="" value=""/>
          <cotizacionmontransaccion value="${cotizacionUSD}.000000"/>
          <importecanceladomonprincipal value="0.0000"/>
        </row>
        <row>
          <pk value="0"/>
          <TransaccionID type="cdata"><![CDATA[0]]></TransaccionID>
          <AsientoItemID type="cdata"><![CDATA[0]]></AsientoItemID>
          <CuentaID type="C" id="-15" value="Venta de Servicios"/>
          <M_ImporteMonPrincipalDebe value="0"/>
          <M_ImporteMonPrincipalHaber value="${subtotalARS.toFixed(4)}"/>
          <descripcion value="${PRODUCTO_AGDP.descripcion}"/>
          <operacionbancariaid type="C" id="" value=""/>
          <control1 value=""/>
          <importemonsecundaria value="0.0000"/>
          <organizacionid type="C" id="" value=""/>
          <productoid type="C" id="${PRODUCTO_AGDP.id}" value="${PRODUCTO_AGDP.nombre}"/>
          <debehaber value="-1"/>
          <importemontransaccion value="${subtotal.toFixed(4)}"/>
          <importemonprincipal value="${subtotalARS.toFixed(4)}"/>
          <monedaidtransaccion type="C" id="-3" value="Dólares"/>
          <fechavto type="date" value=""/>
          <itemid value="0"/>
          <centrodecostoid type="C" id="" value=""/>
          <documentofisicoid type="C" id="" value=""/>
          <importetotal value="${total.toFixed(4)}"/>
          <importecanceladomontransaccion value="0.0000"/>
          <itemtipo value=""/>
          <estadoiddocumentofisico type="C" id="" value=""/>
          <cotizacionmontransaccion value="${cotizacionUSD}.000000"/>
          <importecanceladomonprincipal value="0.0000"/>
        </row>
      </TransaccionAsientoItems>
      <M_ImporteGravado value="${subtotal}" type="DEC"/>
      <M_ImporteImpuestos value="${iva}" type="DEC"/>
      <M_ImporteDeducciones value="" type="DEC"/>
      <M_ImporteTotal value="${total}" type="DEC"/>
      <TotalIngresosMonPrincipal value="0" type="DEC"/>
      <transaccionsubtipoid type="C" id="220" value="Comprobante de Venta"/>
      <barcodeimageurl value=""/>
      <afip_codigo value="001"/>
      <sellosat value=""/>
      <fechafin type="date" value=""/>
      <transaccionidanterior type="C" id="" value=""/>
      <totalegresosmonprincipal value=""/>
      <fechafiscal type="date" value=""/>
      <numparcialidad value=""/>
      <resolucionnumeroprimercomprobante value=""/>
      <resolucionfechavigenciahasta type="date" value=""/>
      <motivocancelacionid value=""/>
      <tiporelacionid value=""/>
      <numerocertificado value=""/>
      <resolucionnumeroultimocomprobante value=""/>
      <retencionactividadeconomica value=""/>
      <resolucionfechavigenciadesde type="date" value=""/>
      <transaccionid value="0"/>
      <condicionpagocomercial value=""/>
      <fechacomprobante type="date" value="${fechaDisplay}"/>
      <sellodigital value=""/>
      <eliminable value="0"/>
      <facturacionventamercadoshopid type="C" id="" value=""/>
      <transacciontipoid type="C" id="-7" value="Comprobante de Venta"/>
      <noeditablecae value="0"/>
      <origenid value=""/>
      <actividadeconomicaid type="C" id="" value=""/>
      <resolucionnumero value=""/>
      <externalid value=""/>
      <transaccionidsiguiente type="C" id="" value=""/>
      <condicionentregaid type="C" id="" value=""/>
      <fechainicio type="date" value=""/>
      <foliosustitucionid value=""/>
      <noeditable value="0"/>
      <cadenaoriginal value=""/>
      <cufe value=""/>
      <tiendanubeorderid value=""/>
      <usuarioidinsert value=""/>
      <fechainsert value=""/>
      <esreferenciado value="0"/>
      <generadoautomaticamente value="0"/>
      <nombre value="Factura de Venta AGDP"/>
      <fechatimbrado value=""/>
      <obtuvocae value="0"/>
      <xmlrespuestaelectronica value=""/>
      <transaccionasociadamotivoid type="C" id="" value=""/>
      <certificado value=""/>
      <transacciontareaid value=""/>
    </data>
  </dataset>
</df>`;

  return xml;
}
