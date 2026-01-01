/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp, Utilities, ContentService, PropertiesService */

/**
 * Xubio Facturación - Apps Script
 *
 * Sistema de facturación automática usando REST API de Xubio con OAuth
 * Basado en template AGDP validado en producción
 *
 * USO:
 * 1. Copiar este código en un nuevo proyecto de Apps Script
 * 2. Configurar las credenciales OAuth de Xubio (sección CONFIG)
 * 3. Ejecutar testCrearFactura() para validar
 * 4. Una vez validado, integrar con AppSheet
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

/**
 * Credenciales OAuth de Xubio
 * IMPORTANTE: Obtener estas credenciales desde tu cuenta de Xubio
 */
const XUBIO_CLIENT_ID = '1685779410539838751521267077892091233473602730579752424794270565737755373827941053168577142596237900';
const XUBIO_CLIENT_SECRET = 'EEDdGsu+sN802iUKXWx8gSoY3eVPh8C/OjiSqfx9X/3XQj/F3yt-dCkSkq/x4beUGU4maI7l_64XYGuDxC8yFN0xB7XTbZAsMYJPQi-lOEEDdGsu+sN802iUKXWx8gSoY';

/**
 * Configuración de la empresa (FIJA - corvusweb srl)
 */
const CONFIG_EMPRESA = {
  empresaId: 234054,
  empresaNombre: 'corvusweb srl',
  puntoVentaId: 212819,
  talonarioId: 11290129,
  listaPrecioId: 15386,
  observacionPredeterminadaId: 2590,
  descripcionBancaria: `CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5`
};

/**
 * Producto principal AGDP (FIJO)
 */
const PRODUCTO_AGDP = {
  id: 2751338,
  nombre: 'CONECTIVIDAD ANUAL POR TOLVA',
  descripcion: 'Incluye Licencia para uso de un equipo por un año  - Incluye Licencia usuario y acceso a la plataforma web de AGDP - Incluye servicio soporte post venta REMOTO - Incluye mesa de ayuda',
  precio: 490, // USD
  iva: 21
};

// ==========================================
// AUTENTICACIÓN OAUTH
// ==========================================

/**
 * Obtiene un token OAuth de Xubio
 * Usa cache para evitar requests innecesarios (token válido por 1 hora)
 */
function obtenerTokenXubio() {
  const cache = PropertiesService.getScriptProperties();
  const cachedToken = cache.getProperty('XUBIO_ACCESS_TOKEN');
  const tokenExpiry = cache.getProperty('XUBIO_TOKEN_EXPIRY');

  // Si hay token en cache y no expiró, usarlo
  if (cachedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
    Logger.log('🔑 Usando token OAuth en cache');
    return cachedToken;
  }

  Logger.log('🔑 Obteniendo nuevo token OAuth de Xubio...');

  // Codificar credenciales en Base64
  const credentials = XUBIO_CLIENT_ID + ':' + XUBIO_CLIENT_SECRET;
  const basicAuth = Utilities.base64Encode(credentials);

  const url = 'https://xubio.com:443/API/1.1/TokenEndpoint';

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    payload: 'grant_type=client_credentials',
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    Logger.log('❌ Error al obtener token OAuth: ' + responseText);
    throw new Error('Error de autenticación OAuth: ' + responseCode);
  }

  const tokenData = JSON.parse(responseText);
  const accessToken = tokenData.access_token || tokenData.token;

  if (!accessToken) {
    throw new Error('No se recibió access_token en la respuesta OAuth');
  }

  // Cachear token (válido por 1 hora = 3600 segundos)
  const expiryTime = new Date().getTime() + (3600 * 1000);
  cache.setProperty('XUBIO_ACCESS_TOKEN', accessToken);
  cache.setProperty('XUBIO_TOKEN_EXPIRY', expiryTime.toString());

  Logger.log('✅ Token OAuth obtenido y cacheado');

  return accessToken;
}

/**
 * Invalida el token en cache (útil si hay error 401)
 */
