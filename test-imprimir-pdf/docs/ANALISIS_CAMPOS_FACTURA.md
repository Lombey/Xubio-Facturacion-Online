# Análisis de Campos Requeridos para Facturación en Xubio

**Fecha:** 2024-12-19  
**Última actualización:** 2025-01-XX  
**Fuente de verdad:** Swagger JSON oficial de Xubio (`test-imprimir-pdf/docs/Consulta APIs/swagger.json`)  
**Objetivo:** Verificar que todos los campos obligatorios requeridos por la API de Xubio estén siendo enviados correctamente según la especificación oficial.

## 📋 Resumen Ejecutivo

Se realizó una comparación exhaustiva entre los campos **requeridos** según el **Swagger JSON oficial** de la API de Xubio y los campos que nuestra aplicación está enviando actualmente.

### ✅ Campos Correctos
- La mayoría de los campos requeridos están siendo enviados correctamente.
- Los campos `deposito`, `listaDePrecio` y `provincia` **YA ESTÁN IMPLEMENTADOS** en el código (ver estado actualizado más abajo).

### ⚠️ Campos con Problemas Identificados

1. **`centroDeCosto`** - Presente pero podría ser inválido si no hay centros de costo cargados
2. **`cotizacion`** - ✅ **CORRECTO**: Solo se requiere para dólares (moneda extranjera), no para ARS
3. **`deposito`** - ✅ **IMPLEMENTADO** pero puede ser `null` (requerido según Swagger)
4. **`listaDePrecio`** - ✅ **IMPLEMENTADO** pero puede ser `null` (requerido según Swagger)
5. **`provincia`** - ✅ **IMPLEMENTADO** pero puede ser `null` (requerido según Swagger)

---

## 🔍 Análisis Detallado

### 1. Campos en `transaccionProductoItems`

**Ubicación en código:** `app.js` líneas 1106-1160

| Campo | Requerido | Estado Actual | Observaciones |
|-------|-----------|---------------|---------------|
| `producto` | ✅ Sí | ✅ Enviado | Correcto (línea 1138-1143) |
| `centroDeCosto` | ✅ Sí | ⚠️ **PROBLEMA** | Se envía (línea 1150) pero si `this.centrosDeCosto` está vacío, devuelve `{ID: 1, id: 1, nombre: '', codigo: ''}` que podría no existir en Xubio |
| `descripcion` | ✅ Sí | ✅ Enviado | Correcto (línea 1136) |
| `cantidad` | ✅ Sí | ✅ Enviado | Correcto (línea 1134) |
| `precio` | ✅ Sí | ✅ Enviado | Correcto (línea 1135) |
| `iva` | ✅ Sí | ✅ Enviado | Correcto (línea 1145) |
| `importe` | ✅ Sí | ✅ Enviado | Correcto (línea 1146) |
| `total` | ✅ Sí | ✅ Enviado | Correcto (línea 1147) |
| `montoExento` | ✅ Sí | ✅ Enviado | Correcto (línea 1148) |
| `porcentajeDescuento` | ✅ Sí | ✅ Enviado | Correcto (línea 1149) |
| `deposito` | ❌ Opcional | ✅ Enviado | Correcto (línea 1154-1157) |

**Problema identificado con `centroDeCosto`:**
```javascript
// Línea 1150
centroDeCosto: this.obtenerCentroDeCostoPorDefecto()
```

La función `obtenerCentroDeCostoPorDefecto()` (línea 2422) llama a `obtenerPorDefecto()` que:
- Si hay centros de costo: devuelve el primero con su ID real
- Si NO hay centros de costo: devuelve `{ID: 1, id: 1, nombre: '', codigo: ''}`

**Riesgo:** Si no hay centros de costo cargados en `this.centrosDeCosto`, se enviará un ID=1 que podría no existir en Xubio, causando un error en la API.

**Solución recomendada:**
1. Validar que `this.centrosDeCosto` tenga al menos un elemento antes de construir la factura
2. Mostrar un error claro si no hay centros de costo disponibles
3. Asegurar que `cargarValoresConfiguracion()` se ejecute antes de facturar

