# Explicación: Tipos para Archivos .vue en Vue.js

## Contexto Actual

Tu proyecto ya tiene:
- ✅ `@vitejs/plugin-vue` instalado y configurado
- ✅ Una declaración básica en `vue-global.d.ts`:
  ```typescript
  declare module '*.vue' {
    import { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  }
```

## El Problema

Cuando importas un componente `.vue`:
```javascript
import App from './App.vue';
import ClienteSelector from './components/ClienteSelector.vue';
```

TypeScript no sabe:
- ❌ Qué props acepta el componente
- ❌ Qué eventos emite
- ❌ Qué slots expone
- ❌ Qué métodos/data tiene disponible

Solo sabe que es "cualquier componente Vue" (`DefineComponent<{}, {}, any>`).

## Opciones de Solución

### Opción 1: Declaración Básica Mejorada (Actual - Mejorada)

**Ventajas:**
- ✅ Simple, no requiere cambios en build
- ✅ Funciona con JSDoc
- ✅ Compatible con tu stack actual

**Limitaciones:**
- ⚠️ No hay tipos específicos por componente
- ⚠️ Props/events son `any`

**Implementación:**
```typescript
// vue-global.d.ts (mejorado)
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<
    Record<string, any>,  // Props (más específico que {})
    Record<string, any>,  // Emits
    any                    // Data/Setup return
  >;
  export default component;
}
```

### Opción 2: Tipos Específicos por Componente (Recomendado para Proyectos Grandes)

**Ventajas:**
- ✅ Tipos específicos para cada componente
- ✅ Autocompletado completo de props
- ✅ Validación de props en tiempo de compilación

**Desventajas:**
- ⚠️ Requiere definir tipos para cada componente
- ⚠️ Más mantenimiento

**Implementación:**

1. **Crear tipos para cada componente:**
```typescript
// types/components.d.ts
import { DefineComponent } from 'vue';

export interface ClienteSelectorProps {
  clientes: Cliente[];
  selectedItems?: Cliente[];
  // ... otras props
}

export interface ClienteSelectorEmits {
  'select-item': [cliente: Cliente];
  'update:selected': [items: Cliente[]];
}

export type ClienteSelectorComponent = DefineComponent<
  ClienteSelectorProps,
  ClienteSelectorEmits
>;
```

2. **Usar en el componente:**
```vue
<!-- ClienteSelector.vue -->
<script setup lang="ts">
import type { ClienteSelectorProps, ClienteSelectorEmits } from '@/types/components';

// Con <script setup>, los tipos se infieren automáticamente
defineProps<ClienteSelectorProps>();
defineEmits<ClienteSelectorEmits>();
</script>
```

3. **O con Options API:**
```vue
<script>
export default {
  name: 'ClienteSelector',
  props: {
    clientes: { type: Array, required: true }
  },
  emits: ['select-item']
} satisfies ClienteSelectorComponent;
</script>
```

### Opción 3: Usar `@vitejs/plugin-vue` con `script setup` y TypeScript

**Ventajas:**
- ✅ Tipos automáticos con `<script setup lang="ts">`
- ✅ Mejor integración con Vite
- ✅ Menos código boilerplate

**Desventajas:**
- ⚠️ Requiere migrar componentes a `<script setup>`
- ⚠️ Requiere renombrar archivos a `.ts` o usar `lang="ts"`

**Implementación:**

1. **Instalar dependencias adicionales:**
```bash
npm install --save-dev @vue/tsconfig
```

2. **Actualizar `tsconfig.json`:**
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "types": ["vite/client"]
  },
  "include": [
    "test-imprimir-pdf/**/*.ts",
    "test-imprimir-pdf/**/*.tsx",
    "test-imprimir-pdf/**/*.vue"
  ]
}
```

3. **Usar en componentes:**
```vue
<script setup lang="ts">
// TypeScript infiere tipos automáticamente
import { ref } from 'vue';

interface Props {
  clientes: Cliente[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'select-item': [cliente: Cliente];
}>();

// Todo está tipado automáticamente
const selected = ref<Cliente | null>(null);
</script>
```

### Opción 4: Híbrida - JSDoc + Declaraciones Mejoradas (Recomendado para Tu Caso)

**Ventajas:**
- ✅ Compatible con tu stack actual (JS + JSDoc)
- ✅ No requiere migrar a TypeScript
- ✅ Mejora gradual sin breaking changes
- ✅ Funciona con `checkJs: true`

**Implementación:**

1. **Mejorar `vue-global.d.ts`:**
```typescript
// vue-global.d.ts
import type { DefineComponent, ComponentPublicInstance } from 'vue';

// Declaración mejorada para módulos .vue
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  
  /**
   * Componente Vue genérico con tipos mejorados
   * @template Props - Tipo de props del componente
   * @template Emits - Tipo de eventos emitidos
   * @template Exposed - Tipo de métodos/data expuestos
   */
  const component: DefineComponent<
    Record<string, any>,  // Props (puede ser más específico)
    Record<string, any>,  // Emits
    any,                  // Data/Setup return
    any,                  // Computed
    any,                  // Methods
    any,                  // Options
    any                   // Instance type
  >;
  
  export default component;
}

// Tipos auxiliares para JSDoc
export type VueComponent = ComponentPublicInstance;
export type VueProps<T = any> = T;
export type VueEmits<T = any> = T;
```

2. **Documentar componentes con JSDoc:**
```vue
<!-- ClienteSelector.vue -->
<script>
/**
 * @typedef {Object} ClienteSelectorProps
 * @property {Array<Cliente>} clientes - Lista de clientes disponibles
 * @property {Array<Cliente>} [selectedItems] - Items seleccionados
 */