function invalidarTokenXubio() {
  const cache = PropertiesService.getScriptProperties();
  cache.deleteProperty('XUBIO_ACCESS_TOKEN');
  cache.deleteProperty('XUBIO_TOKEN_EXPIRY');
  Logger.log('🗑️ Token OAuth invalidado del cache');
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Crea una factura en Xubio usando el endpoint REST API /comprobanteVentaBean
 *
 * @param {Object} cliente - Datos del cliente
 * @param {number} cliente.id - ID del cliente en Xubio
 * @param {string} cliente.nombre - Nombre del cliente
 * @param {number} cliente.provinciaId - ID de provincia del domicilio fiscal
 * @param {string} cliente.provinciaNombre - Nombre de la provincia
 * @param {number} cliente.localidadId - ID de localidad del domicilio fiscal
 * @param {string} cliente.localidadNombre - Nombre de la localidad
 * @param {number} cantidad - Cantidad de productos (default: 1)
 * @param {number} cotizacionUSD - Cotización USD a ARS (si no se pasa, se consulta BCRA)
 * @returns {Object} Resultado de la creación
 */
function crearFacturaAGDP(cliente, cantidad = 1, cotizacionUSD = null) {
  try {
    // Obtener cotización si no se pasó
    if (!cotizacionUSD) {
      cotizacionUSD = obtenerCotizacionBCRA();
    }

    // Obtener token OAuth
    const token = obtenerTokenXubio();

    // Construir payload JSON
    const payload = construirPayloadFactura({
      cliente,
      cantidad,
      cotizacionUSD
    });

    // Enviar a Xubio REST API
    const response = enviarFacturaXubioREST(payload, token);

    // Parsear respuesta
    const resultado = parsearRespuestaXubio(response);

    Logger.log('✅ Factura creada exitosamente');
    Logger.log('TransaccionID: ' + resultado.transaccionId);
    Logger.log('Número: ' + resultado.numeroDocumento);

    return {
      success: true,
      transaccionId: resultado.transaccionId,
      numeroDocumento: resultado.numeroDocumento,
      total: resultado.total,
      cotizacion: cotizacionUSD,
      rawResponse: response
    };

  } catch (error) {
    // Si es error 401, invalidar token y reintentar una vez
    if (error.message.includes('401')) {
      Logger.log('⚠️ Error 401 - Invalidando token y reintentando...');
      invalidarTokenXubio();

      // Reintentar con token fresco
      const token = obtenerTokenXubio();
      const payload = construirPayloadFactura({ cliente, cantidad, cotizacionUSD });
      const response = enviarFacturaXubioREST(payload, token);
      const resultado = parsearRespuestaXubio(response);

      return {
        success: true,
        transaccionId: resultado.transaccionId,
        numeroDocumento: resultado.numeroDocumento,
        total: resultado.total,
        cotizacion: cotizacionUSD,
        rawResponse: response
      };
    }

    Logger.log('❌ Error al crear factura: ' + error.message);
    throw error;
  }
}

/**
 * Construye el payload JSON para crear la factura
 * Basado en la documentación de /facturar y estructura validada en Vue app
 */
function construirPayloadFactura(params) {
  const { cliente, cantidad, cotizacionUSD } = params;

  // Fecha actual (solo fecha, sin hora - requerido por java.time.LocalDate)
  const ahora = new Date();
  const fechaISO = Utilities.formatDate(ahora, 'GMT-3', "yyyy-MM-dd");

  // Calcular totales
  const subtotal = PRODUCTO_AGDP.precio * cantidad;
  const iva = parseFloat((subtotal * (PRODUCTO_AGDP.iva / 100)).toFixed(2));
  const total = subtotal + iva;

  // Construir items de productos
  const transaccionProductoItems = [{
    cantidad: cantidad,
    precio: PRODUCTO_AGDP.precio,
    descripcion: PRODUCTO_AGDP.nombre,
    iva: iva,
    importe: subtotal,
    total: total,
    montoExento: 0,
    porcentajeDescuento: 0,
    centroDeCosto: { ID: 1 }
  }];

  // Payload completo según XML Legacy validado
  const payload = {
    circuitoContable: { ID: -2 }, // -2 = default (igual que XML Legacy)
    comprobante: 1,
    tipo: 1, // 1 = Factura
    tienePeriodoServicio: false,

    // Cliente
    cliente: {
      cliente_id: parseInt(cliente.id)
    },

    // Fechas
    fecha: fechaISO,
    fechaVto: fechaISO, // Mismo día que fecha (igual que XML Legacy)
    fechaCotizacion: fechaISO, // Fecha de cotización (igual que XML)

    // Condición de pago (usar 7=Otra igual que XML Legacy)
    condicionDePago: 7,

    // Punto de venta
    puntoVenta: {
      ID: CONFIG_EMPRESA.puntoVentaId,
      id: CONFIG_EMPRESA.puntoVentaId,
      nombre: CONFIG_EMPRESA.empresaNombre,
      codigo: ''
    },

    // Talonario (requerido para punto de venta editable-sugerido)
    talonario: {
      ID: CONFIG_EMPRESA.talonarioId
    },

    // Vendedor (0 = sin vendedor, igual que XML)
    vendedor: { ID: 0 },

    // Items de productos (REQUIRED)
    transaccionProductoItems: transaccionProductoItems,

    // Items de cobranzas (REQUIRED, vacío para facturas sin cobro inmediato)
    transaccionCobranzaItems: [],

    // Items de percepciones (REQUIRED, vacío si no hay percepciones)
    transaccionPercepcionItems: [],

    // Moneda y cotización
    moneda: {
      ID: -3, // -3 = Dólares
      id: -3,
      nombre: 'Dólares'
    },
    cotizacion: cotizacionUSD,
    cotizacionListaDePrecio: 1, // REQUIRED: Cotización para lista de precio (default 1)

    // Ubicación del cliente (importante para IIBB)
    provincia: {
      ID: cliente.provinciaId,
      id: cliente.provinciaId,
      nombre: cliente.provinciaNombre
    },
    localidad: {
      ID: cliente.localidadId,
      id: cliente.localidadId,
      nombre: cliente.localidadNombre
    },

    // Descripción bancaria (REQUIRED: campo correcto es "descripcion" no "observacion")
    descripcion: CONFIG_EMPRESA.descripcionBancaria,

    // Observación predeterminada (0 = ninguna, igual que XML)
    observacionPredeterminada: { ID: 0 },

    // Otros campos requeridos
    deposito: { ID: -2 }, // Depósito Universal
    listaDePrecio: { ID: CONFIG_EMPRESA.listaPrecioId },

    // Campos REQUIRED por ComprobanteVentaBean schema
    cantComprobantesCancelados: 0, // Cantidad de comprobantes anulados
    cantComprobantesEmitidos: 0,   // Cantidad de comprobantes emitidos (0 para nuevo)
    cbuinformada: 0,                // Si se informó CBU (0=No, 1=Sí)
    externalId: '',                 // ID externo opcional (vacío si no se usa)
    facturaNoExportacion: false,    // Si es factura de no exportación
    mailEstado: '',                 // Estado del envío de mail (vacío = no enviado)
    nombre: cliente.nombre || '',   // Nombre del cliente (usar el del cliente)
    numeroDocumento: '',            // Número de documento (vacío = será asignado por Xubio)
    porcentajeComision: 0,          // Porcentaje de comisión del vendedor

    // Totales
    subtotal: subtotal,
    total: total,
    descuento: 0,
    recargo: 0
  };

  return payload;
}

/**
 * Envía el payload JSON a Xubio API REST
 */
function enviarFacturaXubioREST(payload, token) {
  const url = 'https://xubio.com/API/1.1/comprobanteVentaBean';

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando factura a Xubio REST API...');
  Logger.log('🔍 DEBUG - Payload JSON:');
  Logger.log(JSON.stringify(payload, null, 2));

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);
  Logger.log('📥 Response: ' + responseText);

  if (responseCode !== 200 && responseCode !== 201) {
    throw new Error('Error HTTP ' + responseCode + ': ' + responseText);
  }

  return responseText;
}

