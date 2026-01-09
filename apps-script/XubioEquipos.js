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
    // Los índices son 1-based (columna A = 1)
    ID: 43,              // AQ - UNIQUEID
    CUIT: 23,            // W
    ESTADO_PAGO: 31,     // AE - estado de pago (NO FACTURADO / FACTURADO)
    SELECCION_PARA_FC: 46, // AT - checkbox para seleccionar equipos
    FACTURA_NUMERO: 30,  // AD - número de factura generada
    LINK_PDF: 49         // AW - link al PDF
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

  // LOCK: Evitar ejecuciones concurrentes para el mismo CUIT
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) {
    Logger.log('⏳ Lock ocupado, otra ejecución en progreso. Saliendo...');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tipo: 'facturacionEquipos',
      data: { mensaje: 'Procesamiento en curso por otra instancia', skipped: true }
    })).setMimeType(ContentService.MimeType.JSON);
  }
  Logger.log('🔒 Lock adquirido');

  try {
    // Aceptar: true, "true", "TRUE", "Y", "Yes", "YES", "1", 1
    const valorLicencias = String(requestData.incluirLicencias).toUpperCase();
    const incluirLicencias = requestData.incluirLicencias === true ||
                             valorLicencias === 'TRUE' ||
                             valorLicencias === 'Y' ||
                             valorLicencias === 'YES' ||
                             valorLicencias === '1';
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
    // 1. Contar equipos seleccionados del mismo CUIT
    const equiposData = contarEquiposSeleccionados(cuit);
    const cantidadEquipos = equiposData.cantidad;
    const filasAfectadas = equiposData.filas;

    Logger.log('   Equipos seleccionados: ' + cantidadEquipos);

    if (cantidadEquipos === 0) {
      throw new Error('No hay equipos seleccionados para facturar con CUIT: ' + cuit);
    }

    // 2. Construir items para la factura (el cliente se crea en Vercel si no existe)
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

    // 3. Generar ID único
    const externalId = 'EQUIPOS-' + cuit.replace(/[-]/g, '') + '-' + new Date().getTime();

    // 4. Llamar al endpoint de Vercel (envía CUIT, Vercel crea cliente si no existe)
    const payload = {
      cuit: cuit,               // Vercel busca o crea el cliente automáticamente
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
  } finally {
    lock.releaseLock();
    Logger.log('🔓 Lock liberado');
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

  // Usar índices fijos de TABLET_CONFIG (convertir a 0-based para array)
  const colCuit = TABLET_CONFIG.columnas.CUIT - 1;           // W = 23 → índice 22
  const colSeleccion = TABLET_CONFIG.columnas.SELECCION_PARA_FC - 1; // AT = 46 → índice 45

  // Normalizar CUIT de búsqueda
  const cuitNormalizado = normalizarCUIT(cuit);

  const filasSeleccionadas = [];

  for (let i = 1; i < data.length; i++) {
    const filaCuit = normalizarCUIT(String(data[i][colCuit]));
    const seleccionado = data[i][colSeleccion];

    // Verificar si está seleccionado (normalizar a mayúsculas para comparar)
    const valorSeleccion = String(seleccionado).toUpperCase();
    const estaSeleccionado = seleccionado === true ||
                             valorSeleccion === 'TRUE' ||
                             valorSeleccion === 'YES' ||
                             valorSeleccion === 'SI' ||
                             valorSeleccion === '1';

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
 * Escribe número de factura, PDF y ESTADO_PAGO en las filas procesadas
 *
 * @param {number[]} filas - Números de fila a actualizar
 * @param {string} numeroFactura - Número de factura generada
 * @param {string} pdfUrl - URL del PDF
 */
function actualizarEquiposEnSheet(filas, numeroFactura, pdfUrl) {
  Logger.log('📝 Actualizando ' + filas.length + ' filas en sheet...');

  const ss = SpreadsheetApp.openById(TABLET_CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(TABLET_CONFIG.sheetName);

  // Usar índices fijos de TABLET_CONFIG
  const colEstado = TABLET_CONFIG.columnas.ESTADO_PAGO;     // AE = 31
  const colFactura = TABLET_CONFIG.columnas.FACTURA_NUMERO; // AD = 30
  const colPdf = TABLET_CONFIG.columnas.LINK_PDF;           // AW = 49

  for (const fila of filas) {
    sheet.getRange(fila, colEstado).setValue('FACTURADO');
    sheet.getRange(fila, colFactura).setValue(numeroFactura);
    if (pdfUrl) {
      sheet.getRange(fila, colPdf).setValue(pdfUrl);
    }
  }

  Logger.log('✅ Filas actualizadas (estado, factura, PDF)');
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

  // Usar índice fijo de TABLET_CONFIG (ya es 1-based para getRange)
  const colSeleccion = TABLET_CONFIG.columnas.SELECCION_PARA_FC; // AT = 46

  for (const fila of filas) {
    sheet.getRange(fila, colSeleccion).setValue(false);
  }
  Logger.log('✅ Selección limpiada');
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

/**
 * TEST DEBUG: Simula el webhook de facturarEquipos completo
 * Ejecutar desde el editor de Apps Script para verificar todo el flujo
 */
function testFacturarEquiposDebug() {
  Logger.log('🧪 ========================================');
  Logger.log('🧪 TEST DEBUG: Facturar Equipos');
  Logger.log('🧪 ========================================');

  // Simular request de AppSheet
  const mockRequest = {
    accion: 'facturarEquipos',
    cuit: '20-31240266-2',  // Cambiar por CUIT de prueba
    idRef: 'TEST-DEBUG-' + new Date().getTime(),
    incluirLicencias: 'Y',
    precioEquipo: '2050',
    descuento: 0
  };

  Logger.log('📦 Request simulado:');
  Logger.log(JSON.stringify(mockRequest, null, 2));

  try {
    // 1. Verificar constantes
    Logger.log('');
    Logger.log('▶️ PASO 1: Verificar constantes...');
    Logger.log('   VERCEL_BASE: ' + (typeof VERCEL_BASE !== 'undefined' ? VERCEL_BASE : '❌ NO DEFINIDA'));
    Logger.log('   TABLET_CONFIG: ' + (typeof TABLET_CONFIG !== 'undefined' ? 'OK' : '❌ NO DEFINIDA'));
    Logger.log('   PRODUCTOS: ' + (typeof PRODUCTOS !== 'undefined' ? JSON.stringify(PRODUCTOS) : '❌ NO DEFINIDA'));

    // 2. Verificar función normalizarCUIT
    Logger.log('');
    Logger.log('▶️ PASO 2: Verificar normalizarCUIT...');
    const cuitNorm = normalizarCUIT(mockRequest.cuit);
    Logger.log('   normalizarCUIT("' + mockRequest.cuit + '"): ' + cuitNorm);

    // 3. Contar equipos
    Logger.log('');
    Logger.log('▶️ PASO 3: Contar equipos seleccionados...');
    const equiposData = contarEquiposSeleccionados(mockRequest.cuit);
    Logger.log('   Cantidad: ' + equiposData.cantidad);
    Logger.log('   Filas: ' + equiposData.filas.join(', '));

    if (equiposData.cantidad === 0) {
      Logger.log('⚠️ No hay equipos seleccionados. Selecciona equipos en la sheet antes de probar.');
      return;
    }

    // 4. Construir payload
    Logger.log('');
    Logger.log('▶️ PASO 4: Construir payload...');
    const items = [];
    items.push({
      productoId: PRODUCTOS.KIT_AGDP,
      cantidad: equiposData.cantidad,
      precio: parseFloat(mockRequest.precioEquipo) || 0,
      descripcion: 'KIT SISTEMA AGDP'
    });

    const payload = {
      cuit: mockRequest.cuit,  // ← VERIFICAR: debe ser "cuit", NO "clienteId"
      items: items,
      externalId: 'TEST-' + new Date().getTime(),
      descuento: mockRequest.descuento || 0,
      puntoVentaId: 212819,
      centroDeCostoId: 57329,
      listaDePrecioId: 15386
    };

    Logger.log('📤 Payload a enviar:');
    Logger.log(JSON.stringify(payload, null, 2));

    // 5. Llamar a Vercel
    Logger.log('');
    Logger.log('▶️ PASO 5: Llamar a Vercel...');
    const url = VERCEL_BASE + '/api/crear-factura-equipos';
    Logger.log('   URL: ' + url);

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const responseText = res.getContentText();

    Logger.log('   Response Code: ' + code);
    Logger.log('   Response (primeros 1000 chars):');
    Logger.log(responseText.substring(0, 1000));

    if (code === 200) {
      const result = JSON.parse(responseText);
      if (result.success) {
        Logger.log('');
        Logger.log('✅ ¡ÉXITO! Factura creada:');
        Logger.log('   Número: ' + result.data.numeroDocumento);
        Logger.log('   PDF: ' + result.data.pdfUrl);
      } else {
        Logger.log('❌ Error funcional: ' + result.error);
      }
    } else {
      Logger.log('❌ Error HTTP ' + code);
    }

  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}
