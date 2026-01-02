/* eslint-env browser */
/* global DINAMICFORM_ImprimirReportesGetReportes */

/**
 * Xubio Legacy XML API - Sistema de facturación con endpoint /NXV/DF_submit
 *
 * Este módulo crea facturas usando el endpoint XML legacy de Xubio,
 * que es el que usa la UI oficial y garantiza compatibilidad.
 *
 * USO DESDE CONSOLA DE XUBIO.COM:
 * ================================
 *
 * 1. Abrí https://xubio.com en el navegador
 * 2. Iniciá sesión normalmente
 * 3. Abrí la consola (F12)
 * 4. Copiá y pegá este archivo completo
 * 5. Ejecutá: crearFacturaConPDF({ ... })
 *
 * FLUJO COMPLETO DESCUBIERTO:
 * ===========================
 * 1. POST a /NXV/DF_submit con XML → Crea factura
 * 2. Parsear respuesta → Extraer TransaccionID
 * 3. Obtener config de reportes → DINAMICFORM_ImprimirReportesGetReportes(220, false)
 * 4. Generar URL del PDF → /NXV/general/includes/sr2.jsp con parámetros
 * 5. Abrir/descargar PDF
 *
 * @module sdk/xubioLegacyXml
 */

/**
 * Crea una factura usando el endpoint XML legacy de Xubio
 *
 * @param {Object} params - Parámetros de la factura
 * @param {number} params.clienteId - ID del cliente en Xubio
 * @param {string} params.clienteNombre - Nombre del cliente
 * @param {Array<{id: number, nombre: string, cantidad: number, precio: number}>} params.productos - Lista de productos
 * @param {number} [params.puntoVentaId=212819] - ID del punto de venta (default: corvusweb srl)
 * @param {string} [params.puntoVentaNumero='00004'] - Número del punto de venta
 * @param {number} [params.empresaId=234054] - ID de la empresa
 * @param {string} [params.empresaNombre='corvusweb srl'] - Nombre de la empresa
 * @param {string} [params.descripcion=''] - Descripción adicional
 * @param {number} [params.condicionPago=1] - 1=Cuenta Corriente, 2=Contado
 * @param {string} [params.fecha] - Fecha en formato YYYY-MM-DD (default: hoy)
 * @returns {Promise<Object>} Respuesta de Xubio
 *
 * @example
 * const resultado = await crearFacturaXubio({
 *   clienteId: 8157173,
 *   clienteNombre: '2MCAMPO',
 *   productos: [
 *     { id: 2851980, nombre: 'ADICIONAL POR SERVICIO DE CONECTIVIDAD', cantidad: 1, precio: 1 }
 *   ],
 *   descripcion: 'Factura de prueba'
 * });
 */
