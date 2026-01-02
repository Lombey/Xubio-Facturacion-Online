# ADR-004: Decisión de usar JSDoc + TypeScript checkJs para tipos en archivos .vue

## Estado
Aceptado

## Fecha
2024-12-30

## Contexto

El proyecto tiene varios componentes Vue (`.vue`) que se importan en archivos JavaScript:
- `App.vue`
- `ClienteSelector.vue`
- `ProductoSelector.vue`
- `BaseSelector.vue`

**Problema identificado:**
- TypeScript con `checkJs: true` no reconocía tipos en componentes `.vue`
- Al importar componentes, TypeScript solo sabía que eran "cualquier componente Vue" (`DefineComponent<{}, {}, any>`)
- No había type safety para props, eventos, ni métodos de componentes
- 95 errores de type checking relacionados con tipos implícitos

**Contexto técnico:**
- Proyecto usa Vue 3 con Vite
- Stack actual: JavaScript + JSDoc (no TypeScript completo)
- Ya se implementó JSDoc extensivamente en utils, composables, etc.
- `checkJs: true` en `tsconfig.json` funcionando correctamente
- Pre-commit hooks configurados con `npm run check` (lint + type-check)

## Decisión

**Implementar Opción 4 (Híbrida): JSDoc + Declaraciones Mejoradas con separación de responsabilidades**

### Arquitectura Implementada

1. **`test-imprimir-pdf/assets/types/models.d.ts`**
   - Tipos de dominio centralizados (Cliente, Producto, PuntoVenta)
   - Tipos raw de API (ClienteRaw, ProductoRaw, PuntoVentaRaw)
   - Separación clara de responsabilidades

2. **`test-imprimir-pdf/assets/vue-global.d.ts`**
   - Solo contiene el "shim" de Vue para archivos `.vue`
   - Sin tipos de dominio (arquitectura limpia)
   - Declaración genérica permisiva: `DefineComponent<Record<string, any>, Record<string, any>, any>`

3. **JSDoc en Componentes Vue**
   - Tipos importados desde `models.d.ts` usando `@typedef`
   - Props tipadas con `PropType` de Vue
   - Métodos documentados con tipos específicos

### Ejemplo de Implementación

```vue
<script>
/**
 * @typedef {import('../types/models').Cliente} Cliente
 * @typedef {import('../types/models').ClienteRaw} ClienteRaw
 */

export default {
  name: 'ClienteSelector',
  props: {
    /** @type {import('vue').PropType<(Cliente | ClienteRaw)[]>} */
    clientes: { type: Array, required: true }
  },
  methods: {
    /**
     * @param {Cliente | ClienteRaw} cliente
     * @returns {string}
     */
    getClienteLabel(cliente) {
      return cliente.razonSocial || cliente.nombre || 'Sin nombre';
    }
  }
};
</script>
```

## Opciones Consideradas

### Opción 1: Declaración Básica Mejorada

**Descripción:** Mejorar solo `vue-global.d.ts` con tipos más específicos pero genéricos.

**Pros:**
- ✅ Muy simple, mínimo esfuerzo
- ✅ No requiere cambios en componentes
- ✅ Compatible con stack actual

**Contras:**
- ❌ No hay tipos específicos por componente
- ❌ Props/events siguen siendo `any`
- ❌ No mejora type safety real

**Evaluación:** ❌ Rechazada - No resuelve el problema de type safety

### Opción 2: Tipos Específicos por Componente

**Descripción:** Crear interfaces TypeScript específicas para cada componente (props, emits, etc.).

**Pros:**
- ✅ Type safety completo
- ✅ Autocompletado perfecto
- ✅ Validación de props en tiempo de compilación

**Contras:**
- ❌ Alto esfuerzo: requiere definir tipos para cada componente
- ❌ Mantenimiento alto: cambios en componentes requieren actualizar tipos
- ❌ Overhead para proyecto de tamaño medio

**Evaluación:** ❌ Rechazada - Overhead desproporcionado para el tamaño del proyecto

### Opción 3: Migrar a TypeScript completo con `<script setup lang="ts">`

**Descripción:** Migrar componentes a TypeScript usando `<script setup lang="ts">`.

**Pros:**
- ✅ Tipos automáticos e inferencia completa
- ✅ Mejor integración con Vite
- ✅ Menos boilerplate que Options API

**Contras:**
- ❌ Requiere migrar todos los componentes
- ❌ Cambio de paradigma (Options API → Composition API)
- ❌ Riesgo de breaking changes
- ❌ Esfuerzo alto (~15-20 horas)

**Evaluación:** ❌ Rechazada - Requiere migración completa, no es incremental

### Opción 4: Híbrida - JSDoc + Declaraciones Mejoradas (ELEGIDA)

**Descripción:** 
- Mejorar `vue-global.d.ts` con shim genérico
- Crear `types/models.d.ts` para tipos de dominio
- Agregar JSDoc a componentes cuando sea necesario
- Usar `PropType` de Vue para props tipadas

