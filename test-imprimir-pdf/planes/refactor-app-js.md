# Plan de Refactorización: app.js

**Fecha**: 2025-12-30
**Archivo objetivo**: `test-imprimir-pdf/assets/app.js`
**Líneas actuales**: ~3000 líneas
**Problema principal**: Código duplicado, responsabilidades mezcladas, archivo demasiado grande

---

## 📋 Diagnóstico

### Problemas Identificados

1. **Tamaño excesivo**: 3000+ líneas en un solo archivo
2. **Duplicación masiva**: Lógica de validación repetida 4+ veces
3. **Responsabilidades mezcladas**:
   - UI/UX (refs, data, modales)
   - Lógica de negocio (validaciones, cálculos)
   - API calls (integración con Xubio)
   - Formateo y transformación de datos
4. **Puntos de venta**: Validación duplicada en múltiples métodos
5. **Facturas y cobranzas**: Lógica similar sin reutilización

### Código Duplicado Detectado

**Validación de Punto de Venta** (repetida 4+ veces):
- `puntoVentaValido()` computed (línea 358-393)
- `flujoCompletoFactura()` método (línea 1298-1342)
- `soloCrearFactura()` método (línea 1672-1697)
- `seleccionarPuntoVentaPorDefecto()` método (línea 2375-2406)
- `obtenerPuntoVentaPorDefecto()` método (línea 2779-2808)

**Filtrado y búsqueda** (parcialmente refactorizado):
- Ya existe `domain-filters.js` con funciones reutilizables ✅
- Falta migrar uso en app.js a estas funciones

---

## 🎯 Arquitectura Objetivo

```
assets/
├── app.js (< 800 líneas - solo orquestación UI)
├── App.vue
│
├── composables/
│   ├── useXubio.js (ya existe) ✅
│   ├── usePuntosDeVenta.js (NUEVO)
│   ├── useFacturas.js (NUEVO)
│   ├── useCobranzas.js (NUEVO)
│   ├── useValidaciones.js (NUEVO)
│   └── useDiagnostico.js (NUEVO - código de debug)
│
├── services/
│   └── xubioApi.js (NUEVO - centralizar llamadas API)
│
└── utils/
    ├── domain-filters.js (ya existe) ✅
    ├── formatters.js (ya existe) ✅
    ├── validators.js (NUEVO)
    ├── transformers.js (NUEVO - normalización de datos)
    └── constants.js (NUEVO - constantes compartidas)
```

---

## 📝 Plan de Implementación

### Fase 0: Preparación (sin romper nada)
**Objetivo**: Crear estructura sin afectar código existente

- [ ] Crear carpeta `services/`
- [ ] Crear archivos vacíos en `composables/`:
  - `usePuntosDeVenta.js`
  - `useFacturas.js`
  - `useCobranzas.js`
  - `useValidaciones.js`
  - `useDiagnostico.js`
- [ ] Crear archivos vacíos en `utils/`:
  - `validators.js`
  - `transformers.js`
  - `constants.js`
- [ ] Crear `services/xubioApi.js`

**Validación thin slice**:
- [ ] `npm run dev` funciona sin errores
- [ ] Aplicación carga correctamente
- [ ] No hay warnings en consola

---

### Fase 1: Extraer Constantes
**Objetivo**: Eliminar magic numbers/strings

**Archivo**: `utils/constants.js`

**Mover a constants.js**:
```javascript
// Estados de factura
export const ESTADOS_FACTURA = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADA: 'completada',
  ERROR: 'error'
}

// Modos de numeración
export const MODOS_NUMERACION = {
  AUTOMATICA: 'automatica',
  MANUAL: 'manual'
}

// Estados de punto de venta
export const PUNTO_VENTA = {
  ACTIVO: 1,
  INACTIVO: 0
}

// Tipos de comprobante
export const TIPOS_COMPROBANTE = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  // ... según swagger.json
}
```

**Cambios en app.js**:
- Importar constantes
- Reemplazar valores hardcodeados por constantes

**Validación thin slice**:
- [ ] Facturas se crean correctamente
- [ ] Puntos de venta se validan correctamente
- [ ] Tests (si existen) pasan

---

### Fase 2: Extraer Validadores Puros
**Objetivo**: Funciones puras sin dependencias de Vue

**Archivo**: `utils/validators.js`