---

### 2. Campos en `ComprobanteVentaBean` (Nivel Principal)

**Ubicación en código:** `app.js` líneas 1166-1193

| Campo | Requerido | Estado Actual | Observaciones |
|-------|-----------|---------------|---------------|
| `cantComprobantesCancelados` | ✅ Sí | ✅ Enviado | Correcto (línea 1178) |
| `cantComprobantesEmitidos` | ✅ Sí | ✅ Enviado | Correcto (línea 1179) |
| `cbuinformada` | ✅ Sí | ✅ Enviado | Correcto (línea 1180) |
| `cliente` | ✅ Sí | ✅ Enviado | Correcto (línea 1170) |
| `condicionDePago` | ✅ Sí | ✅ Enviado | Correcto (línea 1173) |
| `cotizacion` | ✅ Sí | ✅ **CORRECTO** | Solo se requiere para dólares (moneda extranjera). Para ARS no se envía (línea 1212) |
| `cotizacionListaDePrecio` | ✅ Sí | ✅ Enviado | Correcto (línea 1181) |
| `deposito` | ✅ Sí | ✅ **IMPLEMENTADO** | Se envía a nivel de comprobante (línea 1219-1223). Puede ser `null` si no hay depósitos disponibles |
| `descripcion` | ✅ Sí | ✅ Enviado | Correcto (línea 1182) |
| `externalId` | ✅ Sí | ✅ Enviado | Correcto (línea 1183) |
| `facturaNoExportacion` | ✅ Sí | ✅ Enviado | Correcto (línea 1184) |
| `fecha` | ✅ Sí | ✅ Enviado | Correcto (línea 1171) |
| `fechaVto` | ✅ Sí | ✅ Enviado | Correcto (línea 1172) |
| `listaDePrecio` | ✅ Sí | ⚠️ **POTENCIAL PROBLEMA** | Se envía correctamente (líneas 1199-1204) pero puede ser `null` si no se encuentra listaPrecioAGDP |
| `mailEstado` | ✅ Sí | ✅ Enviado | Correcto (línea 1186) |
| `nombre` | ✅ Sí | ✅ Enviado | Correcto (línea 1187) |
| `numeroDocumento` | ✅ Sí | ✅ Enviado | Correcto (línea 1188) |
| `porcentajeComision` | ✅ Sí | ✅ Enviado | Correcto (línea 1189) |
| `provincia` | ✅ Sí | ⚠️ **POTENCIAL PROBLEMA** | Se envía correctamente (líneas 1209-1214) pero puede ser `null` si el cliente no tiene provincia configurada |
| `puntoVenta` | ✅ Sí | ✅ Enviado | Correcto (línea 1174) |
| `tipo` | ✅ Sí | ✅ Enviado | Correcto (línea 1169) |
| `transaccionCobranzaItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1191) |
| `transaccionPercepcionItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1192) |
| `transaccionProductoItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1176) |
| `vendedor` | ✅ Sí | ✅ Enviado | Correcto (línea 1175) |

---

## 🚨 Problemas Críticos Identificados

### 1. **`centroDeCosto` en `transaccionProductoItems`** ⚠️ CRÍTICO

**Problema:**
- El campo se envía, pero si no hay centros de costo cargados, se envía un objeto con `ID: 1` que podría no existir en Xubio.
- Esto causaría un error 400/500 en la API.

**Código actual:**
```javascript
// Línea 1150
centroDeCosto: this.obtenerCentroDeCostoPorDefecto()

// Línea 2422-2424
obtenerCentroDeCostoPorDefecto() {
  return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1, 'centroDeCosto_id');
}