**Pros:**
- ✅ Compatible con stack actual (JS + JSDoc)
- ✅ No requiere migración
- ✅ Mejora gradual e incremental
- ✅ Funciona perfectamente con `checkJs: true`
- ✅ Separación de responsabilidades (tipos de dominio separados)
- ✅ Arquitectura escalable
- ✅ Bajo esfuerzo (~2-3 horas)

**Contras:**
- ⚠️ Type safety parcial (mejor que nada, pero no completo)
- ⚠️ Requiere agregar JSDoc manualmente a componentes

**Evaluación:** ✅ **ELEGIDA** - Mejor balance esfuerzo/beneficio

## Consecuencias

### Positivas

1. **Type Safety Mejorado**
   - TypeScript ahora valida tipos en componentes Vue
   - Props documentadas con tipos específicos
   - Métodos con tipos de parámetros y retorno

2. **Arquitectura Limpia**
   - Separación de responsabilidades: `vue-global.d.ts` solo para shim, `models.d.ts` para dominio
   - Fácil de mantener y escalar
   - Tipos de dominio centralizados y reutilizables

3. **Compatibilidad**
   - No rompe código existente
   - Funciona con pre-commit hooks
   - Compatible con build actual (Vite)

4. **Documentación Mejorada**
   - JSDoc en componentes mejora autocompletado en IDEs
   - Tipos explícitos facilitan mantenimiento
   - Nuevos desarrolladores entienden mejor el código

5. **Incremental**
   - Puedes agregar JSDoc a componentes gradualmente
   - No requiere cambiar todo de una vez
   - Permite migrar a TypeScript completo más adelante si es necesario

### Negativas

1. **Type Safety Parcial**
   - No es tan estricto como TypeScript completo
   - Algunos errores de tipo pueden pasar desapercibidos
   - Props aún pueden ser `any` si no se documentan

2. **Mantenimiento Manual**
   - Requiere agregar JSDoc a nuevos componentes
   - Tipos deben mantenerse sincronizados con código
   - Puede olvidarse documentar algunos componentes

3. **Overhead de Documentación**
   - Más líneas de código (JSDoc)
   - Requiere disciplina del equipo para mantener

### Neutrales

1. **Rendimiento**
   - No afecta bundle size (JSDoc se elimina en build)
   - No afecta runtime performance

2. **Build Time**
   - Type checking agrega ~1-2 segundos al build
   - Aceptable para el beneficio obtenido

## Implementación

### Archivos Creados/Modificados

1. **Creado:** `test-imprimir-pdf/assets/types/models.d.ts`
   - Tipos de dominio: `Cliente`, `Producto`, `PuntoVenta`
   - Tipos raw: `ClienteRaw`, `ProductoRaw`, `PuntoVentaRaw`

2. **Modificado:** `test-imprimir-pdf/assets/vue-global.d.ts`
   - Limpiado: solo shim de Vue
   - Comentario explicando separación de responsabilidades

3. **Modificado:** `test-imprimir-pdf/assets/components/ClienteSelector.vue`
   - JSDoc agregado con tipos de `models.d.ts`
   - Props tipadas con `PropType`

4. **Modificado:** `test-imprimir-pdf/assets/components/ProductoSelector.vue`
   - JSDoc agregado con tipos de `models.d.ts`
   - Props tipadas con `PropType`

### Verificación

- ✅ `npm run type:check` pasa sin errores (0 errores, antes: 95)
- ✅ `npm run lint` pasa sin errores
- ✅ `npm run check` (lint + type-check) funciona correctamente
- ✅ Pre-commit hooks funcionan correctamente

## Referencias

- [Documentación completa: TIPOS_VUE_EXPLICACION.md](../TIPOS_VUE_EXPLICACION.md)
- [Vue 3 TypeScript Support](https://vuejs.org/guide/typescript/overview.html)
- [JSDoc Type Checking](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Vue PropType](https://vuejs.org/api/utility-types.html#proptype-t)

## Notas Adicionales

### Cuándo Migrar a TypeScript Completo

Considerar migración completa a TypeScript si:
- El proyecto crece significativamente (>50 componentes)
- El equipo se expande y necesita tipos más estrictos
- Se requiere integración con librerías que requieren TypeScript
- Se realiza un refactoring mayor que justifique la migración

### Mantenimiento

- Agregar JSDoc a nuevos componentes Vue siguiendo el patrón establecido
- Mantener `models.d.ts` actualizado cuando cambien los modelos de dominio
- Revisar tipos periódicamente para asegurar consistencia

### Patrón para Nuevos Componentes

```vue
<script>
/**
 * @typedef {import('../types/models').Cliente} Cliente
 */

export default {
  props: {
    /** @type {import('vue').PropType<Cliente[]>} */
    items: { type: Array, required: true }
  }
};
</script>
```