**Funciones a extraer**:
```javascript
/**
 * Valida si un punto de venta es válido según reglas de negocio
 * @param {Object} puntoVenta - Objeto punto de venta de Xubio API
 * @returns {boolean}
 */
export function esPuntoVentaValido(puntoVenta) {
  if (!puntoVenta) return false;

  const tieneId = Boolean(puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id);
  const esActivo = puntoVenta.activo === 1 || puntoVenta.activo === '1' || puntoVenta.activo === true;

  return tieneId && (puntoVenta.activo === undefined || esActivo);
}

/**
 * Valida datos mínimos de cliente para factura
 */
export function esClienteValido(cliente) {
  if (!cliente) return false;
  return Boolean(
    (cliente.name || cliente.razonSocial || cliente.nombre) &&
    (cliente.cuit || cliente.metadata?.original?.cuit)
  );
}

/**
 * Valida datos mínimos de producto/servicio
 */
export function esProductoValido(producto) {
  if (!producto) return false;
  return Boolean(
    (producto.name || producto.nombre) &&
    producto.precioUnitario !== undefined &&
    producto.cantidad > 0
  );
}
```

**Cambios en app.js**:
- Importar desde `validators.js`
- Reemplazar lógica inline por llamadas a funciones
- Eliminar computed properties duplicadas

**Ubicaciones a actualizar**:
- `puntoVentaValido()` → usar `esPuntoVentaValido()`
- `flujoCompletoFactura()` → usar `esPuntoVentaValido()`
- `soloCrearFactura()` → usar `esPuntoVentaValido()`
- `seleccionarPuntoVentaPorDefecto()` → usar `esPuntoVentaValido()`

**Validación thin slice**:
- [ ] Validación de punto de venta funciona igual
- [ ] Mensajes de error se muestran correctamente
- [ ] No hay regresiones en flujos de facturación

---

### Fase 3: Extraer Transformadores
**Objetivo**: Normalización de datos de API

**Archivo**: `utils/transformers.js`

**Funciones a crear**:
```javascript
/**
 * Normaliza punto de venta de Xubio API a formato interno
 */
export function normalizarPuntoVenta(pvRaw) {
  return {
    id: pvRaw.puntoVentaId || pvRaw.ID || pvRaw.id,
    nombre: pvRaw.nombre || '',
    codigo: pvRaw.codigo || pvRaw.puntoVenta || '',
    activo: pvRaw.activo === 1 || pvRaw.activo === '1' || pvRaw.activo === true,
    modoNumeracion: pvRaw.modoNumeracion || 'automatica',
    factElectronicaConXB: pvRaw.factElectronicaConXB || 0,
    // Mantener datos originales para debug
    _raw: pvRaw
  };
}

/**
 * Normaliza cliente de Xubio API a formato interno
 */
export function normalizarCliente(clienteRaw) {
  return {
    id: clienteRaw.clienteId || clienteRaw.ID || clienteRaw.id,
    nombre: clienteRaw.name || clienteRaw.razonSocial || clienteRaw.nombre || '',
    cuit: clienteRaw.cuit || clienteRaw.metadata?.original?.cuit || '',
    // ... más campos
    _raw: clienteRaw
  };
}
```

**Cambios**:
- Aplicar normalización al recibir datos de API
- Simplifica acceso a datos en templates y computed

**Validación thin slice**:
- [ ] Selectores muestran datos correctamente
- [ ] Búsqueda funciona igual
- [ ] Facturas usan datos normalizados correctamente

---

### Fase 4: Composable de Puntos de Venta
**Objetivo**: Centralizar toda lógica de puntos de venta

**Archivo**: `composables/usePuntosDeVenta.js`

**Responsabilidades**:
- Carga de puntos de venta desde API
- Estado reactivo (loading, error, data)
- Filtrado (reutilizar `domain-filters.js`)
- Selección de punto por defecto
- Validación (reutilizar `validators.js`)

**Estructura**:
```javascript
import { ref, computed } from 'vue';
import { filtrarPuntosDeVenta } from '../utils/domain-filters.js';
import { esPuntoVentaValido } from '../utils/validators.js';
import { normalizarPuntoVenta } from '../utils/transformers.js';

export function usePuntosDeVenta(xubioClient) {
  const puntosDeVenta = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const puntoVentaSeleccionado = ref(null);
  const busquedaPV = ref('');

  // Computed
  const puntosDeVentaFiltrados = computed(() => {
    return filtrarPuntosDeVenta(puntosDeVenta.value, busquedaPV.value);
  });

  const puntoVentaValido = computed(() => {
    return esPuntoVentaValido(puntoVentaSeleccionado.value);
  });

  // Métodos
  async function cargarPuntosDeVenta() {
    loading.value = true;
    error.value = null;
    try {
      const response = await xubioClient.getPuntosVenta();
      puntosDeVenta.value = response.map(normalizarPuntoVenta);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  function seleccionarPuntoVentaPorDefecto() {
    const puntosActivos = puntosDeVenta.value.filter(pv => pv.activo);
    if (puntosActivos.length > 0) {
      puntoVentaSeleccionado.value = puntosActivos[0];
    }
  }

  function setPuntoVenta(pv) {
    puntoVentaSeleccionado.value = pv;
  }

  return {
    // Estado
    puntosDeVenta,
    loading,
    error,
    puntoVentaSeleccionado,
    busquedaPV,

    // Computed
    puntosDeVentaFiltrados,
    puntoVentaValido,

    // Métodos
    cargarPuntosDeVenta,
    seleccionarPuntoVentaPorDefecto,
    setPuntoVenta
  };
}
```