/**
 * Envía el payload XML a Xubio API Legacy con OAuth
 * Usa endpoint /NXV/DF_submit con Authorization Bearer
 */
function enviarFacturaXubioXML(payloadXML, token) {
  const url = 'https://xubio.com/NXV/DF_submit';

  // El body debe ser URL-encoded como "body=<df>...</df>"
  const bodyEncoded = 'body=' + encodeURIComponent(payloadXML);

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': '*/*'
    },
    payload: bodyEncoded,
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando factura a Xubio XML Legacy API con OAuth...');
  Logger.log('🔍 DEBUG - Payload XML (primeros 500 chars):');
  Logger.log(payloadXML.substring(0, 500) + '...');

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);
  Logger.log('📥 Response: ' + responseText);

  if (responseCode !== 200 && responseCode !== 201) {
    throw new Error('Error HTTP ' + responseCode + ': ' + responseText);
  }

  return responseText;
}

/**
 * Construye el payload XML Legacy basado en template GOLD
 */
function construirPayloadXML(params) {
  const { cliente, cantidad, cotizacionUSD } = params;

  // Fecha actual
  const ahora = new Date();
  const fechaISO = Utilities.formatDate(ahora, 'GMT-3', "yyyy-MM-dd");
  const fechaDisplay = Utilities.formatDate(ahora, 'GMT-3', "yyyy-MM-dd HH:mm");

  // Calcular totales
  const subtotal = PRODUCTO_AGDP.precio * cantidad;
  const iva = parseFloat((subtotal * (PRODUCTO_AGDP.iva / 100)).toFixed(2));
  const total = subtotal + iva;

  // Totales en pesos (para asiento contable)
  const totalARS = total * cotizacionUSD;
  const ivaARS = iva * cotizacionUSD;
  const subtotalARS = subtotal * cotizacionUSD;

  // XML basado en template GOLD
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
          <Precio value="${subtotal / cantidad}.0000"/>
          <PrecioConIvaIncluido value="0.0000"/>
          <PorcentajeDescuento value="0.000000"/>
          <Importe value="${subtotal}.0000"/>
          <ImporteConIvaIncluido value="0.0000"/>
          <ImporteImpuesto value="${iva}.0000"/>
          <ImporteExento value="0.0000"/>
          <ImporteTotal value="${total}.0000"/>
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

/**
 * Parsea la respuesta JSON de Xubio para extraer datos de la factura creada
 */
function parsearRespuestaXubio(responseJson) {
  try {
    const data = JSON.parse(responseJson);

    // La API puede retornar diferentes estructuras según el endpoint
    // Intentar extraer ID de transacción de diferentes posibles campos
    const transaccionId = data.transaccionId || data.id || data.ID || data.TransaccionID;
    const numeroDocumento = data.numeroDocumento || data.numero || data.NumeroDocumento || 'Desconocido';
    const total = data.total || data.Total || data.ImporteTotal || 0;

    if (!transaccionId) {
      Logger.log('⚠️ No se encontró TransaccionID en la respuesta');
      Logger.log('Response data: ' + JSON.stringify(data, null, 2));
      throw new Error('No se pudo extraer TransaccionID de la respuesta');
    }

    return {
      transaccionId: transaccionId.toString(),
      numeroDocumento: numeroDocumento,
      total: total
    };

  } catch (error) {
    Logger.log('❌ Error al parsear respuesta JSON: ' + error.message);
    throw new Error('Error al procesar respuesta de Xubio: ' + error.message);
  }
}

/**
 * Obtiene la cotización oficial USD desde API del BCRA
 */
function obtenerCotizacionBCRA() {
  try {
    Logger.log('💱 Consultando cotización BCRA...');

    // API pública del BCRA (estadisticasbcra.com)
    const url = 'https://api.estadisticasbcra.com/usd_of';

    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'BEARER ' // Podés usar sin token para consultas básicas
      },
      muteHttpExceptions: true
    });

    const data = JSON.parse(response.getContentText());

    // Devuelve el último valor disponible
    const ultimaCotizacion = data[data.length - 1].v;

    Logger.log('💱 Cotización USD: $' + ultimaCotizacion);

    return parseFloat(ultimaCotizacion);

  } catch (error) {
    Logger.log('⚠️ Error al obtener cotización BCRA: ' + error.message);
    Logger.log('⚠️ Usando cotización por defecto: 1455');
    return 1455; // Fallback
  }
}

