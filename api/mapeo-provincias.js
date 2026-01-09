/**
 * Mapeo Provincias - Genera mapeo nombre → ID de Xubio
 *
 * Endpoint: GET /api/mapeo-provincias
 * Muestra en log y response el mapeo para copiar
 */

import { getOfficialToken } from './utils/tokenManager.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    console.log('📍 Consultando provincias de Xubio...');

    const token = await getOfficialToken();

    const response = await fetch('https://xubio.com/API/1.1/provinciaBean', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const provincias = await response.json();

    console.log('\n========== MAPEO PROVINCIAS ==========\n');
    console.log('const PROVINCIAS_XUBIO = {');

    const mapeo = {};

    for (const prov of provincias) {
      const nombre = prov.nombre.toUpperCase().trim();
      const id = prov.provincia_id || prov.ID || prov.id;

      mapeo[nombre] = id;
      console.log(`  '${nombre}': ${id},`);
    }

    console.log('};');
    console.log('\n=======================================\n');

    // También mostrar categorías fiscales
    console.log('\n========== CONSULTANDO CATEGORIAS FISCALES ==========\n');

    const resCat = await fetch('https://xubio.com/API/1.1/categoriaFiscal', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const categorias = await resCat.json();

    console.log('const CATEGORIA_FISCAL_XUBIO = {');

    const mapeoCat = {};

    for (const cat of categorias) {
      const nombre = cat.nombre.toUpperCase().trim();
      const id = cat.ID || cat.id;

      mapeoCat[nombre] = id;
      console.log(`  '${nombre}': ${id},`);
    }

    console.log('};');
    console.log('\n=======================================\n');

    return res.status(200).json({
      success: true,
      provincias: mapeo,
      categoriasFiscales: mapeoCat,
      totalProvincias: Object.keys(mapeo).length,
      totalCategorias: Object.keys(mapeoCat).length
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