**Cambios en app.js**:
```javascript
// Antes: cientos de líneas de lógica
// Después:
import { usePuntosDeVenta } from './composables/usePuntosDeVenta.js';

// En setup():
const {
  puntosDeVenta,
  puntoVentaSeleccionado,
  puntosDeVentaFiltrados,
  puntoVentaValido,
  cargarPuntosDeVenta,
  setPuntoVenta
} = usePuntosDeVenta(xubio);
```

**Código a eliminar de app.js**:
- `puntosDeVenta` ref
- `busquedaPV` ref
- `puntoVentaSeleccionado` ref
- `puntosDeVentaFiltrados()` computed (4+ lugares)
- `puntoVentaValido()` computed (4+ lugares)
- `cargarPuntosDeVenta()` método
- `seleccionarPuntoVentaPorDefecto()` método
- `obtenerPuntoVentaPorDefecto()` método

**Reducción estimada**: ~200-300 líneas

**Validación thin slice**:
- [ ] Selector de punto de venta funciona
- [ ] Filtro de búsqueda funciona
- [ ] Validación funciona
- [ ] Selección por defecto funciona
- [ ] No hay errores en consola

---

### Fase 5: Composable de Facturas
**Objetivo**: Centralizar lógica de creación de facturas

**Archivo**: `composables/useFacturas.js`

**Responsabilidades**:
- Estado de factura (borrador, procesando, completada)
- Validación de factura completa
- Flujo de creación (con/sin autorización CAE)
- Cálculos (subtotal, total, impuestos)
- Generación de PDF

**Estructura**:
```javascript
export function useFacturas(xubioClient, puntoVentaSeleccionado) {
  const facturaActual = ref(null);
  const estadoFactura = ref('borrador');
  const errorFactura = ref(null);

  const facturaValida = computed(() => {
    return (
      puntoVentaSeleccionado.value &&
      clienteSeleccionado.value &&
      items.value.length > 0
    );
  });

  async function crearFactura(flujoCompleto = true) {
    estadoFactura.value = 'procesando';
    try {
      if (flujoCompleto) {
        return await flujoCompletoFactura();
      } else {
        return await soloCrearFactura();
      }
    } catch (e) {
      errorFactura.value = e.message;
      estadoFactura.value = 'error';
    }
  }

  async function flujoCompletoFactura() {
    // Lógica existente consolidada
  }

  async function soloCrearFactura() {
    // Lógica existente consolidada
  }

  return {
    facturaActual,
    estadoFactura,
    facturaValida,
    crearFactura
  };
}
```

**Reducción estimada**: ~400-500 líneas

**Validación thin slice**:
- [ ] Crear factura funciona
- [ ] Autorizar CAE funciona
- [ ] Generar PDF funciona
- [ ] Errores se manejan correctamente

---

### Fase 6: Composable de Cobranzas
**Objetivo**: Separar lógica de cobranzas/pagos

**Archivo**: `composables/useCobranzas.js`

**Reducción estimada**: ~200-300 líneas

---

### Fase 7: Composable de Diagnóstico
**Objetivo**: Mover código de debug fuera de app.js

**Archivo**: `composables/useDiagnostico.js`

**Incluir**:
- `toggleDatosCrudosPV()`
- `evaluarBooleano()`
- `evaluarEditableSugeridoActual()`
- `probarCampoId()`, `probarCampoEditable()`
- `limpiarLogDiagnostico()`
- Todo el código de Section 2.7

**Reducción estimada**: ~150-200 líneas

**Nota**: Este código es temporal para debugging. Considerar eliminarlo en producción.

---

### Fase 8: Service de API
**Objetivo**: Centralizar todas las llamadas a Xubio API

**Archivo**: `services/xubioApi.js`

**Responsabilidades**:
- Wrapper de `useXubio.js`
- Manejo de errores centralizado
- Retry logic
- Logging
- Rate limiting (si es necesario)

