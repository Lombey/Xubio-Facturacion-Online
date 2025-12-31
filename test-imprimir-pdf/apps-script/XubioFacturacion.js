/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* global Logger, UrlFetchApp, Utilities, ContentService */

/**
 * Xubio Facturación - Apps Script
 *
 * Sistema de facturación automática usando endpoint XML Legacy de Xubio
 * Basado en template AGDP validado en producción
 *
 * USO:
 * 1. Copiar este código en un nuevo proyecto de Apps Script
 * 2. Configurar las cookies de sesión de Xubio (sección CONFIG)
 * 3. Ejecutar testCrearFactura() para validar
 * 4. Una vez validado, integrar con AppSheet
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================

/**
 * Cookies de sesión de Xubio
 * IMPORTANTE: Actualizar estas cookies obtenidas de tu navegador
 *
 * Para obtenerlas:
 * 1. Iniciá sesión en xubio.com
 * 2. Abrí DevTools (F12) → Console
 * 3. Ejecutá: copy(document.cookie)
 * 4. Pegá aquí el resultado
 */
const XUBIO_COOKIES = `XGLoginVismaConnect=1; userName=martin.lombardi@gmail.com; lastLoginEmpresaID=; lastLoginIdiomaID=SP; FafCookieFingerPrint=17599409415450.6416165902653839; NPS_EU-06b4f340_last_seen=1759940973745; poptin_user_id=0.3qoz6ii8pak; poptin_user_ip=2800:22c0:4040:161b:c5:3a75:8aa:69c2; poptin_user_country_code=false; poptin_d_a_x_v_415a737d6167b=2025-10-08; poptin_d_a_x_v_9a9bd2a60c933=2025-10-08; poptin_d_a_x_v_ad89f1da06942=2025-10-08; poptin_d_a_x_v_bb996f438286e=2025-10-08; poptin_d_a_x_v_e986ddda12429=2025-10-08; poptin_d_a_x_v_d7fac16faef68=2025-10-27; poptin_d_a_x_v_63c0e35cea090=2025-10-30; poptin_d_a_x_v_086a0b60aa629=2025-11-03; poptin_d_a_x_v_b0da82b693fd9=2025-11-03; poptin_d_a_x_v_6450b63932466=2025-11-07; poptin_d_a_x_v_69ee196d6c431=2025-11-13; poptin_d_a_x_v_6b96116ae70e6=2025-11-13; poptin_d_a_x_v_b181f96607246=2025-11-13; _gcl_au=1.1.1943318212.1764536929; _fbp=fb.1.1764687407278.882174049930945671; poptin_d_a_x_v_0951c2695dd78=2025-12-02; poptin_d_a_x_v_a1df96cf63d2c=2025-12-04; poptin_conversion_a982d2386d548=3bb85eb325169; poptin_session_account_1048e85cfc1c3=true; poptin_c_visitor=true; poptin_d_a_x_v_d327989656a8a=2025-12-12; poptin_d_a_x_v_eda2366918789=2025-12-12; 50548_PARAMWEBREPORT_FechaDesde=2025-9-1; 50548_PARAMWEBREPORT_FechaHasta=2025-12-12; 50516_p_FechaHasta=2025-12-12; 50516_p_FechaDesde=2025-1-1; 50537_p_FechaHasta=2025-12-12; 50537_p_FechaDesde=2025-12-11; paisURL=https%3A//xubio.com/ar/comprobantes-ia%3Fgad_source%3D1%26gad_campaignid%3D698196644%26gbraid%3D0AAAAADnI-5ooEb5ei0hiMGtaZcoh_3ohC%26gclid%3DCjwKCAiAl-_JBhBjEiwAn3rN7bSbpRgrUfA5k-8yx2cKR0_xUGONV870b39tleyOOMUFvMjWrwTkfxoCRDAQAvD_BwE; _gcl_gs=2.1.k1$i1765586150$u268320647; _gcl_aw=GCL.1765586153.CjwKCAiAl-_JBhBjEiwAn3rN7bSbpRgrUfA5k-8yx2cKR0_xUGONV870b39tleyOOMUFvMjWrwTkfxoCRDAQAvD_BwE; _gac_UA-51722577-1=1.1765586156.CjwKCAiAl-_JBhBjEiwAn3rN7bSbpRgrUfA5k-8yx2cKR0_xUGONV870b39tleyOOMUFvMjWrwTkfxoCRDAQAvD_BwE; _ga=GA1.1.488962001.1759940923; popup-b995195c262c4=true; popup-3075946c76061=true; poptin_old_user=true; 50613_p_FechaDesde=2025-12-1; 50613_p_FechaHasta=2025-12-30; NPS_EU-06b4f340_throttle=1767252306615; poptin_last_visit=2025-12-31; poptin_o_a_d_06297057469d4=9357f91587613; poptin_c_p_o_x_c_06297057469d4=06297057469d4; popup-06297057469d4=true; encuestaPerfil=true; OptanonAlertBoxClosed=2025-12-31T19:34:50.602Z; _ga_HS1E9VWYG3=GS2.1.s1767217285$o9$g0$t1767217287$j58$l0$h0; poptin_referrer=connect.visma.com/; poptin_referrer_protocol=secure; poptin_previous_url=connect.visma.com/; poptin_previous_url_protocol=secure; poptin_o_v_05063458f88fe=75a690952f991; poptin_o_v_1e814255b2865=9f6d159250959; poptin_o_v_6c792a2511c0f=61952f689159a; poptin_o_v_976572839dd17=5199956fb2a01; poptin_o_v_af1ec68ccf2e5=25f956191f495; poptin_o_v_b0b6c2a6315b2=155399f13269a; poptin_o_v_d67369772e3e7=1f15256d9ee99; poptin_session=true; _ga_CH8CEYSKCD=GS2.1.s1767217441$o4$g0$t1767217441$j60$l0$h0; SessionId=MARTIN.LOMBARDI@GMAIL.COM17672174514132008192788#TNT_142596; OptanonConsent=isGpcEnabled=0&datestamp=Wed+Dec+31+2025+18%3A44%3A08+GMT-0300+(Argentina+Standard+Time)&version=202508.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0002%3A0%2CC0004%3A0%2CC0001%3A1&AwaitingReconsent=false&geolocation=%3B; poptin_o_v_2f1e24aa29a46=f961299d59c59; poptin_o_v_569e884c41a82=d561492a59de9; poptin_o_v_a22666bb1944d=55226d9d29695; poptin_o_v_f1751e19a622a=c5d5439d26939; AWSALB=MtTVKESkE+nFDh618j9plLhPWePxdQCKYAA8ICfqKEGrn8j1WGYGiFcLsaiwEnGiRMRWC2DcybIC+VFKC8A3tD0ylUOfou8E1dOcvfHX4RZg/8l2hDnu2sZSzvuviS76LcN/wfDALrDdpvr/bp1hWr1IV6LTsVFn7yhrfrhO1QD9Pv22aqahjTJ5IRX942iUOVetzzK8WYvajHDJmblEYWkdxomNGnwyj2Db4W7Y+yaVwnoPHQXoIdf12U6zlCw=; AWSALBCORS=MtTVKESkE+nFDh618j9plLhPWePxdQCKYAA8ICfqKEGrn8j1WGYGiFcLsaiwEnGiRMRWC2DcybIC+VFKC8A3tD0ylUOfou8E1dOcvfHX4RZg/8l2hDnu2sZSzvuviS76LcN/wfDALrDdpvr/bp1hWr1IV6LTsVFn7yhrfrhO1QD9Pv22aqahjTJ5IRX942iUOVetzzK8WYvajHDJmblEYWkdxomNGnwyj2Db4W7Y+yaVwnoPHQXoIdf12U6zlCw=`;

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
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Crea una factura en Xubio usando el endpoint XML Legacy
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

    // Calcular totales
    const subtotal = PRODUCTO_AGDP.precio * cantidad;
    const importeIVA = subtotal * (PRODUCTO_AGDP.iva / 100);
    const total = subtotal + importeIVA;

    // Fecha actual
    const fecha = Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd') + ' 00:00';

    // Construir XML
    const xmlPayload = construirXMLFactura({
      cliente,
      fecha,
      cotizacionUSD,
      cantidad,
      subtotal,
      importeIVA,
      total
    });

    // Enviar a Xubio
    const response = enviarFacturaXubio(xmlPayload);

    // Parsear respuesta
    const resultado = parsearRespuestaXubio(response);

    Logger.log('✅ Factura creada exitosamente');
    Logger.log('TransaccionID: ' + resultado.transaccionId);
    Logger.log('Numero: ' + resultado.numeroDocumento);

    return {
      success: true,
      transaccionId: resultado.transaccionId,
      numeroDocumento: resultado.numeroDocumento,
      total: total,
      cotizacion: cotizacionUSD,
      rawResponse: response
    };

  } catch (error) {
    Logger.log('❌ Error al crear factura: ' + error.message);
    throw error;
  }
}

