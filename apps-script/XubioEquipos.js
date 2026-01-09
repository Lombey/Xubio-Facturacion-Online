/**
 * XubioEquipos.js
 * Facturación de equipos (Kits AGDP) - Múltiples equipos en 1 factura
 *
 * Flujo:
 * 1. Usuario ejecuta acción "FACTURAR KITS AGDP" en AppSheet
 * 2. Bot detecta ESTADO_PAGO = "FACTURADO" y llama webhook
 * 3. Este script cuenta equipos con SELECCION_PARA_FC = TRUE del mismo CUIT
 * 4. Llama a Vercel para crear 1 factura con N items
 * 5. Limpia SELECCION_PARA_FC = FALSE en filas procesadas
 */

// Configuración de la sheet TABLET
const TABLET_CONFIG = {
  spreadsheetId: '1URTOFW_OIM1JG0HKarhjigd-JgQSgFPCItbvDRa3p-o',
  sheetName: 'TABLET',
  columnas: {
    // Ajustar estos índices según la estructura real de la sheet
    // Los índices son 1-based (columna A = 1)
    ID: 43,              // AQ - UNIQUEID
    CUIT: 23,            // W
    ESTADO_PAGO: null,   // TODO: definir columna
    PRESUPUESTO_USD: null, // TODO: definir columna
    SELECCION_PARA_FC: null, // TODO: definir columna
    INCLUIR_LICENCIAS: null, // TODO: definir columna
    FACTURA: null,       // TODO: columna para guardar número de factura
    LINK_PDF: null       // TODO: columna para guardar PDF
  }
};

// IDs de productos en Xubio
const PRODUCTOS = {
  KIT_AGDP: 2751285,     // KIT SISTEMA AGDP (precio lista: 2050 USD)
  LICENCIA: 2751338      // CONECTIVIDAD ANUAL POR TOLVA (precio lista: 490 USD)
};

// VERCEL_BASE ya está declarada en XubioDiscovery.js

/**
 * PROCESAR FACTURACION DE EQUIPOS
 * Llamado desde router.gs cuando accion = "facturarEquipos"
 *
 * @param {Object} requestData - Datos del webhook
 * @returns {ContentService.TextOutput} - Respuesta JSON
 */