/**
 * @typedef {Object} ClienteSelectorEmits
 * @property {Function} select-item - Emitido cuando se selecciona un cliente
 * @param {Cliente} cliente - Cliente seleccionado
 */

export default {
  name: 'ClienteSelector',
  props: {
    /** @type {import('./types').Cliente[]} */
    clientes: { type: Array, required: true }
  },
  emits: ['select-item']
};
</script>
```

3. **Crear archivo de tipos compartidos:**
```typescript
// types/index.d.ts
export interface Cliente {
  id: number | null;
  name: string;
  cuit: string;
  // ...
}

export interface Producto {
  id: number | null;
  name: string;
  price: number;
  // ...
}
```

## Recomendación para Tu Proyecto

Dado que:
- ✅ Ya usas JSDoc extensivamente
- ✅ Tienes `checkJs: true` funcionando
- ✅ No quieres migrar todo a TypeScript ahora
- ✅ Quieres mejoras incrementales

**Recomiendo la Opción 4 (Híbrida):**

1. **Mejorar la declaración en `vue-global.d.ts`** (ya lo hicimos parcialmente)
2. **Agregar JSDoc a componentes Vue** cuando sea necesario
3. **Crear tipos compartidos** en un archivo `.d.ts` para reutilizar

### Implementación Práctica (Arquitectura Mejorada)

**⚠️ Importante:** Separación de responsabilidades (Separation of Concerns)

No mezcles tipos de dominio en `vue-global.d.ts`. Este archivo debe ser solo para el "shim" de Vue.

#### A. Crear `test-imprimir-pdf/assets/types/models.d.ts`
(Centralizamos el dominio aquí)

```typescript
/**
 * Tipos de dominio del proyecto
 * Modelos de datos centralizados para reutilización
 */

export interface Cliente {
  id: number | null;
  name: string;
  code: string;
  cuit: string;
  metadata?: {
    original?: any;
    razonSocial?: string;
    nombre?: string;
  };
}

export interface Producto {
  id: number | null;
  name: string;
  code: string;
  price: number;
  description?: string;
}
```

#### B. Limpiar `test-imprimir-pdf/assets/vue-global.d.ts`
(Lo mantenemos puramente técnico)

```typescript
// Declaración de módulos Vue SFC
// Este archivo solo debe contener el "shim" para que TypeScript entienda archivos .vue
// Los tipos de dominio están en types/models.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  
  const component: DefineComponent<
    Record<string, any>, // Props
    Record<string, any>, // Emits
    any                  // Data/Setup return
  >;
  
  export default component;
}
```

#### C. Uso en Componentes (JSDoc)
(Importamos los tipos donde se necesitan)

```vue
<script>
/**
 * @typedef {import('../types/models').Cliente} Cliente
 * @typedef {import('../types/models').ClienteRaw} ClienteRaw
 */

export default {
  name: 'ClienteSelector',
  props: {
    /** @type {import('vue').PropType<Cliente[]>} */
    clientes: { type: Array, required: true },
    /** @type {import('vue').PropType<Cliente | null>} */
    clienteSeleccionado: { type: Object, default: null }
  },
  emits: ['select-cliente'],
  methods: {
    /**
     * Obtiene el label de un cliente
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

## Comparación de Opciones

| Opción | Complejidad | Tipos Específicos | Compatibilidad | Mantenimiento |
|--------|------------|-------------------|----------------|---------------|
| 1. Básica Mejorada | ⭐ Baja | ❌ No | ✅ Alta | ⭐ Bajo |
| 2. Tipos por Componente | ⭐⭐⭐ Alta | ✅ Sí | ⚠️ Media | ⭐⭐⭐ Alto |
| 3. Script Setup + TS | ⭐⭐ Media | ✅ Sí | ⚠️ Requiere migración | ⭐⭐ Medio |
| 4. Híbrida (JSDoc) | ⭐⭐ Media | ⚠️ Parcial | ✅ Alta | ⭐⭐ Medio |

## Conclusión

Para tu proyecto actual, la **Opción 4 (Híbrida)** es la mejor porque:
- No rompe nada existente
- Mejora gradualmente el type safety
- Compatible con tu stack actual
- Puedes migrar a TypeScript completo más adelante si lo necesitas

## ✅ Implementación Completada

La Opción 4 ha sido implementada con la arquitectura mejorada:

1. ✅ **`test-imprimir-pdf/assets/types/models.d.ts`** - Tipos de dominio centralizados
2. ✅ **`test-imprimir-pdf/assets/vue-global.d.ts`** - Solo shim de Vue (sin tipos de dominio)
3. ✅ **Componentes Vue** - JSDoc agregado a `ClienteSelector.vue` y `ProductoSelector.vue` como ejemplos
4. ✅ **Verificación** - `npm run type:check` pasa sin errores

### Estructura Final

```
test-imprimir-pdf/assets/
├── types/
│   └── models.d.ts          # Tipos de dominio (Cliente, Producto, etc.)
├── vue-global.d.ts          # Solo shim de Vue
└── components/
    ├── ClienteSelector.vue  # Con JSDoc usando tipos de models.d.ts
    └── ProductoSelector.vue  # Con JSDoc usando tipos de models.d.ts
```

### Próximos Pasos (Opcional)

Puedes agregar JSDoc a otros componentes Vue siguiendo el mismo patrón:

```vue
<script>
/**
 * @typedef {import('../types/models').Cliente} Cliente
 */

export default {
  props: {
    /** @type {import('vue').PropType<Cliente[]>} */
    clientes: { type: Array, required: true }
  }
};
</script>
```