/**
 * Construye el XML para crear la factura
 */
function construirXMLFactura(params) {
  const { cliente, fecha, cotizacionUSD, cantidad, subtotal, importeIVA, total } = params;

  return `<df>
    <config>
      <javaClass value="app.nexiviaAR.ui.transaccion.form.FacturaVentaNXVARForm"/>
      <lightMode value="0"/>
      <userDataValues>
        <userDataValue name="auditID"><![CDATA[0]]></userDataValue>
        <userDataValue name="isTransaction"><![CDATA[true]]></userDataValue>
        <userDataValue name="v_PuntoVenta_Electronico"><![CDATA[true]]></userDataValue>
        <userDataValue name="standardXml"><![CDATA[claseVO=FacturaVentaARNXVVO|docID=220|adhocXmlFile=facturaVentaARNXV]]></userDataValue>
        <userDataValue name="TransaccionCategoriaID"><![CDATA[-8]]></userDataValue>
        <userDataValue name="titulo"><![CDATA[Nuevo - Comprobante de Venta]]></userDataValue>
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
        <M_LetraComprobante value="A"/>
        <TalonarioID type="C" id="${CONFIG_EMPRESA.talonarioId}" value="selector no implementado"/>
        <Tipo type="CB" id="1" value="Factura"/>
        <NumeroDocumento value="_-_____-________"/>
        <Fecha type="date" value="${fecha}"/>
        <CondicionDePago type="CB" id="7" value="Otra"/>
        <FechaVencimiento type="date" value="${fecha}"/>
        <FechaEmision type="date" value="${fecha}"/>
        <MonedaID type="C" id="-3" value="Dólares"/>
        <Cotizacion value="${cotizacionUSD}" type="DEC"/>
        <NumeroInterno value="0" type="LNG"/>
        <FechaCotizacion type="date" value="${fecha}"/>
        <ProvinciaID type="C" id="${cliente.provinciaId}" value="${cliente.provinciaNombre}"/>
        <LocalidadID type="C" id="${cliente.localidadId}" value="${cliente.localidadNombre}"/>
        <ListaPrecioID type="C" id="${CONFIG_EMPRESA.listaPrecioId}" value="AGDP (Dólares)"/>
        <CotizacionLista value="1" type="DEC"/>
        <DepositoID type="C" id="-2" value="Depósito Universal"/>
        <CircuitoContableID type="C" id="-2" value="default"/>
        <ObservacionPredeterminadaID type="C" id="${CONFIG_EMPRESA.observacionPredeterminadaId}" value="DATOS SUPERVIELLE"/>
        <Descripcion type="cdata"><![CDATA[${CONFIG_EMPRESA.descripcionBancaria}]]></Descripcion>
        <ModoCalculoImpuesto type="CB" id="0" value="Impuesto Discriminado"/>
        <PorcentajeDescuentoGenerico value="0" type="DEC"/>

        <TransaccionCVItems type="D" count="1">
          <row>
            <pk value="0"/>
            <TransaccionID type="cdata"/>
            <TransaccionCVItemID type="cdata"/>
            <ProductoID type="C" id="${PRODUCTO_AGDP.id}" value="${PRODUCTO_AGDP.nombre}"/>
            <CentroDeCostoID type="C" id="" value=""/>
            <Descripcion value="${PRODUCTO_AGDP.descripcion}"/>
            <Cantidad value="${cantidad}"/>
            <Precio value="${PRODUCTO_AGDP.precio}"/>
            <PrecioConIvaIncluido value="0"/>
            <PorcentajeDescuento value="0"/>
            <Importe value="${subtotal.toFixed(2)}"/>
            <ImporteConIvaIncluido value="0"/>
            <ImporteImpuesto value="${importeIVA.toFixed(4)}"/>
            <ImporteExento value="0"/>
            <ImporteTotal value="${total.toFixed(4)}"/>
            <EditoImpuesto value="0"/>
            <Tipo value="1"/>
            <porcentajetasaimpositiva value="${PRODUCTO_AGDP.iva}.00"/>
            <depositoid type="C" id="" value=""/>
            <fecha type="date" value=""/>
            <tipoalicuotacero value=""/>
          </row>
        </TransaccionCVItems>

        <M_MostrarDeducciones value="0"/>
        <TransaccionCVItemsDeducciones type="D" count="1">
          <row>
            <pk value="0"/>
            <ProductoID type="C" id="" value=""/>
            <Descripcion value=""/>
            <Precio value="0"/>
            <Importe value="0"/>
            <ImporteImpuesto value="0"/>
            <ImporteTotal value="0"/>
            <Tipo value="4"/>
          </row>
        </TransaccionCVItemsDeducciones>

        <M_AgregarRetenciones value="0"/>
        <M_AgregarRemitos value="0"/>
        <M_AgregarPercepciones value="0"/>
        <M_AgregarContado value="1"/>

        <TransaccionAsientoItems type="D" count="0"/>

        <M_ImporteGravado value="${subtotal}" type="DEC"/>
        <M_ImporteImpuestos value="${importeIVA.toFixed(2)}" type="DEC"/>
        <M_ImporteDeducciones value="0" type="DEC"/>
        <M_ImporteTotal value="${total.toFixed(2)}" type="DEC"/>
        <TotalIngresosMonPrincipal value="0" type="DEC"/>
      </data>
    </dataset>
  </df>`;
}