function procesarFacturacionEquipos(requestData) {
  Logger.log('📦 Procesando FACTURACION DE EQUIPOS...');

  const cuit = requestData.cuit;
  const idRef = requestData.idRef;
  const incluirLicencias = requestData.incluirLicencias === true || requestData.incluirLicencias === 'true';
  const precioEquipo = parseFloat(requestData.precioEquipo) || 0;
  const descuento = parseFloat(requestData.descuento) || 0; // Porcentaje de descuento

  if (!cuit) {
    throw new Error('Falta parámetro: cuit');
  }
  if (!idRef) {
    throw new Error('Falta parámetro: idRef');
  }

  Logger.log('   CUIT: ' + cuit);
  Logger.log('   ID REF: ' + idRef);
  Logger.log('   Incluir licencias: ' + incluirLicencias);
  Logger.log('   Precio equipo: ' + precioEquipo);
  if (descuento > 0) {
    Logger.log('   Descuento: ' + descuento + '%');
  }

  try {
    // 1. Contar equipos seleccionados del mismo CUIT
    const equiposData = contarEquiposSeleccionados(cuit);
    const cantidadEquipos = equiposData.cantidad;
    const filasAfectadas = equiposData.filas;

    Logger.log('   Equipos seleccionados: ' + cantidadEquipos);

    if (cantidadEquipos === 0) {
      throw new Error('No hay equipos seleccionados para facturar con CUIT: ' + cuit);
    }

    // 2. Buscar cliente por CUIT (reutilizamos función de XubioDiscovery.js)
    const cliente = obtenerClienteExistente(cuit);

    // 3. Construir items para la factura
    const items = [];

    // Item 1: Kits AGDP
    items.push({
      productoId: PRODUCTOS.KIT_AGDP,
      cantidad: cantidadEquipos,
      precio: precioEquipo,
      descripcion: 'KIT SISTEMA AGDP'
    });

    // Item 2: Licencias (opcional)
    if (incluirLicencias) {
      items.push({
        productoId: PRODUCTOS.LICENCIA,
        cantidad: cantidadEquipos,
        precio: 490, // Precio fijo licencia
        descripcion: 'CONECTIVIDAD ANUAL POR TOLVA'
      });
    }

    // 4. Generar ID único
    const externalId = 'EQUIPOS-' + cuit.replace(/[-]/g, '') + '-' + new Date().getTime();

    // 5. Llamar al endpoint de Vercel
    const payload = {
      clienteId: cliente.cliente_id,
      items: items,
      externalId: externalId,
      descuento: descuento,      // Porcentaje de descuento (0 = sin descuento)
      puntoVentaId: 212819,      // corvusweb srl
      centroDeCostoId: 57329,    // kit sistema agdp
      listaDePrecioId: 15386     // AGDP
    };

    Logger.log('📤 Enviando a Vercel...');
    Logger.log('   Payload: ' + JSON.stringify(payload));

    const url = VERCEL_BASE + '/api/crear-factura-equipos';
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const responseText = res.getContentText();

    if (code !== 200) {
      Logger.log('❌ Error HTTP ' + code);
      Logger.log('📦 Response: ' + responseText.substring(0, 500));
      throw new Error('Error creando factura equipos: HTTP ' + code);
    }

    const result = JSON.parse(responseText);

    if (!result.success) {
      Logger.log('❌ Error funcional: ' + (result.error || 'Sin mensaje'));
      throw new Error(result.error || 'Error desconocido al crear factura');
    }

    Logger.log('✅ Factura creada: ' + result.data.numeroDocumento);

    // 6. Actualizar Google Sheets con resultado
    actualizarEquiposEnSheet(filasAfectadas, result.data.numeroDocumento, result.data.pdfUrl);

    // 7. Limpiar selección en filas procesadas
    limpiarSeleccionEquipos(filasAfectadas);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tipo: 'facturacionEquipos',
      data: {
        cantidadEquipos: cantidadEquipos,
        incluirLicencias: incluirLicencias,
        factura: result.data.numeroDocumento,
        pdfUrl: result.data.pdfUrl
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    throw error;
  }
}

/**
 * CONTAR EQUIPOS SELECCIONADOS
 * Busca filas con SELECCION_PARA_FC = TRUE y mismo CUIT
 *
 * @param {string} cuit - CUIT del cliente
 * @returns {Object} { cantidad: number, filas: number[] }
 */
function contarEquiposSeleccionados(cuit) {
  Logger.log('🔍 Contando equipos seleccionados para CUIT: ' + cuit);

  const ss = SpreadsheetApp.openById(TABLET_CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(TABLET_CONFIG.sheetName);

  if (!sheet) {
    throw new Error('No se encontró la hoja: ' + TABLET_CONFIG.sheetName);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Encontrar índices de columnas por nombre
  const colCuit = findColumnIndex(headers, 'CUIT');
  const colSeleccion = findColumnIndex(headers, 'SELECCION_PARA_FC');

  if (colCuit === -1) throw new Error('Columna CUIT no encontrada');
  if (colSeleccion === -1) throw new Error('Columna SELECCION_PARA_FC no encontrada');

  // Normalizar CUIT de búsqueda
  const cuitNormalizado = normalizarCUIT(cuit);

  const filasSeleccionadas = [];

  for (let i = 1; i < data.length; i++) {
    const filaCuit = normalizarCUIT(String(data[i][colCuit]));
    const seleccionado = data[i][colSeleccion];

    // Verificar si está seleccionado (TRUE, true, "TRUE", "true", 1, "1", "SI", "YES")
    const estaSeleccionado = seleccionado === true ||
                             seleccionado === 'TRUE' ||
                             seleccionado === 'true' ||
                             seleccionado === 1 ||
                             seleccionado === '1' ||
                             seleccionado === 'SI' ||
                             seleccionado === 'YES';

    if (filaCuit === cuitNormalizado && estaSeleccionado) {
      filasSeleccionadas.push(i + 1); // +1 porque es 1-indexed en Sheets
    }
  }

  Logger.log('   Filas encontradas: ' + filasSeleccionadas.join(', '));

  return {
    cantidad: filasSeleccionadas.length,
    filas: filasSeleccionadas
  };
}

/**
 * ACTUALIZAR EQUIPOS EN SHEET
 * Escribe número de factura y PDF en las filas procesadas
 *
 * @param {number[]} filas - Números de fila a actualizar
 * @param {string} numeroFactura - Número de factura generada
 * @param {string} pdfUrl - URL del PDF
 */
function actualizarEquiposEnSheet(filas, numeroFactura, pdfUrl) {
  Logger.log('📝 Actualizando ' + filas.length + ' filas en sheet...');

  const ss = SpreadsheetApp.openById(TABLET_CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(TABLET_CONFIG.sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Encontrar columnas de factura y PDF
  // TODO: Ajustar nombres de columnas según estructura real
  const colFactura = findColumnIndex(headers, 'FACTURA') + 1; // +1 para 1-indexed
  const colPdf = findColumnIndex(headers, 'LINK_PDF_FACTURA') + 1;

  for (const fila of filas) {
    if (colFactura > 0) {
      sheet.getRange(fila, colFactura).setValue(numeroFactura);
    }
    if (colPdf > 0 && pdfUrl) {
      sheet.getRange(fila, colPdf).setValue(pdfUrl);
    }
  }

  Logger.log('✅ Filas actualizadas');
}

/**
 * LIMPIAR SELECCION DE EQUIPOS
 * Pone SELECCION_PARA_FC = FALSE en las filas procesadas
 *
 * @param {number[]} filas - Números de fila a limpiar
 */
function limpiarSeleccionEquipos(filas) {
  Logger.log('🧹 Limpiando selección en ' + filas.length + ' filas...');

  const ss = SpreadsheetApp.openById(TABLET_CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(TABLET_CONFIG.sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colSeleccion = findColumnIndex(headers, 'SELECCION_PARA_FC') + 1;

  if (colSeleccion > 0) {
    for (const fila of filas) {
      sheet.getRange(fila, colSeleccion).setValue(false);
    }
    Logger.log('✅ Selección limpiada');
  } else {
    Logger.log('⚠️ Columna SELECCION_PARA_FC no encontrada');
  }
}

/**
 * Busca el índice de una columna por nombre en los headers
 * @param {Array} headers - Array de nombres de columnas
 * @param {string} nombreColumna - Nombre a buscar
 * @returns {number} Índice (0-based) o -1 si no se encuentra
 */
function findColumnIndex(headers, nombreColumna) {
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).toUpperCase().includes(nombreColumna.toUpperCase())) {
      return i;
    }
  }
  return -1;
}

/**
 * TEST: Contar equipos seleccionados
 */
function testContarEquipos() {
  Logger.log('🧪 TEST: Contar equipos seleccionados');

  // Usar un CUIT de prueba
  const cuit = '33-71584119-9'; // Cambiar por CUIT real

  try {
    const resultado = contarEquiposSeleccionados(cuit);
    Logger.log('✅ Resultado:');
    Logger.log('   Cantidad: ' + resultado.cantidad);
    Logger.log('   Filas: ' + resultado.filas.join(', '));
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}
