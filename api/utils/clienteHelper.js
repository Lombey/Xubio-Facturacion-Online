/**
 * clienteHelper.js
 * Helper para obtener o crear clientes en Xubio
 *
 * Flujo:
 * 1. Buscar cliente por CUIT en Xubio
 * 2. Si existe → retornar cliente_id
 * 3. Si NO existe → scraping cuitonline + crear en Xubio → retornar cliente_id
 */

import { getOfficialToken } from './tokenManager.js';

// Mapeo de provincias (nombre → ID Xubio)
const PROVINCIAS_XUBIO = {
  'BUENOS AIRES': 1,
  'CATAMARCA': 10,
  'CHACO': 14,
  'CHUBUT': 20,
  'CIUDAD AUTÓNOMA DE BUENOS AIRES': 43,
  'CIUDAD AUTONOMA DE BUENOS AIRES': 43,
  'CABA': 43,
  'CAPITAL FEDERAL': 43,
  'CORDOBA': 3,
  'CÓRDOBA': 3,
  'CORRIENTES': 15,
  'ENTRE RIOS': 5,
  'ENTRE RÍOS': 5,
  'FORMOSA': 13,
  'JUJUY': 11,
  'LA PAMPA': 18,
  'LA RIOJA': 9,
  'MENDOZA': 4,
  'MISIONES': 16,
  'NEUQUEN': 19,
  'NEUQUÉN': 19,
  'RIO NEGRO': 21,
  'RÍO NEGRO': 21,
  'SALTA': 12,
  'SAN JUAN': 7,
  'SAN LUIS': 8,
  'SANTA CRUZ': 22,
  'SANTA FE': 2,
  'SANTIAGO DEL ESTERO': 6,
  'TIERRA DEL FUEGO': 23,
  'TUCUMAN': 17,
  'TUCUMÁN': 17
};

// Mapeo de categoría fiscal (condición IVA de cuitonline → ID Xubio)
const CATEGORIA_FISCAL_XUBIO = {
  'RESPONSABLE INSCRIPTO': 1,
  'IVA INSCRIPTO': 1,
  'IVA RESPONSABLE INSCRIPTO': 1,
  'MONOTRIBUTISTA': 4,
  'CONSUMIDOR FINAL': 3,
  'EXENTO': 5,
  'IVA EXENTO': 5,
  'EXTERIOR': 6,
  'IVA NO ALCANZADO': 7
};

/**
 * Obtiene o crea un cliente en Xubio
 * @param {string} cuit - CUIT del cliente (con o sin guiones)
 * @param {string} vercelBase - URL base de Vercel para scraping
 * @returns {Object} - { cliente_id, nombre, esNuevo }
 */
export async function obtenerOcrearCliente(cuit, vercelBase) {
  // Normalizar CUIT
  const cuitNormalizado = cuit.toString().replace(/\D/g, '');
  const cuitFormateado = cuitNormalizado.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3');

  console.log(`👤 [CLIENTE] Buscando cliente CUIT: ${cuitFormateado}`);

  const token = await getOfficialToken();

  // 1. Buscar cliente existente en Xubio
  const clienteExistente = await buscarClienteEnXubio(token, cuitNormalizado);

  if (clienteExistente) {
    console.log(`✅ [CLIENTE] Cliente encontrado: ${clienteExistente.nombre} (ID: ${clienteExistente.cliente_id})`);
    return {
      cliente_id: clienteExistente.cliente_id,
      nombre: clienteExistente.nombre,
      esNuevo: false
    };
  }

  // 2. Cliente no existe - obtener datos de AFIP via scraping
  console.log(`⚠️ [CLIENTE] Cliente no existe, creando...`);

  const datosAFIP = await consultarCuitOnline(cuitNormalizado, vercelBase);

  if (!datosAFIP) {
    throw new Error(`No se pudieron obtener datos de AFIP para CUIT: ${cuitFormateado}`);
  }

  console.log(`📋 [CLIENTE] Datos AFIP: ${datosAFIP.razonSocial} | ${datosAFIP.provincia} | ${datosAFIP.condicionIVA}`);

  // 3. Crear cliente en Xubio
  const nuevoCliente = await crearClienteEnXubio(token, datosAFIP);

  console.log(`✅ [CLIENTE] Cliente creado: ${nuevoCliente.nombre} (ID: ${nuevoCliente.cliente_id})`);

  return {
    cliente_id: nuevoCliente.cliente_id,
    nombre: nuevoCliente.nombre,
    esNuevo: true
  };
}

