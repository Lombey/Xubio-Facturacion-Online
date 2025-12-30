# Plan Thin Slice: Carga Consistente de Centros de Costo

## Objetivo
Implementar la carga de centros de costo de manera consistente con el patrón establecido para puntos de venta, vendedores, etc., asegurando que estén disponibles antes de crear facturas.

## Contexto Actual

### Estado Actual
- ✅ Ya existe `obtenerCentrosDeCosto()` - método interno que hace el request a la API
- ✅ Se llama en `cargarValoresConfiguracion()` 
- ❌ **NO** existe `listarCentrosDeCosto()` - método público con cache y feedback
- ❌ **NO** hay validación antes de crear factura (como se hace con punto de venta)
- ❌ **NO** hay cache para centros de costo
- ❌ **NO** hay resultado state para mensajes (`centrosDeCostoResult`)

### Patrón a Seguir
Basado en `listarPuntosDeVenta()`, el patrón incluye:
1. Método interno `obtenerXxx()` - solo hace el request
2. Método público `listarXxx(forceRefresh)` - con cache, UI feedback, mensajes
3. Cache con TTL (usando `cacheManager`)
4. Validación antes de crear factura
5. Result state para mostrar mensajes al usuario

## Plan Thin Slice (Implementación Incremental)

### 🎯 Slice 1: Método Público con Cache (Mínimo Viable)
**Objetivo**: Crear `listarCentrosDeCosto()` siguiendo el patrón establecido.

**Tareas**:
1. ✅ Añadir `centrosDeCostoResult` en `data()` (línea ~136)
2. ✅ Crear método `listarCentrosDeCosto(forceRefresh = false)` después de `listarPuntosDeVenta()`
   - Usar cache (`cacheManager.getCachedData('centrosDeCosto')`)
   - Guardar en cache con TTL de 1 hora (`cacheManager.setCachedData()`)
   - Mostrar mensajes en `centrosDeCostoResult`
   - Manejar errores y loading states
3. ✅ Actualizar `obtenerCentrosDeCosto()` para guardar en cache después de obtener datos

**Criterio de Éxito**: 
- Se puede llamar `listarCentrosDeCosto()` y funciona con cache
- Los datos se guardan y recuperan del cache correctamente

---

### 🎯 Slice 2: Validación antes de Crear Factura
**Objetivo**: Validar que haya centros de costo disponibles antes de crear factura.

**Tareas**:
1. ✅ Añadir validación en `flujoCompletoFactura()` (después de validar punto de venta, línea ~1087)
   - Verificar que `this.centrosDeCosto` no esté vacío
   - Si está vacío, intentar cargar desde cache
   - Si aún está vacío, llamar a `listarCentrosDeCosto()`
   - Mostrar error si no hay centros de costo disponibles
2. ✅ Añadir validación en `soloCrearFactura()` (línea ~1380)
   - Misma lógica que arriba

**Criterio de Éxito**:
- No se puede crear factura sin centros de costo disponibles
- Se muestra mensaje de error claro si faltan centros de costo
- Si hay cache, se usa automáticamente

---

### 🎯 Slice 3: Integración en Carga Inicial
**Objetivo**: Asegurar que centros de costo se carguen automáticamente al iniciar.

**Tareas**:
1. ✅ Añadir `listarCentrosDeCosto()` en el flujo de carga inicial (línea ~465)
   - En `cargarValoresConfiguracion()`, cambiar `obtenerCentrosDeCosto()` por `listarCentrosDeCosto()`
   - O mantener `obtenerCentrosDeCosto()` pero asegurar que use cache si está disponible

**Criterio de Éxito**:
- Centros de costo se cargan automáticamente al iniciar (si hay token)
- Se usa cache si está disponible
- No bloquea el flujo si falla

---

## Orden de Implementación Recomendado

1. **Slice 1** → Método público con cache (fundación)
2. **Slice 2** → Validación (garantiza calidad)
3. **Slice 3** → Integración (mejora UX)

## Notas Técnicas

### Cache Key
- Usar: `'centrosDeCosto'` (consistente con `'puntosDeVenta'`, etc.)

### TTL
- 1 hora (3600000 ms) - igual que puntos de venta

### Validación de Errores
- Si no hay centros de costo: mensaje claro al usuario
- No bloquear flujo completo si falla la carga (solo al crear factura)

### Consistencia con Patrón Existente
- Seguir exactamente el patrón de `listarPuntosDeVenta()`
- Mismo manejo de cache
- Misma estructura de mensajes
- Mismo manejo de loading states

## Archivos a Modificar

1. `test-imprimir-pdf/assets/app.js`
   - Añadir `centrosDeCostoResult` en `data()`
   - Crear `listarCentrosDeCosto()`
   - Actualizar `obtenerCentrosDeCosto()` para usar cache
   - Añadir validaciones en `flujoCompletoFactura()` y `soloCrearFactura()`
   - Actualizar `cargarValoresConfiguracion()` si es necesario

## Testing

### Manual
1. ✅ Verificar que `listarCentrosDeCosto()` carga desde API
2. ✅ Verificar que cache funciona (recargar página)
3. ✅ Verificar validación antes de crear factura
4. ✅ Verificar carga automática al iniciar

### Edge Cases
- ¿Qué pasa si no hay centros de costo en Xubio?
- ¿Qué pasa si falla la API pero hay cache?
- ¿Qué pasa si el cache está expirado?

## Próximos Pasos (Fuera del Scope)

- [ ] UI para listar centros de costo (sección similar a "2.6. Puntos de Venta")
- [ ] Componente selector de centro de costo (como `PuntoVentaSelector`)
- [ ] Permitir selección manual de centro de costo por factura
