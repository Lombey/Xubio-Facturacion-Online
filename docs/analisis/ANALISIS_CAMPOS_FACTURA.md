# Análisis de Campos Requeridos para Facturación en Xubio

**Fecha:** 2024-12-19  
**Última actualización:** 2025-01-19  
**Fuente de verdad:** Swagger JSON oficial de Xubio (`test-imprimir-pdf/docs/Consulta APIs/swagger.json`)  
**Objetivo:** Verificar que todos los campos obligatorios requeridos por la API de Xubio estén siendo enviados correctamente según la especificación oficial.

**Estado:** ✅ **TODAS LAS VALIDACIONES IMPLEMENTADAS** (2025-01-19)

## 📋 Resumen Ejecutivo

Se realizó una comparación exhaustiva entre los campos **requeridos** según el **Swagger JSON oficial** de la API de Xubio y los campos que nuestra aplicación está enviando actualmente.

### ✅ Campos Correctos
- La mayoría de los campos requeridos están siendo enviados correctamente.
- Todos los campos problemáticos identificados han sido **VALIDADOS E IMPLEMENTADOS** (ver detalles más abajo).

### ✅ Campos Validados e Implementados

1. **`centroDeCosto`** - ✅ **RESUELTO**: Validación implementada en `obtenerCentroDeCostoPorDefecto()` y validación previa en `flujoCompletoFactura()`
2. **`cotizacion`** - ✅ **CORRECTO**: Solo se requiere para dólares (moneda extranjera), no para ARS
3. **`deposito`** - ✅ **RESUELTO**: Validación implementada antes de construir el payload
4. **`listaDePrecio`** - ✅ **RESUELTO**: Validación implementada después de obtener lista de precios
5. **`provincia`** - ✅ **RESUELTO**: Validación implementada después de obtener datos del cliente

---

## 🔍 Análisis Detallado

### 1. Campos en `transaccionProductoItems`

**Ubicación en código:** `app.js` líneas 1106-1160

| Campo | Requerido | Estado Actual | Observaciones |
|-------|-----------|---------------|---------------|
| `producto` | ✅ Sí | ✅ Enviado | Correcto (línea 1138-1143) |
| `centroDeCosto` | ✅ Sí | ✅ **VALIDADO** | Validación implementada en `obtenerCentroDeCostoPorDefecto()` (línea 2485-2490) y validación previa en `flujoCompletoFactura()` (línea 1054-1060) |
| `descripcion` | ✅ Sí | ✅ Enviado | Correcto (línea 1136) |
| `cantidad` | ✅ Sí | ✅ Enviado | Correcto (línea 1134) |
| `precio` | ✅ Sí | ✅ Enviado | Correcto (línea 1135) |
| `iva` | ✅ Sí | ✅ Enviado | Correcto (línea 1145) |
| `importe` | ✅ Sí | ✅ Enviado | Correcto (línea 1146) |
| `total` | ✅ Sí | ✅ Enviado | Correcto (línea 1147) |
| `montoExento` | ✅ Sí | ✅ Enviado | Correcto (línea 1148) |
| `porcentajeDescuento` | ✅ Sí | ✅ Enviado | Correcto (línea 1149) |
| `deposito` | ❌ Opcional | ✅ Enviado | Correcto (línea 1154-1157) |

**✅ RESUELTO - Validación implementada para `centroDeCosto`:**

La función `obtenerCentroDeCostoPorDefecto()` ahora valida y lanza error si no hay centros disponibles:

```javascript
// Línea 2485-2490
obtenerCentroDeCostoPorDefecto() {
  if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
    console.error('❌ No hay centros de costo disponibles');
    throw new Error('No hay centros de costo disponibles. Por favor, carga los centros de costo primero.');
  }
  return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1, 'centroDeCosto_id');
}
```

