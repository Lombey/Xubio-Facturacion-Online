/**
 * router.gs
 * Router principal para webhooks de AppSheet
 *
 * Detecta automáticamente el tipo de operación por los campos del request:
 * - Si viene "accion": "consultaCuit" → Consulta razón social
 * - Si viene "cuit" (sin accion) → Facturación
 * - Si NO viene "cuit" → Cobranza
 */

function doPost(e) {
  Logger.log('📥 Webhook recibido');

  try {
    const requestData = JSON.parse(e.postData.contents);
    Logger.log('📦 Request data: ' + JSON.stringify(requestData));

    // Detectar tipo de operación por campos presentes
    if (requestData.accion === 'consultaCuit') {
      Logger.log('🔀 Ruteo: CONSULTA CUIT (accion=consultaCuit)');
      return procesarConsultaCuit(requestData);
    } else if (requestData.accion === 'facturarEquipos') {
      Logger.log('🔀 Ruteo: FACTURACION EQUIPOS (accion=facturarEquipos)');
      return procesarFacturacionEquipos(requestData);
    } else if (requestData.cuit) {
      Logger.log('🔀 Ruteo: FACTURACIÓN (detectado campo cuit)');
      return procesarFacturacion(requestData);
    } else {
      Logger.log('🔀 Ruteo: COBRANZA (sin campo cuit)');
      return procesarCobranza(requestData);
    }

  } catch (error) {
    Logger.log('❌ Error en router: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * PROCESAR FACTURACIÓN
 * Llamado cuando el request contiene campo "cuit"
 */
function procesarFacturacion(requestData) {
  Logger.log('📄 Procesando FACTURACIÓN...');

  const cuit = requestData.cuit;
  const cantidad = requestData.cantidad || 1;
  const idRef = requestData.idRef;
  const descuento = requestData.descuento || 0; // Porcentaje de descuento

  if (!cuit) {
    throw new Error('Falta parámetro: cuit');
  }
  if (!idRef) {
    throw new Error('Falta parámetro: idRef');
  }

  Logger.log('   CUIT: ' + cuit);
  Logger.log('   Cantidad: ' + cantidad);
  Logger.log('   ID REF: ' + idRef);
  if (descuento > 0) {
    Logger.log('   Descuento: ' + descuento + '%');
  }

  // Generar ID único (idRef + timestamp)
  const externalIdUnique = idRef + '-' + new Date().getTime();

  // Crear factura (función de xubiodiscovery.gs)
  const resultado = crearFacturaCompleta(cuit, cantidad, externalIdUnique, descuento);

  // Actualizar Google Sheets
  actualizarFacturaEnSheet(idRef, resultado.numeroDocumento, resultado.pdfUrl);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    tipo: 'facturacion',
    data: resultado
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * PROCESAR COBRANZA
 * Llamado cuando el request NO contiene campo "cuit"
 * Soporta cobro por BANCO (default) o CHEQUE (si viene chequeNumero)
 */
function procesarCobranza(requestData) {
  Logger.log('💰 Procesando COBRANZA...');

  const idRef = requestData.idRef;
  let numeroDocumento = requestData.numeroDocumento;
  const chequeNumero = requestData.chequeNumero; // String opcional (ej: "a1/a2/a3")

  if (!idRef) {
    throw new Error('Falta parámetro: idRef');
  }

  Logger.log('   ID REF: ' + idRef);

  // Si no viene numeroDocumento, leerlo de la sheet (columna 13)
  if (!numeroDocumento) {
    numeroDocumento = obtenerFacturaDeSheet(idRef);
    Logger.log('   Factura (de sheet): ' + numeroDocumento);
  } else {
    Logger.log('   Factura (de request): ' + numeroDocumento);
  }

  if (!numeroDocumento) {
    throw new Error('No se encontró número de factura para ID REF: ' + idRef);
  }

  // Log tipo de cobro
  if (chequeNumero) {
    Logger.log('   Tipo cobro: CHEQUE');
    Logger.log('   Número(s): ' + chequeNumero);
  } else {
    Logger.log('   Tipo cobro: BANCO');
  }

  // Crear cobranza (función de xubiocobranzas.gs)
  const resultado = crearCobranzaPorFactura(numeroDocumento, chequeNumero);

  // Actualizar Google Sheets con PDF de cobranza
  if (resultado.pdfUrl) {
    actualizarCobranzaEnSheet(idRef, resultado.pdfUrl);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    tipo: 'cobranza',
    data: resultado
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * PROCESAR CONSULTA CUIT
 * Llamado cuando el request contiene accion="consultaCuit"
 * Consulta razón social y actualiza columna AI
 */
function procesarConsultaCuit(requestData) {
  Logger.log('🔍 Procesando CONSULTA CUIT...');

  const cuit = requestData.cuit;
  const idRef = requestData.idRef;

  if (!cuit) {
    throw new Error('Falta parámetro: cuit');
  }
  if (!idRef) {
    throw new Error('Falta parámetro: idRef');
  }

  Logger.log('   CUIT: ' + cuit);
  Logger.log('   ID REF: ' + idRef);

  // Consultar razón social (función de AutocompletarRazonSocial.gs)
  const razonSocial = consultarCUIT(normalizarCUIT(cuit));

  if (!razonSocial) {
    throw new Error('No se pudo obtener razón social para CUIT: ' + cuit);
  }

  // Actualizar Google Sheets
  actualizarRazonSocialEnSheet(idRef, razonSocial);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    tipo: 'consultaCuit',
    data: {
      cuit: cuit,
      razonSocial: razonSocial
    }
  })).setMimeType(ContentService.MimeType.JSON);
}