/**
 * Envía el XML a Xubio
 */
function enviarFacturaXubio(xmlPayload) {
  const url = 'https://xubio.com/NXV/DF_submit';

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
    payload: xmlPayload,
    headers: {
      'Cookie': XUBIO_COOKIES,
      'Accept': '*/*'
    },
    muteHttpExceptions: true
  };

  Logger.log('📤 Enviando factura a Xubio...');

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);

  if (responseCode !== 200) {
    throw new Error('Error HTTP ' + responseCode + ': ' + responseText);
  }

  return responseText;
}

/**
 * Parsea la respuesta XML de Xubio para extraer TransaccionID
 */
function parsearRespuestaXubio(responseXml) {
  // Xubio devuelve XML con TransaccionID embebido
  // Ejemplo: <transaccionid value="67750488"/>

  const transaccionIdMatch = responseXml.match(/transaccionid[^>]*value="(\d+)"/i);
  const numeroDocMatch = responseXml.match(/numerodocumento[^>]*value="([^"]+)"/i);

  if (!transaccionIdMatch) {
    Logger.log('⚠️ No se encontró TransaccionID en la respuesta');
    Logger.log('Response: ' + responseXml.substring(0, 500));
    throw new Error('No se pudo extraer TransaccionID de la respuesta');
  }

  return {
    transaccionId: transaccionIdMatch[1],
    numeroDocumento: numeroDocMatch ? numeroDocMatch[1] : 'Desconocido'
  };
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
 * Test con cliente hardcodeado
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
    version: '1.0.0'
  })).setMimeType(ContentService.MimeType.JSON);
}