async function crearFacturaXubio(params) {
  // Valores por defecto
  const {
    clienteId,
    clienteNombre,
    productos = [],
    puntoVentaId = 212819,
    puntoVentaNumero = '00004',
    empresaId = 234054,
    empresaNombre = 'corvusweb srl',
    descripcion = '',
    condicionPago = 1,
    fecha = new Date().toISOString().split('T')[0]
  } = params;

  // Validaciones
  if (!clienteId) throw new Error('clienteId es obligatorio');
  if (!clienteNombre) throw new Error('clienteNombre es obligatorio');
  if (!productos.length) throw new Error('Debe haber al menos un producto');

  console.log('🚀 Creando factura con:', {
    cliente: `${clienteNombre} (${clienteId})`,
    productos: productos.length,
    puntoVenta: `${puntoVentaNumero} (${puntoVentaId})`
  });

  // Calcular totales
  let importeGravado = 0;
  let importeImpuestos = 0;

  const productosXml = productos.map((p) => {
    const importe = parseFloat((p.precio * p.cantidad).toFixed(2));
    const iva = parseFloat((importe * 0.21).toFixed(2)); // IVA 21%
    const total = parseFloat((importe + iva).toFixed(2));

    importeGravado += importe;
    importeImpuestos += iva;

    return `<row>
<pk value="0"/>
<TransaccionID type="cdata"/>
<TransaccionCVItemID type="cdata"/>
<ProductoID type="C" id="${p.id}" value="${escapeXml(p.nombre)}"/>
<CentroDeCostoID type="C" id="" value=""/>
<Descripcion value=""/>
<M_ProductosDisponiblesLista type="cdata"/>
<M_PrecioOriginal value="0"/>
<M_DescripcionOriginal type="cdata"/>
<M_CantidadMaximaDisponible value="0"/>
<Cantidad value="${p.cantidad}"/>
<Precio value="${p.precio}"/>
<PrecioConIvaIncluido value="0"/>
<PorcentajeDescuento value="0"/>
<Importe value="${importe.toFixed(2)}"/>
<ImporteConIvaIncluido value="0"/>
<ImporteImpuesto value="${iva.toFixed(4)}"/>
<ImporteExento value="0"/>
<ImporteTotal value="${total.toFixed(4)}"/>
<EditoImpuesto value="0"/>
<Tipo value="1"/>
<importeieps value=""/>
<tipodescuento value=""/>
<porcentajetasaimpositiva value="21.00"/>
<depositoid type="C" id="" value=""/>
<fecha type="date" value=""/>
<tipoalicuotacero value=""/>
</row>`;
  }).join('');

  const importeTotal = parseFloat((importeGravado + importeImpuestos).toFixed(2));

  // Construir XML completo
  const xmlPayload = `df><config><javaClass value="app.nexiviaAR.ui.transaccion.form.FacturaVentaNXVARForm"/><lightMode value="0"/><userDataValues><userDataValue name="auditID"><![CDATA[0]]></userDataValue><userDataValue name="isTransaction"><![CDATA[true]]></userDataValue><userDataValue name="v_PuntoVenta_Electronico"><![CDATA[true]]></userDataValue><userDataValue name="standardXml"><![CDATA[claseVO=FacturaVentaARNXVVO|docID=220|adhocXmlFile=facturaVentaARNXV]]></userDataValue><userDataValue name="TransaccionCategoriaID"><![CDATA[-8]]></userDataValue><userDataValue name="titulo"><![CDATA[Nuevo - Comprobante de Venta]]></userDataValue><userDataValue name="v_Talonario_Modo"><![CDATA[1]]></userDataValue><userDataValue name="v_Factura_Aplicada"><![CDATA[false]]></userDataValue><userDataValue name="auditClass"><![CDATA[app.nexivia.transacciones.compraVenta.ventas.facturaVenta.model.FacturaVentaNXVVO]]></userDataValue><userDataValue name="v_ListaPrecio_MonedaID"><![CDATA[-3]]></userDataValue><userDataValue name="v_Categoria_Fiscal"><![CDATA[1]]></userDataValue><userDataValue name="v_Transaccion_Conciliada"><![CDATA[false]]></userDataValue><userDataValue name="TransaccionSubTipoID"><![CDATA[220]]></userDataValue><userDataValue name="vo"><![CDATA[FacturaVentaARNXVVO]]></userDataValue><userDataValue name="action"><![CDATA[save]]></userDataValue></userDataValues></config><dataset><data><pk value="0"/><EmpresaID type="C" id="${empresaId}" value="${escapeXml(empresaNombre)}"/><ComprobanteElectronico value=""/><ComprobanteElectronicoFechaVto type="date" value=""/><M_EstadoFK type="C" id="0" value=""/><M_EstadoID value=""/><OrganizacionID type="C" id="${clienteId}" value="${escapeXml(clienteNombre)}"/><PuntoVentaID type="C" id="${puntoVentaId}" value="${puntoVentaNumero}"/><Coe value="____________"/><Tipo type="CB" id="1" value="Factura"/><NumeroDocumento value="_-_____-________"/><M_LetraComprobante value="A"/><TalonarioID type="C" id="11290129" value="selector no implementado"/><Factor value="___%"/><PrimerTktA value=""/><UltimoTktA value=""/><PrimerTktBC value=""/><UltimoTktBC value=""/><CantComprobantesEmitidos value=""/><CantComprobantesCancelados value=""/><Fecha type="date" value="${fecha} 00:00"/><CondicionDePago type="CB" id="${condicionPago}" value="${condicionPago === 1 ? 'Cuenta Corriente' : 'Contado'}"/><FechaVencimiento type="date" value="${fecha} 00:00"/><FacturacionTenantID type="C" id="0" value=""/><FechaEmision type="date" value="${fecha} 00:00"/><FormaDePagoID type="C" id="0" value=""/><HoraEmision value="__:__"/><FirmaDigital value=""/><FechaValidacion value=""/><SistemaTransmision type="CB" id="0" value="Agente de depósito colectivo"/><TipoComprobanteAsociado type="CB" id="0" value=""/><ComprobanteAsociadoID type="C" id="0" value=""/><ComprobanteAsociadoFechaDesde type="date" value="${fecha} 00:00"/><ComprobanteAsociadoFechaHasta type="date" value="${fecha} 00:00"/><ModoCalculoImpuesto type="CB" id="0" value="Impuesto Discriminado"/><MostrarOpciones value="1"/><importeCanceladoTimbrado value=""/><TipoComprobanteSAT type="CB" id="" value="null"/><usoCFDI type="CB" id="" value="null"/><OrganizacionSucursalItemID type="C" id="0" value=""/><DepositoID type="C" id="-2" value="Depósito Universal"/><MonedaID type="C" id="-2" value="Pesos Argentinos"/><Cotizacion value="1" type="DEC"/><NumeroInterno value="0" type="LNG"/><FechaCotizacion type="date" value="${fecha} 00:00"/><cancelaMismaMoneda value="0"/><ProvinciaID type="C" id="1" value="Buenos Aires"/><LocalidadID type="C" id="147" value="Saladillo"/><ListaPrecioID type="C" id="15386" value="AGDP (Dólares)"/><CotizacionLista value="1" type="DEC"/><PorcentajeDescuentoGenerico value="0" type="DEC"/><VendedorID type="C" id="0" value=""/><PorcentajeComision value="0" type="DEC"/><TienePeriodoServicio value="0"/><FechaFacturacionServicioDesde type="date" value=""/><FechaFacturacionServicioHasta type="date" value=""/><M_ListaIDTranPrecedentes type="cdata"><![CDATA[]]></M_ListaIDTranPrecedentes><M_HasCancelacionProductos value="0"/><M_ListaIDTranTotalProductos type="cdata"><![CDATA[]]></M_ListaIDTranTotalProductos><CircuitoContableID type="C" id="-2" value="default"/><CBUInformada type="CB" id="0" value="Sin Leyenda"/><ObservacionPredeterminadaID type="C" id="2575" value="CONDICION PAGO"/><anulacion value="0"/><FacturaNoExportacion value="0"/><M_ItemCtaCteID value="0" type="LNG"/><M_ValorAplicar type="cdata"><![CDATA[]]></M_ValorAplicar><Descripcion type="cdata"><![CDATA[${escapeXml(descripcion)}]]></Descripcion><TransaccionCVItems type="D" count="${productos.length}">${productosXml}</TransaccionCVItems><M_MostrarDeducciones value="0"/><TransaccionCVItemsDeducciones type="D" count="1"><row><pk value="0"/><TransaccionID type="cdata"/><TransaccionCVItemID type="cdata"/><ProductoID type="C" id="" value=""/><CentroDeCostoID type="C" id="" value=""/><Descripcion value=""/><Precio value="0"/><PrecioConIvaIncluido value="0"/><Importe value="0"/><ImporteConIvaIncluido value="0"/><ImporteImpuesto value="0"/><ImporteExento value="0"/><ImporteTotal value="0"/><EditoImpuesto value="0"/><Tipo value="4"/><importeieps value=""/><porcentajetasaimpositiva value=""/><fecha type="date" value=""/><tipoalicuotacero value=""/><cantidad value=""/></row></TransaccionCVItemsDeducciones><M_AgregarRetenciones value="0"/><TransaccionTesoreriaRetencionItemsLPG type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><CuentaID type="C" id="0" value=""/><M_RetencionTipo type="CB" id="-1" value=""/><RetencionID type="C" id="0" value=""/><Descripcion value=""/><ImporteMonTransaccion value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><FechaVto type="date" value="${fecha} 00:00"/><NroComprobanteRetencion value=""/><CotizacionMonTransaccion value="1" type="DEC"/><MonedaIDTransaccion value="-1" type="DEC"/></row></TransaccionTesoreriaRetencionItemsLPG><M_AgregarRemitos value="0"/><ComprobanteRemitosItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><ComprobanteRemitoID value=""/><RemitoID type="C" id="0" value=""/><Descripcion value=""/></row></ComprobanteRemitosItems><M_AgregarPercepciones value="0"/><TransaccionCVItemsPercepciones type="D" count="1"><row><pk value="0"/><TransaccionID type="cdata"/><TransaccionCVItemID type="cdata"/><ProductoID type="C" id="" value=""/><Descripcion value=""/><ProductoRetencionRelacionadoID type="C" id="" value=""/><ImporteISAR value="0"/><TasaRetencion type="CB" id="" value=""/><Importe value="0"/><Tipo value="2"/><importeconivaincluido value=""/><precioconivaincluido value=""/><porcentajetasaimpositiva value=""/><porcentajedescuento value=""/><fecha type="date" value=""/><centrodecostoid type="C" id="" value=""/><precio value=""/><importeimpuesto value=""/><importetotal value=""/><cantidad value=""/><tasaretenciondecimal value=""/><esimpuestonominal value="0"/></row></TransaccionCVItemsPercepciones><M_AgregarContado value="1"/><TransaccionTesoreriaIngresoItems type="D" count="1"><row index="1"><pk value="0"/><TransaccionID value=""/><AsientoItemID value=""/><M_CuentaTipo type="C" id="0" value=""/><CuentaID type="C" id="0" value=""/><MonedaIDTransaccion type="C" id="-2" value="Pesos Argentinos"/><CotizacionMonTransaccion value="1" type="DEC"/><ImporteMonTransaccion value="0" type="DEC"/><ImporteMonPrincipal value="0" type="DEC"/><M_Banco type="C" id="0" value=""/><Descripcion value=""/><M_NumeroCheque value=""/><FechaVto type="date" value=""/><DebeHaber value="1" type="LNG"/></row></TransaccionTesoreriaIngresoItems><TransaccionAsientoItems type="D" count="0"/><M_ImporteGravado value="${importeGravado}" type="DEC"/><M_ImporteImpuestos value="${importeImpuestos.toFixed(2)}" type="DEC"/><M_ImporteDeducciones value="0" type="DEC"/><M_ImporteTotal value="${importeTotal.toFixed(2)}" type="DEC"/><TotalIngresosMonPrincipal value="0" type="DEC"/></data></dataset></df>`;

  console.log('📤 Enviando XML a Xubio...');
  console.log('📊 Totales:', {
    gravado: importeGravado,
    iva: importeImpuestos.toFixed(2),
    total: importeTotal.toFixed(2)
  });

  try {
    const response = await fetch('https://xubio.com/NXV/DF_submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: xmlPayload,
      credentials: 'include' // Importante: incluye las cookies de sesión
    });

    console.log('📥 Respuesta recibida:', response.status, response.statusText);

    const responseText = await response.text();

    if (response.ok) {
      console.log('✅ Factura creada exitosamente!');
      console.log('📄 Respuesta completa:', responseText);
      return { success: true, response: responseText };
    } else {
      console.error('❌ Error creando factura');
      console.error('📄 Respuesta de error:', responseText);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error);
    throw error;
  }
}