**Validaciones implementadas:**
1. ✅ Validación defensiva en `obtenerCentroDeCostoPorDefecto()` que lanza error si no hay centros
2. ✅ Validación previa en `flujoCompletoFactura()` (línea 1054-1060) que valida antes de construir la factura
3. ✅ Manejo de errores en `centroDeCostoSeleccionado()` (computed property) para no romper el template

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
| `deposito` | ✅ Sí | ✅ **VALIDADO** | Validación implementada (línea 1245-1255). Se valida antes de construir el payload |
| `descripcion` | ✅ Sí | ✅ Enviado | Correcto (línea 1182) |
| `externalId` | ✅ Sí | ✅ Enviado | Correcto (línea 1183) |
| `facturaNoExportacion` | ✅ Sí | ✅ Enviado | Correcto (línea 1184) |
| `fecha` | ✅ Sí | ✅ Enviado | Correcto (línea 1171) |
| `fechaVto` | ✅ Sí | ✅ Enviado | Correcto (línea 1172) |
| `listaDePrecio` | ✅ Sí | ✅ **VALIDADO** | Validación implementada (líneas 1130-1140). Se valida después de obtener lista de precios |
| `mailEstado` | ✅ Sí | ✅ Enviado | Correcto (línea 1186) |
| `nombre` | ✅ Sí | ✅ Enviado | Correcto (línea 1187) |
| `numeroDocumento` | ✅ Sí | ✅ Enviado | Correcto (línea 1188) |
| `porcentajeComision` | ✅ Sí | ✅ Enviado | Correcto (línea 1189) |
| `provincia` | ✅ Sí | ✅ **VALIDADO** | Validación implementada (líneas 1112-1122). Se valida después de obtener datos del cliente |
| `puntoVenta` | ✅ Sí | ✅ Enviado | Correcto (línea 1174) |
| `tipo` | ✅ Sí | ✅ Enviado | Correcto (línea 1169) |
| `transaccionCobranzaItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1191) |
| `transaccionPercepcionItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1192) |
| `transaccionProductoItems` | ✅ Sí | ✅ Enviado | Correcto (línea 1176) |
| `vendedor` | ✅ Sí | ✅ Enviado | Correcto (línea 1175) |

---

## ✅ Problemas Críticos Resueltos

### 1. **`centroDeCosto` en `transaccionProductoItems`** ✅ RESUELTO

**Estado:** ✅ **IMPLEMENTADO Y VALIDADO**

**Solución implementada:**
- ✅ Validación defensiva en `obtenerCentroDeCostoPorDefecto()` (líneas 2485-2490)
- ✅ Validación previa en `flujoCompletoFactura()` (líneas 1054-1060) 
- ✅ Manejo de errores en `centroDeCostoSeleccionado()` computed property (líneas 186-197)

**Código implementado:**
```javascript
// Línea 2485-2490: Validación defensiva
obtenerCentroDeCostoPorDefecto() {
  if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
    console.error('❌ No hay centros de costo disponibles');
    throw new Error('No hay centros de costo disponibles. Por favor, carga los centros de costo primero.');
  }
  return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1, 'centroDeCosto_id');
}

// Línea 186-197: Manejo en computed property
centroDeCostoSeleccionado() {
  try {
    const centro = this.obtenerCentroDeCostoPorDefecto();
    return {
      id: centro.ID || centro.id,
      nombre: centro.nombre || 'No disponible',
      codigo: centro.codigo || ''
    };
  } catch (error) {
    return {
      id: null,
      nombre: 'No disponible',
      codigo: ''
    };
  }
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

### 3. **`deposito` - ✅ RESUELTO** 

**Estado:** ✅ **IMPLEMENTADO Y VALIDADO**

**Solución implementada:**
- ✅ Validación antes de construir el payload (líneas 1245-1255)

**Código implementado:**
```javascript
// Líneas 1245-1255: Validación de depósito
const depositoHeader = this.obtenerDepositoPorDefecto();
if (!depositoHeader) {
  this.mostrarResultado('factura', 
    'Error: No hay depósitos disponibles.\n\n' +
    'Por favor, asegúrate de que existan depósitos activos en Xubio y que se hayan cargado los valores de configuración.', 
    'error'
  );
  this.isLoading = false;
  this.loadingContext = '';
  return;
}
payload.deposito = depositoHeader;
```

**Resultado:** Si no hay depósitos disponibles, se muestra un error claro al usuario antes de intentar crear la factura.

---

### 4. **`listaDePrecio` - ✅ RESUELTO**

**Estado:** ✅ **IMPLEMENTADO Y VALIDADO**

**Solución implementada:**
- ✅ Validación después de obtener lista de precios (líneas 1130-1140)

**Código implementado:**
```javascript
// Líneas 1124-1128: Obtener lista de precios
let listaDePrecioParaHeader = this.listaPrecioAGDP;
if (!listaDePrecioParaHeader) {
  listaDePrecioParaHeader = await this.obtenerListaPrecioAGDP();
}

// Líneas 1130-1140: Validación de lista de precios
if (!listaDePrecioParaHeader) {
  this.mostrarResultado('factura', 
    'Error: No se pudo obtener la lista de precios AGDP.\n\n' +
    'Por favor, verifica que exista una lista de precios con el código "AGDP" en Xubio.', 
    'error'
  );
  this.isLoading = false;
  this.loadingContext = '';
  return;
}
```

**Resultado:** Si no se puede obtener la lista de precios AGDP, se muestra un error claro al usuario antes de construir el payload.

---

### 5. **`provincia` - ✅ RESUELTO**

**Estado:** ✅ **IMPLEMENTADO Y VALIDADO**

**Solución implementada:**
- ✅ Validación después de obtener datos del cliente (líneas 1112-1122)

**Código implementado:**
```javascript
// Líneas 1108-1110: Obtener datos del cliente
const [datosCliente] = await Promise.all([
  this.obtenerDatosCliente(parseInt(clienteId))
]);

