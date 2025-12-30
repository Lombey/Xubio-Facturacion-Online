# ADR-002: Decisión de usar Vite como build tool y estructura modular

## Estado
Aceptado

## Contexto
El proyecto actual:
- Usa Vue 3 desde CDN (unpkg) sin build process
- Tiene un archivo monolítico `app.js` de ~2600 líneas
- No tiene optimizaciones de bundle (tree-shaking, minificación)
- No tiene code splitting
- Bundle size: ~140KB sin optimizar

Necesitamos:
- Reducir bundle size
- Mejorar mantenibilidad del código
- Agregar build process sin cambiar framework
- Mantener compatibilidad con Vercel

## Decisión
Usar **Vite** como build tool y adoptar **estructura modular** con:
1. **Vite 5.0.0** para build process y optimizaciones
2. **Estructura modular** separando utilidades, composables y componentes
3. **Alias de imports** para mejor organización
4. **Code splitting manual** con lazy loading

## Opciones Consideradas

### Opción 1: Vite (ELEGIDA)
**Pros:**
- ⚡ **Rápido:** HMR instantáneo, build < 5 segundos
- 🎯 **Simple:** Configuración mínima, funciona out-of-the-box
- 📦 **Optimizado:** Tree-shaking automático, minificación con Terser
- 🔌 **Plugin Vue oficial:** @vitejs/plugin-vue bien mantenido
- ✅ **Compatible con Vercel:** Funciona perfectamente con serverless functions
- 📈 **Escalable:** Fácil agregar más optimizaciones después

**Contras:**
- Requiere configuración inicial (~2-3 horas)
- No tiene optimizaciones automáticas de Next.js (imágenes, fonts)

**Evaluación:** ✅ Aceptada - Mejor balance para este proyecto

### Opción 2: Webpack
**Pros:**
- Maduro y estable
- Muchos plugins disponibles
- Configuración flexible

**Contras:**
- ❌ **Lento:** Build time > 30 segundos
- ❌ **Complejo:** Configuración verbosa
- ❌ **Overkill:** Demasiado para este proyecto pequeño

**Evaluación:** ❌ Rechazada - Demasiado complejo y lento

### Opción 3: Rollup
**Pros:**
- Buen tree-shaking
- Configuración simple
- Popular para librerías

**Contras:**
- ❌ **No HMR nativo:** Requiere plugins adicionales
- ❌ **Menos popular:** Menos recursos y ejemplos
- ❌ **Enfocado en librerías:** No optimizado para apps

**Evaluación:** ❌ Rechazada - Vite es mejor para aplicaciones

### Opción 4: Parcel
**Pros:**
- Zero-config
- Rápido

**Contras:**
- ❌ **Menos control:** Configuración limitada
- ❌ **Menos popular:** Menos recursos
- ❌ **Problemas con Vue:** Soporte menos maduro

**Evaluación:** ❌ Rechazada - Vite tiene mejor soporte para Vue

## Estructura Modular Decidida

```
test-imprimir-pdf/
├── assets/
│   ├── app.js                    # Main Vue app (reducido)
│   ├── components/               # Componentes Vue reutilizables
│   │   ├── ProductoSelector.vue
│   │   └── ClienteSelector.vue
│   ├── composables/              # Composables Vue (lógica reutilizable)
│   │   ├── useAuth.js
│   │   └── useXubio.js
│   └── utils/                    # Utilidades puras (sin dependencias Vue)
│       ├── cache.js
│       └── formatters.js
├── index.html
└── vite.config.js
```

### Principios de Organización

1. **`utils/`** - Funciones puras, sin dependencias de Vue
   - Ejemplo: `formatters.js`, `cache.js`
   - Reutilizables en cualquier contexto

2. **`composables/`** - Lógica reutilizable con estado de Vue
   - Ejemplo: `useAuth.js`, `useXubio.js`
   - Siguen el patrón Composition API de Vue 3

3. **`components/`** - Componentes Vue reutilizables
   - Ejemplo: `ProductoSelector.vue`, `ClienteSelector.vue`
   - Props, emits, scoped styles

## Configuración de Vite

### `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.log para debugging
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'test-imprimir-pdf/assets'),
      '@utils': resolve(__dirname, 'test-imprimir-pdf/assets/utils'),
      '@composables': resolve(__dirname, 'test-imprimir-pdf/assets/composables')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

### Decisiones de Configuración

1. **`minify: 'terser'`** - Mejor compresión que esbuild
2. **`drop_console: false`** - Mantener logs para debugging en producción
3. **Alias de imports** - Mejor DX: `@utils/cache` vs `../../utils/cache`
4. **`chunkSizeWarningLimit: 1000`** - Avisar si chunks > 1MB

## Consecuencias

### Positivas
1. **Bundle size reducido:** ~140KB → ~85KB (-40%) con tree-shaking
2. **Build time rápido:** < 5 segundos
3. **HMR instantáneo:** Cambios se reflejan inmediatamente
4. **Código más mantenible:** Estructura modular clara
5. **Fácil de extender:** Agregar nuevos módulos es trivial
6. **Compatible con Vercel:** Build output funciona directamente

### Negativas
1. **Requiere Node.js:** Necesario para build (no problema, ya se usa)
2. **Configuración inicial:** ~2-3 horas de setup
3. **Dependencias adicionales:** `vite`, `@vitejs/plugin-vue`, `terser`

### Neutrales
1. **No cambia runtime:** Vue 3 sigue siendo Vue 3
2. **Puede migrar a Next.js después:** Estructura modular facilita migración

## Alternativas Futuras

Si el proyecto crece significativamente:
- **Nuxt.js:** Framework Vue-first con SSR/SSG
- **Next.js:** Si se necesita React o optimizaciones avanzadas
- **SvelteKit:** Si se cambia de framework

La estructura modular actual facilita cualquier migración.

## Métricas de Éxito

### Build Performance
- **Build time:** < 5 segundos (vs ~30s con Webpack)
- **HMR:** < 100ms (vs ~1s con Webpack)
- **Bundle size:** -40% con tree-shaking

### Código
- **Líneas en app.js:** 2600 → ~1200 (-54%)
- **Módulos reutilizables:** 0 → 4+
- **Componentes:** 0 → 2+

## Referencias
- [Vite Documentation](https://vitejs.dev/)
- [Vite Vue Plugin](https://github.com/vitejs/vite-plugin-vue)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Plan de Refactor](./PLAN_REFACTOR_OPTIMIZACION.md)

## Fecha
2024-12-19

## Autores
- Análisis: Web Platform Engineer Senior
- Decisión: Equipo de desarrollo