// Línea 2399-2417
obtenerPorDefecto(lista, idField = 'ID', fallbackId = 1, idFieldAlternativo = null) {
  if (lista && lista.length > 0) {
    // ... devuelve el primero
  }
  // Fallback si no hay items
  return { 
    [idField]: fallbackId,  // ← Devuelve ID: 1 si no hay items
    id: fallbackId,
    nombre: '',
    codigo: ''
  };
}
```

**Solución:**
```javascript
// Validar antes de construir transaccionProductoItems
if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
  throw new Error('No hay centros de costo disponibles. Por favor, carga los centros de costo primero.');
}

// O mejor aún, validar en obtenerCentroDeCostoPorDefecto()
obtenerCentroDeCostoPorDefecto() {
  if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
    console.error('❌ No hay centros de costo disponibles');
    throw new Error('No hay centros de costo disponibles. Por favor, carga los centros de costo primero.');
  }
  return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1, 'centroDeCosto_id');
}
```

---

### 2. **`cotizacion` - ✅ CORRECTO** 

**Estado:**
- ✅ **CORRECTO**: La cotización solo se requiere para dólares (moneda extranjera).
- Para ARS (moneda local), NO se envía `cotizacion` y esto es el comportamiento correcto.
- El campo `cotizacion` es condicionalmente requerido: solo cuando `utilizaMonedaExtranjera = 1`.

**Código actual (correcto):**
```javascript
// Líneas 1195-1215
// Agregar moneda si no es ARS/PESOS_ARGENTINOS (moneda extranjera)
const esMonedaExtranjera = this.facturaMoneda && 
  this.facturaMoneda !== 'ARS' && 
  this.facturaMoneda !== 'PESOS_ARGENTINOS';

if (esMonedaExtranjera) {
  // Solo para dólares/monedas extranjeras se agrega cotizacion
  const cotizacion = parseFloat(this.facturaCotizacion) || 1;
  payload.cotizacion = cotizacion > 0 ? cotizacion : 1;
  payload.utilizaMonedaExtranjera = 1;
}
// ← Si es ARS, no se agrega cotizacion (correcto)
```

**Nota:** Aunque el Swagger marca `cotizacion` como requerido, en la práctica solo se necesita cuando se usa moneda extranjera. El código actual está implementado correctamente.

---

### 3. **`deposito` - ✅ IMPLEMENTADO pero puede ser `null`** ⚠️ IMPORTANTE

**Estado Actual:**
- ✅ **YA IMPLEMENTADO**: El campo `deposito` se envía a nivel de `ComprobanteVentaBean` (líneas 1219-1223).
- ⚠️ **PROBLEMA POTENCIAL**: `obtenerDepositoPorDefecto()` puede devolver `null` si no hay depósitos disponibles.

**Código actual (líneas 1219-1223):**
```javascript
// Agregar depósito a nivel comprobante (requerido según Swagger)
const depositoHeader = this.obtenerDepositoPorDefecto();
if (depositoHeader) {
  payload.deposito = depositoHeader;
}
// ⚠️ Si depositoHeader es null, no se agrega al payload
```

**Problema:**
Según el Swagger oficial, `deposito` es **REQUERIDO** en `ComprobanteVentaBean`. Si `obtenerDepositoPorDefecto()` devuelve `null`, el campo no se agrega al payload, lo que podría causar un error 400 en la API.

**Solución recomendada:**
1. Validar que haya depósitos disponibles antes de construir el payload.
2. Lanzar un error claro si no hay depósitos disponibles.
3. Asegurar que `cargarValoresConfiguracion()` se ejecute antes de facturar.

---

### 4. **`listaDePrecio` - ✅ IMPLEMENTADO pero puede ser `null`** ⚠️ IMPORTANTE

**Estado Actual:**
- ✅ **YA IMPLEMENTADO**: El campo `listaDePrecio` se envía correctamente (líneas 1112-1204).
- ⚠️ **PROBLEMA POTENCIAL**: Puede ser `null` si no se encuentra `listaPrecioAGDP`.

**Código actual (líneas 1112-1204):**
```javascript
// Líneas 1112-1116: Se intenta obtener listaPrecioAGDP
let listaDePrecioParaHeader = this.listaPrecioAGDP;
if (!listaDePrecioParaHeader) {
  listaDePrecioParaHeader = await this.obtenerListaPrecioAGDP();
}

