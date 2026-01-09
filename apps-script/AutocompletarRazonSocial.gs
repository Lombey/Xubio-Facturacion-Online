/**
 * AutocompletarRazonSocial.gs
 *
 * Detecta cambios en columna CUIT (W) y autocompleta RAZON SOCIAL (AI)
 * usando endpoint propio en Vercel (scraping de cuitonline.com)
 *
 * Columnas:
 * - W (23): CUIT (input)
 * - AI (35): RAZON SOCIAL (output)
 */

// Configuración de columnas
// NOTA: VERCEL_BASE está definida en XubioDiscovery.js
var COLUMNA_CUIT = 23;        // Columna W
var COLUMNA_RAZON_SOCIAL = 35; // Columna AI
var FILA_HEADER = 1;

/**
 * Trigger automático cuando se edita una celda
 * IMPORTANTE: Este trigger simple (onEdit) no puede hacer UrlFetchApp.
 * Se necesita un trigger instalable para llamar a APIs externas.
 */
function onEdit(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();
    var columna = range.getColumn();
    var fila = range.getRow();

    // Solo procesar si es columna CUIT y no es header
    if (columna !== COLUMNA_CUIT || fila <= FILA_HEADER) {
      return;
    }

    // Verificar si ya hay razón social (no sobrescribir)
    var razonSocialActual = sheet.getRange(fila, COLUMNA_RAZON_SOCIAL).getValue();
    if (razonSocialActual && razonSocialActual.toString().trim() !== '') {
      Logger.log('ℹ️ Fila ' + fila + ': Ya tiene razón social, no se sobrescribe');
      return;
    }

    var valorCuit = e.value;
    if (!valorCuit) {
      return;
    }

    // Normalizar CUIT
    var cuit = normalizarCUIT(valorCuit);
    if (!cuit) {
      Logger.log('⚠️ CUIT inválido en fila ' + fila + ': ' + valorCuit);
      return;
    }

    Logger.log('🔍 Consultando CUIT: ' + cuit + ' (fila ' + fila + ')');

    // Marcar que se necesita procesar (el trigger simple no puede hacer fetch)
    // Usar ScriptApp.newTrigger para procesar después
    PropertiesService.getScriptProperties().setProperty('PENDING_CUIT_' + fila, cuit);

  } catch (error) {
    Logger.log('❌ Error en onEdit: ' + error.message);
  }
}

/**
 * Trigger instalable que SÍ puede hacer llamadas HTTP
 * Ejecutar manualmente o configurar como trigger de tiempo
 */
function procesarCuitsPendientes() {
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  for (var key in allProps) {
    if (key.startsWith('PENDING_CUIT_')) {
      var fila = parseInt(key.replace('PENDING_CUIT_', ''));
      var cuit = allProps[key];

      Logger.log('🔄 Procesando CUIT pendiente: ' + cuit + ' (fila ' + fila + ')');

      // Verificar si ya hay razón social
      var razonSocialActual = sheet.getRange(fila, COLUMNA_RAZON_SOCIAL).getValue();
      if (razonSocialActual && razonSocialActual.toString().trim() !== '') {
        Logger.log('ℹ️ Fila ' + fila + ': Ya tiene razón social, saltando');
        props.deleteProperty(key);
        continue;
      }

      // Consultar via Vercel
      var razonSocial = consultarCUIT(cuit);

      if (razonSocial) {
        sheet.getRange(fila, COLUMNA_RAZON_SOCIAL).setValue(razonSocial);
        Logger.log('✅ Fila ' + fila + ': ' + razonSocial);
      } else {
        Logger.log('⚠️ Fila ' + fila + ': No se pudo obtener razón social');
      }

      // Limpiar pendiente
      props.deleteProperty(key);
    }
  }
}

/**
 * Función alternativa: usar onChange con trigger instalable
 * Esta sí puede hacer llamadas HTTP directamente
 */
function onChangeInstalable(e) {
  if (e.changeType !== 'EDIT') return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var activeCell = sheet.getActiveCell();
  var columna = activeCell.getColumn();
  var fila = activeCell.getRow();

  if (columna !== COLUMNA_CUIT || fila <= FILA_HEADER) {
    return;
  }

  // Verificar si ya hay razón social
  var razonSocialActual = sheet.getRange(fila, COLUMNA_RAZON_SOCIAL).getValue();
  if (razonSocialActual && razonSocialActual.toString().trim() !== '') {
    return;
  }

  var valorCuit = activeCell.getValue();
  if (!valorCuit) return;

  var cuit = normalizarCUIT(valorCuit);
  if (!cuit) return;

  Logger.log('🔍 Consultando CUIT: ' + cuit);
  var razonSocial = consultarCUIT(cuit);

  if (razonSocial) {
    sheet.getRange(fila, COLUMNA_RAZON_SOCIAL).setValue(razonSocial);
    Logger.log('✅ ' + razonSocial);
  }
}