**Estructura**:
```javascript
export class XubioApiService {
  constructor(xubioClient) {
    this.client = xubioClient;
  }

  async getPuntosVenta() {
    try {
      return await this.client.request('GET', '/api/v1/puntos-venta');
    } catch (error) {
      console.error('[XubioAPI] Error al obtener puntos de venta:', error);
      throw new Error('No se pudieron cargar los puntos de venta');
    }
  }

  async crearFactura(datosFactura) {
    // ...
  }

  // ... más métodos
}
```

**Reducción estimada**: ~100-150 líneas de lógica de API sacadas de app.js

---

## 🎯 Resultado Final Esperado

### Antes
- **app.js**: ~3000 líneas
- **Responsabilidades**: TODO mezclado
- **Duplicación**: Masiva
- **Mantenibilidad**: Baja

### Después
- **app.js**: ~600-800 líneas (solo orquestación UI)
- **composables/**: 5 archivos (~1200 líneas total)
- **services/**: 1 archivo (~200 líneas)
- **utils/**: 3 archivos nuevos (~400 líneas)
- **Duplicación**: Eliminada (DRY)
- **Mantenibilidad**: Alta
- **Testing**: Funciones puras fáciles de testear

### Beneficios
1. **Reutilización**: Lógica compartida entre componentes
2. **Testing**: Funciones puras sin dependencias de Vue
3. **Debugging**: Código más pequeño, más fácil de entender
4. **Performance**: Posibilidad de lazy loading de composables
5. **Escalabilidad**: Agregar features sin inflar app.js

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos
1. **Romper funcionalidad existente**: Refactor introduce bugs
2. **Pérdida de contexto**: Código disperso en muchos archivos
3. **Overhead**: Abstracciones innecesarias

### Mitigaciones
1. **Thin slice checklist**: Validar después de CADA fase
2. **Mantener referencias**: Comentarios indicando origen del código
3. **No sobre-abstraer**: Solo extraer código duplicado/complejo
4. **Git branches**: Una branch por fase
5. **Testing manual**: Probar flujos críticos después de cada fase

---

## 📊 Orden de Prioridad

**Alta prioridad** (hacer primero):
1. ✅ Fase 1: Constantes (bajo riesgo, alto valor)
2. ✅ Fase 2: Validadores (elimina duplicación crítica)
3. ✅ Fase 4: usePuntosDeVenta (mayor duplicación identificada)

**Media prioridad**:
4. Fase 3: Transformadores
5. Fase 5: useFacturas
6. Fase 8: xubioApi service

**Baja prioridad** (puede esperar):
7. Fase 6: useCobranzas
8. Fase 7: useDiagnostico (temporal, considerar eliminar)

---

## 🔍 Checklist de Validación (Thin Slice)

Después de **CADA** fase, validar:

- [ ] `npm run dev` arranca sin errores
- [ ] No hay warnings en consola del navegador
- [ ] No hay errores de importación
- [ ] Aplicación carga correctamente
- [ ] **Flujo crítico 1**: Seleccionar punto de venta funciona
- [ ] **Flujo crítico 2**: Crear factura funciona
- [ ] **Flujo crítico 3**: Generar PDF funciona
- [ ] **Flujo crítico 4**: Búsqueda/filtros funcionan
- [ ] Validaciones muestran mensajes correctos
- [ ] Performance no empeoró (cargas rápidas)

---

## 📝 Notas Adicionales

### Archivos a NO tocar (fuera de scope)
- `App.vue` (solo actualizar imports si es necesario)
- `components/` (usar como está)
- `useXubio.js` (wrapper de API ya funciona bien)

### Archivos ya refactorizados ✅
- `utils/domain-filters.js` (filtros de negocio)
- `utils/formatters.js` (formateo de CUIT, números, etc)

### Código a eliminar eventualmente
- Todo el código de diagnóstico (Section 2.7 en App.vue)
- Funciones de testing (`probarCampo*`, `evaluarBooleano`, etc)
- Refs temporales (`mostrarDiagnosticoPV`, `logDiagnosticoPV`, etc)

### Compatibilidad
- Mantener compatibilidad con Vue 3 Composition API
- No cambiar estructura de App.vue
- No romper selectores existentes
- Mantener mismos nombres de variables exportadas (para templates)

---

## 🚀 Cómo Empezar

1. Crear branch: `git checkout -b refactor/app-js-fase-1`
2. Ejecutar Fase 0 (preparación)
3. Validar thin slice
4. Commit: `git commit -m "Fase 0: Preparar estructura para refactoring"`
5. Continuar con Fase 1
6. Repetir validación + commit después de cada fase

---

**Última actualización**: 2025-12-30
**Estado**: Plan listo para implementación
**Estimación total**: 8 fases incrementales, validación continua
