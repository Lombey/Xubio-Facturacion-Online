# Verificación de Endpoints de la API Xubio

Este documento verifica que los endpoints utilizados en la aplicación estén correctamente implementados según la documentación oficial.

## ✅ Endpoints Verificados y Documentados

### 1. `/imprimirPDF` - Obtener URL de PDF
- **Estado**: ✅ Documentado (línea 425-432 de API_Xubio.md)
- **Uso en código**: `app.js:405-408`
- **Parámetros usados**: 
  - `idtransaccion` (int64) ✅ Correcto
  - `tipoimpresion` (int32) ✅ Correcto
- **Validación**: ✅ Se valida que sean números > 0

### 2. `/comprobanteVentaBean` POST - Crear factura
- **Estado**: ✅ Documentado (línea 201-210 de API_Xubio.md)
- **Uso en código**: `app.js:548, 602`
- **Campos usados**:
  - `circuitoContable` ✅
  - `comprobante` ✅
  - `cliente` ✅
  - `fecha` ✅
  - `detalleComprobantes` ✅
  - `moneda` ✅
  - `cotizacion` ✅
  - `utilizaMonedaExtranjera` ✅
  - `observacion` ✅
- **Nota**: La documentación menciona "cantidad, precio, IVA, etc." en `detalleComprobantes`, pero no especifica la estructura exacta. Estamos usando: `{ cantidad, precio, producto: { id }, descripcion }`

### 3. `/comprobanteVentaBean` GET - Listar facturas
- **Estado**: ✅ Documentado (línea 186-199 de API_Xubio.md)
- **Uso en código**: `app.js:780-781`
- **Parámetros usados**: 
  - `fechaDesde` ✅
  - `fechaHasta` ✅

### 4. `/comprobanteVentaBean/{id}` GET - Obtener factura
- **Estado**: ✅ Documentado (línea 212-215 de API_Xubio.md)
- **Uso en código**: `app.js:651, 716`

### 5. `/cobranzaBean` POST - Crear cobranza
- **Estado**: ✅ Documentado (línea 241-251 de API_Xubio.md)
- **Uso en código**: `app.js:672, 737`
- **Campos usados**: Todos los campos documentados ✅

### 6. `/monedaBean` GET - Obtener monedas
- **Estado**: ✅ Documentado (línea 412-417 de API_Xubio.md)
- **Uso en código**: `app.js:994-995`
- **Parámetros usados**: `activo: 1` ✅

### 7. `/clienteBean/{id}` GET - Obtener cliente
- **Estado**: ✅ Documentado (línea 126-129 de API_Xubio.md)
- **Uso en código**: `app.js:1025`

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 8. `/productoVenta` vs `/ProductoVentaBean` - NOMBRE INCORRECTO
- **Estado**: ❌ **ENDPOINT INCORRECTO**
- **Uso actual en código**: `/productoVenta` (línea 899)
- **Endpoint correcto según Swagger**: `/ProductoVentaBean` (con P mayúscula y "Bean" al final)
- **Parámetros correctos según Swagger**:
  - `id` (int64, opcional)
  - `nombre` (string, opcional)
  - `usrcode` (string, opcional)
  - `categoriaProducto` (int32, opcional)
  - `tasaIVAProducto` (int32, opcional)
  - `activo` (int32, opcional) ✅ Usado correctamente
- **Acción requerida**: Cambiar endpoint a `/ProductoVentaBean`

### 9. `/listaPrecio` vs `/listaPrecioBean` - NOMBRE INCORRECTO
- **Estado**: ❌ **ENDPOINT INCORRECTO**
- **Uso actual en código**: `/listaPrecio` (línea 839) y `/listaPrecio/{id}` (línea 855)
- **Endpoint correcto según Swagger**: `/listaPrecioBean` y `/listaPrecioBean/{id}`
- **Parámetros correctos según Swagger**:
  - `tipo` (int64, opcional) - 1 = Venta, 2 = Compra
  - `activo` (int64, opcional) - 1 = Activo, 0 = Inactivo
- **Estructura de respuesta**: `ListaPrecioBean` con:
  - `listaPrecioID` (int64)
  - `nombre` (string)
  - `listaPrecioItem` (array) - contiene `producto`, `precio`, `codigo`, `referencia`
- **Acción requerida**: Cambiar endpoints a `/listaPrecioBean` y `/listaPrecioBean/{id}`

## ❌ ERROR CRÍTICO: Nombre de Campo Incorrecto

### `detalleComprobantes` vs `transaccionProductoItems` - NOMBRE INCORRECTO
- **Estado**: ❌ **CAMPO INCORRECTO**
- **Uso actual en código**: `detalleComprobantes` (línea 486, 513, 598)
- **Campo correcto según Swagger**: `transaccionProductoItems` (array)
- **Estructura completa según Swagger** (todos los campos son REQUERIDOS):
  ```javascript
  {
    transaccionCVItemId: integer (int64, opcional),
    transaccionId: integer (int64, opcional),
    producto: { ID, nombre, codigo, id }, // REQUERIDO
    centroDeCosto: { ID, nombre, codigo, id }, // REQUERIDO
    deposito: { ID, nombre, codigo, id }, // Opcional
    descripcion: string, // REQUERIDO
    cantidad: number, // REQUERIDO (ej: 10.0)
    precio: number, // REQUERIDO (ej: 333.33) - precio con IVA incluido
    iva: number, // REQUERIDO
    importe: number, // REQUERIDO
    total: number, // REQUERIDO
    montoExento: number, // REQUERIDO
    porcentajeDescuento: number, // REQUERIDO
    precioconivaincluido: number (opcional, ej: 333.33)
  }
  ```

**Campos que estamos usando** (INCORRECTOS):
- ❌ `detalleComprobantes` - Nombre incorrecto, debe ser `transaccionProductoItems`
- ✅ `cantidad` - Correcto pero puede faltar validación
- ✅ `precio` - Correcto pero debe incluir IVA
- ✅ `producto: { id }` - Correcto
- ✅ `descripcion` - Correcto

**Campos REQUERIDOS que faltan**:
- ❌ `iva` - REQUERIDO
- ❌ `importe` - REQUERIDO
- ❌ `total` - REQUERIDO
- ❌ `montoExento` - REQUERIDO
- ❌ `porcentajeDescuento` - REQUERIDO
- ❌ `centroDeCosto` - REQUERIDO
- ⚠️ `deposito` - Opcional pero recomendado

**Acción requerida**: 
1. Cambiar `detalleComprobantes` a `transaccionProductoItems`
2. Agregar todos los campos requeridos
3. Calcular `importe`, `total`, `iva` correctamente

## 📋 Recomendaciones

1. **Probar en producción**: Los endpoints no documentados (`productoVenta`, `listaPrecio`) necesitan ser probados para verificar la estructura real de respuesta.

2. **Validar `detalleComprobantes`**: Si las facturas fallan al crearse, puede ser necesario agregar campos adicionales como IVA.

3. **Documentar hallazgos**: Cuando se prueben estos endpoints, documentar la estructura real de respuesta para referencia futura.

## ✅ Conclusión

- **Endpoints principales**: ✅ Todos verificados contra documentación
- **Endpoints secundarios**: ⚠️ Basados en patrones documentados, necesitan validación práctica
- **Estructura de datos**: ⚠️ Algunos campos pueden necesitar ajustes según respuestas reales de la API

