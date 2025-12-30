# ADR-001: Decisión de NO migrar a Next.js y optar por optimizaciones incrementales

## Estado
Aceptado

## Contexto
El proyecto actual es una aplicación Vue 3 simple que:
- Usa Vue 3 desde CDN (unpkg)
- Tiene un archivo `app.js` monolítico de ~2600 líneas
- Está desplegado en Vercel con Serverless Functions
- Tiene sistema de cache en localStorage sin límites
- Es usado por solo **3 usuarios**

Se evaluó la posibilidad de migrar a Next.js para mejorar:
- Performance (bundle size, code splitting)
- Mantenibilidad (código modular)
- Optimizaciones automáticas (imágenes, fonts)
- Mejor DX (TypeScript, hot reload)

## Decisión
**NO migrar a Next.js**. En su lugar, implementar **optimizaciones incrementales** con:
1. **Vite** como build tool (tree-shaking, minificación)
2. **Refactor modular** del código existente
3. **Sistema de cache mejorado** con límites y auto-eviction
4. **Componentes Vue reutilizables** extraídos del monolito
5. **Code splitting básico** con lazy loading

## Opciones Consideradas

### Opción 1: Migración completa a Next.js
**Pros:**
- Optimizaciones automáticas (imágenes, fonts, scripts)
- Code splitting automático
- SSR/SSG cuando sea necesario
- Mejor SEO
- Edge Functions para APIs
- Mejor DX con TypeScript

**Contras:**
- **Costo:** ~20-40 horas de desarrollo
- **ROI negativo:** Para 3 usuarios, el beneficio es prácticamente cero
- **Riesgo:** Cambio de framework completo puede introducir bugs
- **Overhead:** Complejidad adicional innecesaria para el tamaño del proyecto
- **Curva de aprendizaje:** Requiere aprender Next.js App Router

**Evaluación:** ❌ Rechazada - ROI negativo para el tamaño del proyecto

### Opción 2: Optimizaciones incrementales (ELEGIDA)
**Pros:**
- **Bajo esfuerzo:** ~10-12 horas vs 40 horas
- **Alto impacto:** ~80% de los beneficios con ~25% del esfuerzo
- **Bajo riesgo:** Cambios incrementales, cada slice es funcional por sí solo
- **Mantiene lo que funciona:** No rompe funcionalidad existente
- **Escalable:** Puede migrar a Next.js después si crece el proyecto

**Contras:**
- No tiene optimizaciones automáticas de Next.js
- Requiere configuración manual de build process
- No tiene SSR/SSG (no necesario para este caso)

**Evaluación:** ✅ Aceptada - Mejor balance costo/beneficio

### Opción 3: No hacer nada
**Pros:**
- Cero esfuerzo
- Cero riesgo

**Contras:**
- Bundle size grande (~140KB)
- Código difícil de mantener (2600 líneas en un archivo)
- Cache sin límites puede llenar localStorage
- Sin optimizaciones

**Evaluación:** ❌ Rechazada - Problemas de mantenibilidad a largo plazo

## Consecuencias

### Positivas
1. **Bundle size reducido:** ~140KB → ~85KB (-40%) con Vite
2. **Código más mantenible:** Archivo principal de 2600 → ~1200 líneas (-54%)
3. **Cache robusto:** Límite de 10MB + auto-eviction previene problemas
4. **Componentes reutilizables:** Selector de productos/clientes extraídos
5. **Build process:** Hot reload, tree-shaking, minificación automática
6. **Bajo riesgo:** Cada cambio es incremental y testeable

### Negativas
1. **No tiene optimizaciones automáticas de Next.js:** Imágenes, fonts requieren configuración manual
2. **No tiene SSR/SSG:** No necesario para este caso de uso
3. **Requiere mantenimiento manual:** Build process, configuración de Vite

### Neutrales
1. **Puede migrar a Next.js después:** Si el proyecto crece, la estructura modular facilita la migración
2. **TypeScript:** Se mantiene configurado pero no se usa completamente (solo JSDoc)

## Stack Tecnológico Final

### Frontend
- **Framework:** Vue 3.4.21 (sin cambios)
- **Build Tool:** Vite 5.0.0 (nuevo)
- **Plugin:** @vitejs/plugin-vue 5.0.0
- **Minificación:** Terser 5.24.0

### Estructura de Código
```
test-imprimir-pdf/
├── assets/
│   ├── app.js                    # Main (reducido de 2600 → ~1200 líneas)
│   ├── components/               # Componentes Vue reutilizables
│   │   ├── ProductoSelector.vue
│   │   └── ClienteSelector.vue
│   ├── composables/              # Lógica reutilizable
│   │   ├── useAuth.js
│   │   └── useXubio.js
│   └── utils/                    # Utilidades
│       ├── cache.js              # Sistema de cache mejorado
│       └── formatters.js         # Funciones de formateo
├── index.html
└── vite.config.js                # Configuración de Vite
```

### Backend (sin cambios)
- **Plataforma:** Vercel Serverless Functions
- **APIs:**
  - `/api/auth` - Autenticación
  - `/api/proxy` - Proxy a Xubio
- **Integraciones externas:**
  - **DolarAPI.com** - Cotizaciones del dólar (consumida directamente desde el frontend)

## Métricas de Éxito

### Antes
- Bundle: ~140KB
- Archivo app.js: 2600 líneas
- Cache: Sin límites
- Componentes: 0 reutilizables
- Build process: Ninguno

### Después (Fase 1 completa)
- Bundle: ~85KB (-40%)
- Archivo app.js: ~2000 líneas (-23%)
- Cache: 10MB límite + auto-eviction
- Utilidades: 2 módulos reutilizables
- Build time: < 5 segundos

### Después (Todas las fases)
- Bundle: ~60KB inicial + lazy loading
- Archivo app.js: ~1200 líneas (-54%)
- Cache: Sistema robusto con estadísticas
- Componentes: 2+ reutilizables
- Code splitting: Lazy loading implementado

## Plan de Implementación

Ver `PLAN_REFACTOR_OPTIMIZACION.md` para detalles de implementación con thin slices.

**Fases:**
1. **Fase 1:** Setup y utilidades base (4-6h) - ✅ Prioridad alta
2. **Fase 2:** Cliente API y composables (3-4h) - ⚠️ Opcional
3. **Fase 3:** Componentes reutilizables (4-5h) - ⚠️ Opcional
4. **Fase 4:** Code splitting (2-3h) - ⚠️ Opcional

## Notas Adicionales

### ¿Cuándo reconsiderar Next.js?
- Si el proyecto crece a **>10 usuarios activos**
- Si se necesita **SSR/SSG** para SEO
- Si se requiere **optimización automática de imágenes** a gran escala
- Si el equipo crece y necesita **mejor DX** con TypeScript estricto

### Alternativas Futuras
Si el proyecto crece, la estructura modular actual facilita:
- Migración a Next.js (componentes Vue son compatibles)
- Migración a Nuxt.js (alternativa Vue-first)
- Migración a SvelteKit (si se cambia de framework)

## Referencias
- [Plan de Refactor y Optimización](./PLAN_REFACTOR_OPTIMIZACION.md)
- [Análisis del Repositorio](./cerrados/cerrado-ANALISIS_CODIGO.md)
- [Vite Documentation](https://vitejs.dev/)
- [Vue 3 Documentation](https://vuejs.org/)

## Fecha
2024-12-19

## Autores
- Análisis: Web Platform Engineer Senior
- Decisión: Equipo de desarrollo