// Líneas 1112-1122: Validación de provincia
if (!datosCliente || !datosCliente.provincia) {
  this.mostrarResultado('factura', 
    'Error: El cliente seleccionado no tiene provincia configurada.\n\n' +
    'Por favor, configura la provincia del cliente en Xubio antes de crear la factura.', 
    'error'
  );
  this.isLoading = false;
  this.loadingContext = '';
  return;
}
```

**Resultado:** Si el cliente no tiene provincia configurada, se muestra un error claro al usuario antes de construir el payload.

---

## 📊 Resumen de Campos - Estado Actual

| Campo | Nivel | Estado | Implementación |
|-------|-------|--------|----------------|
| `centroDeCosto` | `transaccionProductoItems` | ✅ **VALIDADO** | Validación en `obtenerCentroDeCostoPorDefecto()` y `flujoCompletoFactura()` |
| `cotizacion` | `ComprobanteVentaBean` | ✅ **CORRECTO** | Solo se requiere para dólares (moneda extranjera) - Comportamiento correcto |
| `deposito` | `ComprobanteVentaBean` | ✅ **VALIDADO** | Validación antes de construir payload (línea 1245-1255) |
| `listaDePrecio` | `ComprobanteVentaBean` | ✅ **VALIDADO** | Validación después de obtener lista (línea 1130-1140) |
| `provincia` | `ComprobanteVentaBean` | ✅ **VALIDADO** | Validación después de obtener cliente (línea 1112-1122) |

---

## ✅ Implementación Completada (2025-01-19)

### Validaciones Implementadas

1. **✅ Validación de `centroDeCosto`:**
   - Validación defensiva en `obtenerCentroDeCostoPorDefecto()` (líneas 2485-2490)
   - Validación previa en `flujoCompletoFactura()` (líneas 1054-1060)
   - Manejo de errores en `centroDeCostoSeleccionado()` computed property (líneas 186-197)

2. **✅ `cotizacion` - Comportamiento correcto:**
   - Solo se agrega para dólares/monedas extranjeras (comportamiento correcto)
   - Para ARS no se envía (correcto según la API)

3. **✅ Validación de `deposito`:**
   - Validación implementada antes de construir payload (líneas 1245-1255)
   - Mensaje de error claro si no hay depósitos disponibles

4. **✅ Validación de `listaDePrecio`:**
   - Validación implementada después de obtener lista de precios (líneas 1130-1140)
   - Mensaje de error claro si no se puede obtener la lista AGDP

5. **✅ Validación de `provincia`:**
   - Validación implementada después de obtener datos del cliente (líneas 1112-1122)
   - Mensaje de error claro si el cliente no tiene provincia configurada

6. **✅ Manejo de errores mejorado:**
   - Todas las validaciones muestran mensajes de error claros al usuario
   - Las validaciones se ejecutan antes de construir el payload, evitando errores 400 en la API
   - Se mantiene el estado de carga (`isLoading`) correctamente en caso de error

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
- Los campos `deposito`, `listaDePrecio` y `provincia` están marcados como **REQUERIDOS** según el Swagger. **✅ Validación pre-envío implementada** para evitar enviar `null`. Si alguno de estos campos no está disponible, se muestra un error claro al usuario antes de intentar crear la factura.
- La API podría rechazar la factura si algún campo requerido falta o es inválido, devolviendo un error 400 con detalles del problema. **Con las validaciones implementadas, estos errores se previenen mostrando mensajes claros al usuario antes del envío.**

---

## 📅 Historial de Implementación

### 2025-01-19 - Implementación de Validaciones Completada

**Cambios realizados:**

1. **Validación de `centroDeCosto`:**
   - Modificado `obtenerCentroDeCostoPorDefecto()` para validar y lanzar error si no hay centros (líneas 2485-2490)
   - Ajustado `centroDeCostoSeleccionado()` computed property para manejar errores sin romper el template (líneas 186-197)
   - La validación previa en `flujoCompletoFactura()` ya existía (líneas 1054-1060)

2. **Validación de `deposito`:**
   - Agregada validación antes de construir el payload (líneas 1245-1255)
   - Mensaje de error claro si no hay depósitos disponibles

3. **Validación de `listaDePrecio`:**
   - Agregada validación después de obtener lista de precios (líneas 1130-1140)
   - Mensaje de error claro si no se puede obtener la lista AGDP

4. **Validación de `provincia`:**
   - Agregada validación después de obtener datos del cliente (líneas 1112-1122)
   - Mensaje de error claro si el cliente no tiene provincia configurada

**Resultado:**
- ✅ Todos los campos requeridos identificados en el documento están validados
- ✅ Se previenen errores 400 de la API mostrando mensajes claros al usuario
- ✅ El código sigue el patrón existente de validación en la aplicación
- ✅ No se encontraron errores de linter después de los cambios

**Archivos modificados:**
- `test-imprimir-pdf/assets/app.js`