/**
 * Escapa caracteres especiales para XML
 */
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extrae el TransaccionID de la respuesta XML
 * @param {string} responseXml - Respuesta XML del servidor
 * @returns {number|null} TransaccionID o null si no se encuentra
 */
function extraerTransaccionID(responseXml) {
  try {
    // Buscar patrón TransaccionID>NUMERO<
    const match = responseXml.match(/TransaccionID[^>]*>(\d+)</i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    // Alternativa: parsear como XML
    // eslint-disable-next-line no-undef
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseXml, 'text/xml');
    const transaccionElement = xmlDoc.querySelector('TransaccionID');
    if (transaccionElement && transaccionElement.textContent) {
      return parseInt(transaccionElement.textContent, 10);
    }

    return null;
  } catch (error) {
    console.error('❌ Error parseando TransaccionID:', error);
    return null;
  }
}

/**
 * Obtiene la URL del PDF para una factura
 * @param {number} transaccionId - ID de la transacción
 * @param {number} [subtipoId=220] - ID del subtipo de transacción (220 = Factura de Venta)
 * @returns {string} URL del PDF
 */
function obtenerPdfUrl(transaccionId, subtipoId = 220) {
  // Obtener configuración de reportes
  const reportes = DINAMICFORM_ImprimirReportesGetReportes(subtipoId, false);

  // Parsear configuración
  const lineas = reportes.split(',')[0];
  const xml = reportes.split('|')[0];
  const datasource = reportes.split('|')[1];

  console.log('📄 Configuración de reportes:', { xml, datasource, lineas });

  // Construir URL
  const params = `XMLFILE=${xml}&DATASOURCE=${datasource}&primaryKey=0&masiveReportsParams=${lineas}&listaIDs=${transaccionId}`;
  const pdfUrl = `https://xubio.com/NXV/general/includes/sr2.jsp?${params}`;

  return pdfUrl;
}

