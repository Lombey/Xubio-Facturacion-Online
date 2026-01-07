/**
 * router.gs
 * Router principal para webhooks de AppSheet
 *
 * Detecta automáticamente el tipo de operación por los campos del request:
 * - Si viene "cuit" → Facturación
 * - Si NO viene "cuit" → Cobranza
 */

function doPost(e) {
  Logger.log('📥 Webhook recibido');

  try {
    const requestData = JSON.parse(e.postData.contents);
    Logger.log('📦 Request data: ' + JSON.stringify(requestData));

    // Detectar tipo de operación por campos presentes
    if (requestData.cuit) {
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

  if (!cuit) {
    throw new Error('Falta parámetro: cuit');
  }
  if (!idRef) {
    throw new Error('Falta parámetro: idRef');
  }

  Logger.log('   CUIT: ' + cuit);
  Logger.log('   Cantidad: ' + cantidad);
  Logger.log('   ID REF: ' + idRef);

  // Generar ID único (idRef + timestamp)
  const externalIdUnique = idRef + '-' + new Date().getTime();

  // Crear factura (función de xubiodiscovery.gs)
  const resultado = crearFacturaCompleta(cuit, cantidad, externalIdUnique);

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
 */
function procesarCobranza(requestData) {
  Logger.log('💰 Procesando COBRANZA...');

  const idRef = requestData.idRef;
  let numeroDocumento = requestData.numeroDocumento;

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

  // Crear cobranza (función de xubiocobranzas.gs)
  const resultado = crearCobranzaPorFactura(numeroDocumento);

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