// Líneas 1199-1204: Se agrega al payload
listaDePrecio: listaDePrecioParaHeader ? {
  ID: listaDePrecioParaHeader.listaPrecioID || listaDePrecioParaHeader.id || listaDePrecioParaHeader.ID,
  id: listaDePrecioParaHeader.listaPrecioID || listaDePrecioParaHeader.id || listaDePrecioParaHeader.ID,
  nombre: listaDePrecioParaHeader.nombre || '',
  codigo: listaDePrecioParaHeader.codigo || ''
} : null, // ⚠️ Puede ser null si no se encuentra
```

**Problema:**
Según el Swagger oficial, `listaDePrecio` es **REQUERIDO** en `ComprobanteVentaBean`. Si `listaPrecioParaHeader` es `null`, el campo se envía como `null`, lo que podría causar un error 400 en la API.

**Solución recomendada:**
1. Validar que `listaPrecioParaHeader` no sea `null` antes de construir el payload.
2. Lanzar un error claro si no se puede obtener la lista de precios.
3. Asegurar que `obtenerListaPrecioAGDP()` siempre devuelva un valor válido o lance un error.

---

### 5. **`provincia` - ✅ IMPLEMENTADO pero puede ser `null`** ⚠️ IMPORTANTE

**Estado Actual:**
- ✅ **YA IMPLEMENTADO**: El campo `provincia` se obtiene del cliente y se envía correctamente (líneas 1209-1214).
- ⚠️ **PROBLEMA POTENCIAL**: Puede ser `null` si el cliente no tiene provincia configurada.

**Código actual (líneas 1108-1109, 1209-1214):**
```javascript
// Líneas 1108-1109: Se obtienen datos del cliente
const [datosCliente] = await Promise.all([
  this.obtenerDatosCliente(parseInt(clienteId))
]);

// Líneas 1209-1214: Se agrega provincia al payload
provincia: datosCliente?.provincia ? {
  ID: datosCliente.provincia.provincia_id || datosCliente.provincia.ID || datosCliente.provincia.id,
  id: datosCliente.provincia.provincia_id || datosCliente.provincia.ID || datosCliente.provincia.id,
  nombre: datosCliente.provincia.nombre || '',
  codigo: datosCliente.provincia.codigo || ''
} : null, // ⚠️ Puede ser null si el cliente no tiene provincia
```

**Problema:**
Según el Swagger oficial, `provincia` es **REQUERIDO** en `ComprobanteVentaBean`. Si `datosCliente.provincia` es `null` o `undefined`, el campo se envía como `null`, lo que podría causar un error 400 en la API.

**Solución recomendada:**
1. Validar que el cliente tenga provincia configurada antes de construir el payload.
2. Lanzar un error claro si el cliente no tiene provincia.
3. Considerar usar una provincia por defecto o requerir que el cliente tenga provincia configurada.

---

## 📊 Resumen de Campos Faltantes o Problemáticos

| Campo | Nivel | Problema | Prioridad |
|-------|-------|----------|-----------|
| `centroDeCosto` | `transaccionProductoItems` | Podría ser inválido si no hay centros cargados | 🔴 CRÍTICA |
| `cotizacion` | `ComprobanteVentaBean` | ✅ **CORRECTO** - Solo se requiere para dólares | ✅ OK |
| `deposito` | `ComprobanteVentaBean` | ✅ Implementado pero puede ser `null` | 🟡 ALTA |
| `listaDePrecio` | `ComprobanteVentaBean` | ✅ Implementado pero puede ser `null` | 🟡 ALTA |
| `provincia` | `ComprobanteVentaBean` | ✅ Implementado pero puede ser `null` | 🟡 ALTA |

---

## ✅ Recomendaciones

1. **Validar centros de costo antes de facturar:**
   - Asegurar que `cargarValoresConfiguracion()` se ejecute antes de facturar.
   - Validar que `this.centrosDeCosto` tenga al menos un elemento.
   - Mostrar error claro si no hay centros de costo disponibles.

2. **`cotizacion` - ✅ Ya está correcto:**
   - Solo se agrega para dólares/monedas extranjeras (comportamiento correcto)
   - Para ARS no se envía (correcto)

3. **Validar `deposito` antes de enviar:**
   - ✅ Ya está implementado a nivel de comprobante (líneas 1219-1223).
   - Validar que `obtenerDepositoPorDefecto()` no devuelva `null`.
   - Lanzar error claro si no hay depósitos disponibles.

4. **Validar `listaDePrecio` antes de enviar:**
   - ✅ Ya está implementado (líneas 1112-1204).
   - Validar que `listaPrecioParaHeader` no sea `null`.
   - Lanzar error claro si no se puede obtener la lista de precios.

5. **Validar `provincia` antes de enviar:**
   - ✅ Ya está implementado (líneas 1209-1214).
   - Validar que el cliente tenga provincia configurada.
   - Lanzar error claro si el cliente no tiene provincia.

6. **Mejorar manejo de errores:**
   - Validar todos los campos requeridos antes de enviar la factura.
   - Mostrar mensajes de error claros indicando qué campo falta o es inválido.

---

## 🔗 Referencias

- **Swagger JSON oficial (fuente de verdad):** `test-imprimir-pdf/docs/Consulta APIs/swagger.json`
- **Documentación API Xubio:** `test-imprimir-pdf/docs/Consulta APIs/API_Xubio.md`
- **Swagger JSON online:** `https://xubio.com/API/1.1/swagger.json`
- **Código fuente:** `test-imprimir-pdf/assets/app.js` (líneas 1100-1298)