/**
 * Normaliza un CUIT quitando guiones, espacios y texto adicional
 * @param {string} texto - CUIT en cualquier formato
 * @returns {string|null} - CUIT de 11 dígitos o null si inválido
 */
function normalizarCUIT(texto) {
  if (!texto) return null;

  // Convertir a string y quitar todo excepto dígitos
  var soloDigitos = texto.toString().replace(/\D/g, '');

  // Validar que tenga exactamente 11 dígitos
  if (soloDigitos.length !== 11) {
    return null;
  }

  return soloDigitos;
}

/**
 * Consulta el endpoint de Vercel para obtener razón social
 * @param {string} cuit - CUIT de 11 dígitos sin guiones
 * @returns {string|null} - Razón social o null si falla
 */
function consultarCUIT(cuit) {
  var url = VERCEL_BASE + '/api/consulta-cuit?cuit=' + cuit;

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log('📥 Vercel Response [' + responseCode + ']: ' + responseText.substring(0, 300));

    if (responseCode !== 200) {
      Logger.log('⚠️ Vercel retornó código ' + responseCode);
      return null;
    }

    var data = JSON.parse(responseText);

    // Verificar estructura de respuesta
    if (data.success && data.data && data.data.razonSocial) {
      return data.data.razonSocial;
    }

    return null;

  } catch (error) {
    Logger.log('❌ Error consultando CUIT: ' + error.message);
    return null;
  }
}

/**
 * TEST: Probar consulta CUIT con un CUIT conocido
 */
function testConsultaCUIT() {
  var cuit = '33715841199'; // LA MAYACA SRL
  Logger.log('🧪 Test con CUIT: ' + cuit);

  var resultado = consultarCUIT(cuit);

  if (resultado) {
    Logger.log('✅ Razón Social: ' + resultado);
  } else {
    Logger.log('❌ No se pudo obtener razón social');
  }

  return resultado;
}

/**
 * TEST: Probar normalización de CUIT
 */
function testNormalizarCUIT() {
  var casos = [
    '30682713018',
    '30-68271301-8',
    '30 68271301 8',
    '30-68271301-8 virreyes agropecuaria',
    'abc123',
    '1234567890' // 10 dígitos - inválido
  ];

  casos.forEach(function(caso) {
    var resultado = normalizarCUIT(caso);
    Logger.log(caso + ' → ' + (resultado || 'INVÁLIDO'));
  });
}

/**
 * Actualiza la razón social en Google Sheets buscando por ID REF
 * Llamado desde router.gs cuando viene un webhook de AppSheet
 * @param {string} idRef - ID REF de la fila a actualizar
 * @param {string} razonSocial - Razón social a escribir
 */
function actualizarRazonSocialEnSheet(idRef, razonSocial) {
  var spreadsheetId = '1URTOFW_OIM1JG0HKarhjigd-JgQSgFPCItbvDRa3p-o';
  var sheetName = 'TABLET'; // Nombre de la solapa

  Logger.log('📝 Actualizando razón social en sheet...');
  Logger.log('   ID REF: ' + idRef);
  Logger.log('   Razón Social: ' + razonSocial);

  try {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('No se encontró la hoja: ' + sheetName);
    }

    // Obtener todos los datos
    var data = sheet.getDataRange().getValues();

    // Buscar fila por ID (columna AQ = 43 = índice 42)
    var filaEncontrada = -1;
    for (var i = 1; i < data.length; i++) { // Empezar en 1 para skipear headers
      if (String(data[i][42]) === String(idRef)) {
        filaEncontrada = i + 1; // +1 porque getValues() es 0-indexed
        break;
      }
    }

    if (filaEncontrada === -1) {
      throw new Error('No se encontró registro con ID REF: ' + idRef);
    }

    // Actualizar columna AI (35) con razón social
    sheet.getRange(filaEncontrada, COLUMNA_RAZON_SOCIAL).setValue(razonSocial);

    Logger.log('✅ Razón social actualizada en fila ' + filaEncontrada);

  } catch (error) {
    Logger.log('❌ Error actualizando sheet: ' + error.message);
    throw error;
  }
}

/**
 * SETUP: Configurar trigger instalable onChange
 * Ejecutar UNA VEZ para instalar el trigger
 */
function setupTriggerOnChange() {
  // Eliminar triggers existentes de esta función
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onChangeInstalable') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Crear nuevo trigger
  ScriptApp.newTrigger('onChangeInstalable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();

  Logger.log('✅ Trigger onChange instalado correctamente');
}
