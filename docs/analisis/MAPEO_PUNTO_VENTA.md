# Mapeo de Campos: Punto de Venta en Factura

## Tabla de Mapeo Completa

| Campo API (`PuntoVentaBean`) | Tipo | ¿Se usa? | Campo Payload (`PuntoVentaBeanSelector`) | Transformación | Ubicación en código |
|------------------------------|------|----------|------------------------------------------|----------------|---------------------|
| `puntoVentaId` | integer | ✅ **SÍ** | `ID` | `ID = puntoVentaId` | `app.js:2548, 2594` |
| `puntoVentaId` | integer | ✅ **SÍ** | `id` | `id = puntoVentaId` | `app.js:2553, 2600` |
| `nombre` | string | ✅ **SÍ** | `nombre` | Directo (sin cambio) | `app.js:2554, 2598` |
| `codigo` | string | ✅ **SÍ** | `codigo` | Directo (sin cambio) | `app.js:2555, 2599` |
| `puntoVenta` | string | ⚠️ **Solo validación** | - | No se envía al payload, solo se usa para buscar/filtrar | `app.js:2581-2584` |
| `editable` | boolean/number | ⚠️ **Solo validación** | - | No se envía, solo se usa para validar (debe ser true/1) | `app.js:2563, 359, 1073` |
| `sugerido` | boolean/number | ⚠️ **Solo validación** | - | No se envía, solo se usa para validar (debe ser true/1) | `app.js:2564, 360, 1074` |
| `editableSugerido` | boolean/number | ⚠️ **Solo validación** | - | No se envía, solo se usa para validar (debe ser true/1) | `app.js:2565, 361, 1075` |
| `modoNumeracion` | string | ❌ NO | - | No se usa | - |
| `circuitoContable` | object | ❌ NO | - | No se usa | - |
| `activo` | integer | ⚠️ **Solo filtro** | - | No se envía, solo se usa para filtrar (activo: 1) | `app.js:2391-2392` |
| `factElectronicaConXB` | integer | ❌ NO | - | No se usa | - |
| `ID` | integer | ⚠️ **Fallback** | - | Solo como fallback si no existe `puntoVentaId` | `app.js:2548` |
| `id` | integer | ⚠️ **Fallback** | - | Solo como fallback si no existe `puntoVentaId` | `app.js:2548` |

## Flujo Completo

### 1. **Obtención de la API** (`GET /puntoVentaBean`)
```json
{
  "puntoVentaId": 212819,
  "nombre": "Punto de Venta Principal",
  "codigo": "PV001",
  "puntoVenta": "00004",
  "editable": true,
  "sugerido": true,
  "editableSugerido": true,
  "activo": 1,
  "modoNumeracion": "editablesugerido",
  "circuitoContable": {...},
  "factElectronicaConXB": 0
}
```

### 2. **Validación y Filtrado** (en código)
- ✅ Filtra solo puntos con `activo: 1`
- ✅ Valida que tenga `editable: true` Y `sugerido: true` (o `editableSugerido: true`)
- ✅ Usa `puntoVentaId` (o fallback a `ID`/`id`) como identificador principal

### 3. **Mapeo a Payload** (`obtenerPuntoVentaPorDefecto()`)
```javascript
// Código en app.js:2550-2555
return {
  ID: puntoVentaId,        // puntoVentaId → ID
  id: puntoVentaId,        // puntoVentaId → id (mismo valor)
  nombre: pv.nombre,       // nombre → nombre (directo)
  codigo: pv.codigo        // codigo → codigo (directo)
};
```

### 4. **Payload Final en Factura** (`POST /comprobanteVentaBean`)
```json
{
  "puntoVenta": {
    "ID": 212819,
    "id": 212819,
    "nombre": "Punto de Venta Principal",
    "codigo": "PV001"
  },
  // ... otros campos de la factura
}
```

## Resumen de Transformaciones

| Origen | Destino | Regla |
|--------|---------|-------|
| `puntoVentaId` | `ID` | Copia directa del valor |
| `puntoVentaId` | `id` | Copia directa del mismo valor (igual que ID) |
| `nombre` | `nombre` | Sin transformación |
| `codigo` | `codigo` | Sin transformación |

## Campos que NO se envían

Los siguientes campos se usan solo para validación/filtrado pero **NO se incluyen en el payload**:

- `puntoVenta` - Solo se usa para buscar/filtrar puntos específicos
- `editable` - Solo para validación
- `sugerido` - Solo para validación  
- `editableSugerido` - Solo para validación
- `activo` - Solo para filtrar resultados iniciales
- `modoNumeracion` - No se usa
- `circuitoContable` - No se usa
- `factElectronicaConXB` - No se usa

## Código de Referencia

**Función principal de mapeo:** `obtenerPuntoVentaPorDefecto()` en `app.js:2543-2607`

**Uso en payload de factura:** `flujoCompletoFactura()` en `app.js:1239`

---

**Última actualización:** 2025-01-19