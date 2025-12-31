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
│   ├── usePuntosDeVenta.js (NUEVO - Singleton State)
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
    ├── validators.js (NUEVO - Pura, Testeable)
    ├── transformers.js (NUEVO - Pura, Testeable)
    └── constants.js (NUEVO - constantes compartidas)
```

---

## 🛠️ Mejoras Técnicas Transversales (Recomendaciones Senior)

1.  **Testing Unitario Inmediato**: Las funciones puras en `utils/` (validadores, transformadores) deben tener tests (`.test.js`) creados en el mismo momento de su implementación. Aprovechar `vitest`.
2.  **JSDoc Estricto**: Dado que es JavaScript, es obligatorio usar JSDoc (`@typedef`, `@param`, `@returns`) para mantener el tipado y facilitar el autocompletado en el IDE.
3.  **Patrón Singleton en Composables**: Para datos maestros (Puntos de Venta, Listas de Precios), los Composables deben gestionar un estado global (variables fuera de la función exportada) para evitar llamadas redundantes a la API si múltiples componentes los usan.
4.  **Integración Temprana del Service Layer**: No esperar al final. Implementar los métodos necesarios en `services/xubioApi.js` a medida que se crean los Composables (ej. Fase 4).

---

## 📝 Plan de Implementación

### Fase 0: Preparación (sin romper nada)
**Objetivo**: Crear estructura y configurar entorno de pruebas.

- [ ] Crear carpeta `services/`
- [ ] Crear estructura de archivos vacíos en `composables/` y `utils/`
- [ ] Crear `services/xubioApi.js` (esqueleto inicial)
- [ ] Verificar configuración de `vitest` para correr tests en `utils/`

**Validación thin slice**:
- [ ] `npm run dev` funciona sin errores
- [ ] `npm run test` (o comando equivalente) corre y detecta archivos de prueba

---

### Fase 1: Extraer Constantes
**Objetivo**: Eliminar magic numbers/strings

**Archivo**: `utils/constants.js`

**Mover a constants.js**:
```javascript
// Estados, Tipos de Comprobante, Modos de Numeración, etc.
```

**Cambios en app.js**:
- Importar constantes
- Reemplazar valores hardcodeados por constantes

**Validación thin slice**:
- [ ] Aplicación compila y funciona idénticamente

---

### Fase 2: Extraer Validadores Puros + Tests
**Objetivo**: Funciones puras con alta cobertura de pruebas.

**Archivo**: `utils/validators.js`
**Tests**: `utils/__tests__/validators.test.js`

**Tareas**:
1. Extraer `esPuntoVentaValido`, `esClienteValido`, `esProductoValido`.
2. **Crear Tests Unitarios** cubriendo casos de borde (null, undefined, objetos vacíos).
3. Reemplazar lógica inline en `app.js` por llamadas a `validators.js`.

**Validación thin slice**:
- [ ] Tests unitarios pasan (Green)
- [ ] Validación de punto de venta en UI funciona igual

---

### Fase 3: Extraer Transformadores + Tests + JSDoc
**Objetivo**: Normalización de datos con tipado claro.

**Archivo**: `utils/transformers.js`
**Tests**: `utils/__tests__/transformers.test.js`

**Tareas**:
1. Definir tipos con JSDoc (`@typedef {Object} PuntoVenta`).
2. Implementar `normalizarPuntoVenta`, `normalizarCliente`.
3. **Crear Tests Unitarios** verificando la estructura de salida.
4. Aplicar en `app.js` al recibir datos de API.

**Validación thin slice**:
- [ ] Selectores muestran datos correctamente
- [ ] Tests unitarios pasan

---

### Fase 4: Composable de Puntos de Venta (Con Service Layer)
**Objetivo**: Centralizar lógica de PV usando estado compartido y servicio API.

**Archivo**: `composables/usePuntosDeVenta.js`
**Archivo**: `services/xubioApi.js` (Agregar método `getPuntosVenta`)

**Estructura Singleton (Ejemplo)**:
```javascript
// Estado global (fuera de la función)
const puntosDeVenta = ref([]);
const initialized = ref(false);

export function usePuntosDeVenta() {
  // ... lógica ...
  async function cargar() {
    if (initialized.value) return; // Evitar re-fetch
    // llamar a xubioApi.getPuntosVenta()
  }
  return { ... }
}
```

**Tareas**:
1. Implementar `getPuntosVenta` en `services/xubioApi.js`.
2. Crear `usePuntosDeVenta.js` con patrón Singleton para el estado.
3. Integrar validadores y filtros existentes.
4. Refactorizar `app.js` para usar este composable.

**Reducción estimada**: ~200-300 líneas

**Validación thin slice**:
- [ ] Selector de punto de venta funciona
- [ ] Validación por defecto funciona
- [ ] No se duplican llamadas a la API al navegar

---

### Fase 5: Composable de Facturas
**Objetivo**: Centralizar lógica de creación de facturas

**Archivo**: `composables/useFacturas.js`

**Responsabilidades**:
- Estado de factura (borrador, procesando, completada)
- Validación de factura completa
- Flujo de creación (con/sin autorización CAE)
- Generación de PDF

**Validación thin slice**:
- [ ] Crear factura funciona
- [ ] Generar PDF funciona

---

### Fase 6: Composable de Cobranzas
**Objetivo**: Separar lógica de cobranzas/pagos

**Archivo**: `composables/useCobranzas.js`

**Reducción estimada**: ~200-300 líneas

---

### Fase 7: Composable de Diagnóstico
**Objetivo**: Mover código de debug fuera de app.js

**Archivo**: `composables/useDiagnostico.js`

**Reducción estimada**: ~150-200 líneas

---

### Fase 8: Consolidación Service API
**Objetivo**: Migrar el resto de llamadas sueltas al servicio centralizado.

**Archivo**: `services/xubioApi.js`

**Tareas**:
- Mover llamadas restantes (`crearFactura`, `obtenerPDF`, `crearCobranza`) de `app.js` o composables temporales a `xubioApi.js`.
- Asegurar manejo de errores consistente.

---

## 🎯 Resultado Final Esperado

### Antes
- **app.js**: ~3000 líneas
- **Responsabilidades**: TODO mezclado
- **Duplicación**: Masiva
- **Testabilidad**: Nula

### Después
- **app.js**: ~600-800 líneas (solo orquestación UI)
- **utils/**: 100% Cobertura de Tests
- **composables/**: Gestión de estado eficiente (Singletons)
- **services/**: Capa de abstracción de API limpia
- **JSDoc**: Tipado documentado en archivos críticos

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos
1. **Regresiones en lógica de negocio**: Al mover validaciones complejas.
2. **Estado desincronizado**: Al mover datos a composables.

### Mitigaciones
1. **Tests Automáticos**: Los tests en Fases 2 y 3 son la red de seguridad principal.
2. **Validación Manual Cruzada**: Verificar contra la versión anterior en cada paso.
3. **Commits Atómicos**: Un commit por cambio funcional pequeño.

---

## 🚀 Cómo Empezar

1. Crear branch: `git checkout -b refactor/app-js-fase-0`
2. Ejecutar Fase 0 (preparación y setup de tests)
3. Validar entorno de pruebas
4. Continuar con Fase 1

---

**Última actualización**: 2025-12-30
**Estado**: Plan Aprobado y Mejorado
**Estrategia**: Incremental con Testing Obligatorio