/**
 * Extrae el TransaccionID más reciente del HTML de la página
 * (útil cuando la respuesta XML no contiene el ID)
 * @returns {Object|null} { transaccionId, numeroComprobante } o null si no se encuentra
 */
function extraerTransaccionIDDelDOM() {
  try {
    // Buscar todas las facturas en el HTML usando el patrón de la función de preview
    const matches = [...document.body.innerHTML.matchAll(
      /WebReportGridLayoutOnPreviewTransaccion\((\d+),\s*220,\s*'Factura de Venta N° (A-\d+-\d+)'/g
    )];

    if (matches.length === 0) {
      console.warn('⚠️ No se encontraron facturas en el HTML');
      return null;
    }

    // La última debería ser la más reciente
    const ultima = matches[matches.length - 1];
    const transaccionId = parseInt(ultima[1], 10);
    const numeroComprobante = ultima[2];

    console.log(`✅ Factura encontrada en DOM: ${numeroComprobante} (ID: ${transaccionId})`);

    return { transaccionId, numeroComprobante };
  } catch (error) {
    console.error('❌ Error extrayendo TransaccionID del DOM:', error);
    return null;
  }
}

/**
 * Espera un tiempo determinado (helper para async/await)
 * @param {number} ms - Milisegundos a esperar
 */
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crea una factura y obtiene automáticamente el PDF
 * @param {Object} params - Parámetros de la factura (mismos que crearFacturaXubio)
 * @param {boolean} [params.abrirPdf=true] - Si true, abre el PDF en una nueva pestaña
 * @param {number} [params.esperarMs=3000] - Milisegundos a esperar antes de buscar el ID en el DOM
 * @returns {Promise<Object>} { success, response, transaccionId, pdfUrl, numeroComprobante }
 */
async function crearFacturaConPDF(params) {
  const abrirPdf = params.abrirPdf !== false; // Default true
  const esperarMs = params.esperarMs || 3000; // Default 3 segundos

  console.log('🚀 Creando factura con PDF automático...');

  // 1. Crear factura
  const resultado = await crearFacturaXubio(params);

  if (!resultado.success) {
    console.error('❌ Error creando factura');
    return resultado;
  }

  // 2. Intentar extraer TransaccionID de la respuesta XML
  let transaccionId = extraerTransaccionID(resultado.response);
  let numeroComprobante = null;

  // 3. Si no se pudo extraer del XML, buscar en el DOM
  if (!transaccionId) {
    console.log('⏳ Esperando que la UI se actualice...');
    await esperar(esperarMs);

    console.log('🔍 Buscando TransaccionID en el DOM...');
    const infoDOM = extraerTransaccionIDDelDOM();

    if (infoDOM) {
      transaccionId = infoDOM.transaccionId;
      numeroComprobante = infoDOM.numeroComprobante;
    } else {
      console.error('❌ No se pudo obtener el TransaccionID');
      return {
        ...resultado,
        transaccionId: null,
        pdfUrl: null,
        numeroComprobante: null,
        mensaje: '⚠️ Factura creada pero no se pudo obtener el ID para generar el PDF'
      };
    }
  }

  console.log('✅ TransaccionID obtenido:', transaccionId);

  // 4. Obtener URL del PDF
  const pdfUrl = obtenerPdfUrl(transaccionId);
  console.log('🔗 URL del PDF:', pdfUrl);

  // 5. Abrir PDF si se solicita
  if (abrirPdf) {
    console.log('📂 Abriendo PDF en nueva pestaña...');
    window.open(pdfUrl, '_blank');
  }

  return {
    success: true,
    response: resultado.response,
    transaccionId,
    pdfUrl,
    numeroComprobante,
    mensaje: `✅ Factura ${numeroComprobante || transaccionId} creada exitosamente`
  };
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  window.crearFacturaXubio = crearFacturaXubio;
  window.crearFacturaConPDF = crearFacturaConPDF;
  window.extraerTransaccionID = extraerTransaccionID;
  window.extraerTransaccionIDDelDOM = extraerTransaccionIDDelDOM;
  window.obtenerPdfUrl = obtenerPdfUrl;
  window.esperar = esperar;

  console.log('✅ Funciones disponibles en consola:');
  console.log('   - crearFacturaConPDF(params) ← Recomendada (flujo completo automático)');
  console.log('   - crearFacturaXubio(params) - Solo crear factura');
  console.log('   - obtenerPdfUrl(transaccionId) - Generar URL de PDF');
  console.log('   - extraerTransaccionIDDelDOM() - Obtener última factura del HTML');
}

// Exportar para uso en Node.js/módulos
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crearFacturaXubio,
    crearFacturaConPDF,
    extraerTransaccionID,
    extraerTransaccionIDDelDOM,
    obtenerPdfUrl,
    esperar
  };
}
/* eslint-enable no-undef */