/**
 * Busca un cliente por CUIT en Xubio
 */
async function buscarClienteEnXubio(token, cuitSinGuiones) {
  const url = `https://xubio.com/API/1.1/clienteBean?numeroIdentificacion=${cuitSinGuiones}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    console.log(`⚠️ [CLIENTE] Error buscando cliente: HTTP ${response.status}`);
    return null;
  }

  const clientes = await response.json();

  if (Array.isArray(clientes) && clientes.length > 0) {
    return clientes[0];
  }

  return null;
}

/**
 * Consulta datos de CUIT en cuitonline via endpoint de Vercel
 */
async function consultarCuitOnline(cuitSinGuiones, vercelBase) {
  const url = `${vercelBase}/api/consulta-cuit?cuit=${cuitSinGuiones}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.log(`⚠️ [CLIENTE] Error consultando cuitonline: HTTP ${response.status}`);
    return null;
  }

  const result = await response.json();

  if (!result.success) {
    console.log(`⚠️ [CLIENTE] Error cuitonline: ${result.error}`);
    return null;
  }

  return result.data;
}

/**
 * Crea un cliente en Xubio con datos de AFIP
 */
async function crearClienteEnXubio(token, datosAFIP) {
  // Mapear provincia
  const provinciaNombre = (datosAFIP.provincia || '').toUpperCase().trim();
  const provinciaId = PROVINCIAS_XUBIO[provinciaNombre] || 1; // Default: Buenos Aires

  // Mapear categoría fiscal desde condición IVA
  let categoriaFiscalId = 1; // Default: Responsable Inscripto
  const condicionIVA = (datosAFIP.condicionIVA || '').toUpperCase().replace(/&NBSP;/g, '').trim();

  for (const [key, value] of Object.entries(CATEGORIA_FISCAL_XUBIO)) {
    if (condicionIVA.includes(key)) {
      categoriaFiscalId = value;
      break;
    }
  }

  // Construir payload
  const payload = {
    nombre: datosAFIP.razonSocial,
    razonSocial: datosAFIP.razonSocial,
    cuit: datosAFIP.cuit,
    identificacionTributaria: {
      ID: 9,
      id: 9,
      nombre: 'CUIT',
      codigo: 'CUIT'
    },
    categoriaFiscal: {
      ID: categoriaFiscalId,
      id: categoriaFiscalId
    },
    provincia: {
      ID: provinciaId,
      id: provinciaId
    },
    pais: {
      ID: 1,
      id: 1,
      nombre: 'Argentina',
      codigo: 'ARGENTINA'
    },
    esclienteextranjero: 0,
    esProveedor: 0,
    // Lista de precios por defecto (AGDP)
    listaPrecioVenta: {
      ID: 15386,
      id: 15386,
      nombre: 'AGDP',
      codigo: 'AGDP'
    }
  };

  console.log(`📤 [CLIENTE] Creando cliente en Xubio...`);

  const response = await fetch('https://xubio.com/API/1.1/clienteBean', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error(`❌ [CLIENTE] Error creando cliente:`, JSON.stringify(responseData));
    throw new Error(`Error creando cliente en Xubio: ${response.status} - ${JSON.stringify(responseData)}`);
  }

  return responseData;
}