---

## 📝 Notas Adicionales

### Campos según Swagger Oficial

Según el **Swagger JSON oficial** (`test-imprimir-pdf/docs/Consulta APIs/swagger.json`), la definición de `ComprobanteVentaBean` incluye los siguientes campos **REQUERIDOS**:

```json
"ComprobanteVentaBean": {
  "required": [
    "cantComprobantesCancelados",
    "cantComprobantesEmitidos",
    "cbuinformada",
    "cliente",
    "condicionDePago",
    "cotizacion",
    "cotizacionListaDePrecio",
    "deposito",
    "descripcion",
    "externalId",
    "facturaNoExportacion",
    "fecha",
    "fechaVto",
    "listaDePrecio",
    "mailEstado",
    "nombre",
    "numeroDocumento",
    "porcentajeComision",
    "provincia",
    "puntoVenta",
    "tipo",
    "transaccionCobranzaItems",
    "transaccionPercepcionItems",
    "transaccionProductoItems",
    "vendedor"
  ]
}
```

Y para `TransaccionProductoItems`:

```json
"TransaccionProductoItems": {
  "required": [
    "cantidad",
    "centroDeCosto",
    "descripcion",
    "importe",
    "iva",
    "montoExento",
    "porcentajeDescuento",
    "precio",
    "producto",
    "total"
  ],
  "properties": {
    "deposito": { ... }  // Opcional (no está en required)
  }
}
```

### Observaciones Importantes

- El campo `observacion` **NO está documentado** en el Swagger para `ComprobanteVentaBean`, pero la aplicación lo envía. Se recomienda verificar si Xubio lo acepta.
- El campo `cotizacion` está marcado como **REQUERIDO** en el Swagger, pero en la práctica solo se necesita cuando `utilizaMonedaExtranjera = 1`. El código actual implementa esto correctamente.
- Los campos `deposito`, `listaDePrecio` y `provincia` están marcados como **REQUERIDOS** según el Swagger, pero el código actual puede enviarlos como `null`. **Se desconoce si la API acepta `null` en estos campos**. Se recomienda:
  1. Implementar validación pre-envío para evitar enviar `null`.
  2. Probar empíricamente si la API acepta `null` y documentar los resultados.
- La API podría rechazar la factura si algún campo requerido falta o es inválido, devolviendo un error 400 con detalles del problema.