// ==========================================
// FUNCIÓN DE TEST
// ==========================================

/**
 * Test con XML Legacy + OAuth
 * Ejecutar esta función para validar endpoint /NXV/DF_submit con OAuth
 */
function testCrearFacturaXML() {
  Logger.log('🧪 Iniciando test de creación de factura con XML Legacy + OAuth...');

  // Cliente de ejemplo (2MCAMPO - sabemos que existe)
  const cliente = {
    id: 8157173,
    nombre: '2MCAMPO',
    provinciaId: 1,
    provinciaNombre: 'Buenos Aires',
    localidadId: 147,
    localidadNombre: 'Saladillo'
  };

  try {
    // Obtener cotización USD
    const cotizacionUSD = obtenerCotizacionBCRA();
    Logger.log('💱 Cotización USD: $' + cotizacionUSD);

    // Obtener token OAuth
    const token = obtenerTokenXubio();

    // Construir payload XML
    const payloadXML = construirPayloadXML({
      cliente,
      cantidad: 1,
      cotizacionUSD
    });

    // Enviar a Xubio con XML Legacy endpoint
    const response = enviarFacturaXubioXML(payloadXML, token);

    Logger.log('');
    Logger.log('✅ ¡TEST EXITOSO!');
    Logger.log('================');
    Logger.log('Response: ' + response);

    return { success: true, response: response };

  } catch (error) {
    Logger.log('');
    Logger.log('❌ TEST FALLIDO');
    Logger.log('================');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    throw error;
  }
}

/**
 * Test con cliente hardcodeado (JSON REST - versión anterior)
 * Ejecutar esta función para validar que todo funciona
 */
function testCrearFactura() {
  Logger.log('🧪 Iniciando test de creación de factura...');

  // Cliente de ejemplo (2MCAMPO - sabemos que existe)
  const cliente = {
    id: 8157173,
    nombre: '2MCAMPO',
    provinciaId: 1,
    provinciaNombre: 'Buenos Aires',
    localidadId: 147,
    localidadNombre: 'Saladillo'
  };

  try {
    // Crear factura de prueba
    const resultado = crearFacturaAGDP(cliente, 1); // 1 tolva

    Logger.log('');
    Logger.log('✅ ¡TEST EXITOSO!');
    Logger.log('================');
    Logger.log('TransaccionID: ' + resultado.transaccionId);
    Logger.log('Número: ' + resultado.numeroDocumento);
    Logger.log('Total: USD $' + resultado.total);
    Logger.log('Cotización: $' + resultado.cotizacion);

    return resultado;

  } catch (error) {
    Logger.log('');
    Logger.log('❌ TEST FALLIDO');
    Logger.log('================');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    throw error;
  }
}

// ==========================================
// WEB APP (Para integrar con AppSheet)
// ==========================================

/**
 * Endpoint POST para AppSheet
 *
 * AppSheet llamará a esta URL con:
 * {
 *   "clienteId": 8157173,
 *   "clienteNombre": "2MCAMPO",
 *   "provinciaId": 1,
 *   "provinciaNombre": "Buenos Aires",
 *   "localidadId": 147,
 *   "localidadNombre": "Saladillo",
 *   "cantidad": 1
 * }
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);

    const cliente = {
      id: params.clienteId,
      nombre: params.clienteNombre,
      provinciaId: params.provinciaId,
      provinciaNombre: params.provinciaNombre,
      localidadId: params.localidadId,
      localidadNombre: params.localidadNombre
    };

    const resultado = crearFacturaAGDP(cliente, params.cantidad || 1);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: resultado
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint GET para verificar que el Web App está funcionando
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Xubio Facturación API funcionando',
    version: '2.1.0-swagger',
    endpoint: '/comprobanteVentaBean'
  })).setMimeType(ContentService.MimeType.JSON);
}
