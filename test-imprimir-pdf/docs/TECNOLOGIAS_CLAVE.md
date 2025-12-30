# 🛠️ Tecnologías Clave del Proyecto

**Fecha de actualización:** 2024-12-19  
**Proyecto:** Sheets con Xubio  
**Versión:** 1.0.0

---

## 📋 Resumen Ejecutivo

Este proyecto es una **aplicación web SPA (Single Page Application)** que integra con la API de Xubio para gestión de facturación y cobranzas. Utiliza un stack moderno con Vue 3, Vite, y despliegue serverless en Vercel.

**Arquitectura:** Frontend SPA + Backend Serverless (API Routes)

---

## 🎨 Frontend

### Framework Principal

| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|--------|
| **Vue.js** | `^3.4.21` | Framework frontend reactivo | ✅ Activo |
| **Vue Composition API** | 3.4.21 | Patrón de desarrollo (composables) | ✅ Activo |

**Decisión arquitectónica:** ADR-002 documenta la elección de Vue 3 sobre React/Next.js por simplicidad y velocidad de desarrollo.

### Build Tools & Bundling

| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|--------|
| **Vite** | `^5.0.0` | Build tool y dev server | ✅ Activo |
| **@vitejs/plugin-vue** | `^5.0.0` | Plugin oficial de Vue para Vite | ✅ Activo |
| **Terser** | `^5.24.0` | Minificación de código | ✅ Activo |
| **rollup-plugin-visualizer** | `^6.0.5` | Análisis de bundle size | ✅ Activo |

**Características:**
- HMR (Hot Module Replacement) instantáneo
- Tree-shaking automático
- Code splitting manual
- Build time < 5 segundos
- Bundle size optimizado: ~85KB (reducción del 40% vs versión sin build)

### Estructura Modular

```
test-imprimir-pdf/assets/
├── components/          # Componentes Vue reutilizables
│   ├── ClienteSelector.vue
│   └── ProductoSelector.vue
├── composables/        # Lógica reutilizable con estado Vue
│   ├── useAuth.js
│   └── useXubio.js
└── utils/              # Utilidades puras (sin dependencias Vue)
    ├── cache.js
    ├── debounce.js
    └── formatters.js
```

**Patrones:**
- **Composables:** Lógica de negocio reutilizable (useAuth, useXubio)
- **Componentes:** UI reutilizable (ProductoSelector, ClienteSelector)
- **Utils:** Funciones puras sin dependencias de framework

---

## 🔧 Backend / API

### Runtime & Plataforma

| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|--------|
| **Node.js** | (Runtime) | Ejecución de serverless functions | ✅ Activo |
| **Vercel Serverless Functions** | - | Hosting y ejecución de API routes | ✅ Activo |

### API Routes (Serverless Functions)

| Archivo | Endpoint | Propósito |
|---------|----------|-----------|
| `/api/auth.js` | `/api/auth` | Autenticación OAuth2 con Xubio |
| `/api/proxy.js` | `/api/proxy/*` | Proxy reverso para API de Xubio |
| `/api/bcra.js` | `/api/bcra` | Integración con API BCRA (cotizaciones) |

**Características:**
- Manejo de CORS
- Logging estructurado
- Validación de credenciales en servidor
- Proxy para evitar CORS y proteger credenciales

---

## 🔐 Seguridad & Autenticación

| Tecnología | Propósito | Estado |
|-----------|-----------|--------|
| **OAuth2 Client Credentials** | Flujo de autenticación con Xubio | ✅ Activo |
| **Basic Auth (Base64)** | Construcción de credenciales en servidor | ✅ Activo |
| **Token Management** | Cache y renovación automática de tokens | ✅ Activo |
| **localStorage** | Persistencia de credenciales (opcional) | ✅ Activo |

**Mejores prácticas implementadas:**
- ✅ Credenciales nunca expuestas en cliente
- ✅ Tokens con expiración y renovación automática
- ✅ Validación de credenciales en servidor
- ✅ Logging estructurado sin datos sensibles

---

## 📦 Gestión de Estado & Caching

| Tecnología | Propósito | Estado |
|-----------|-----------|--------|
| **Vue 3 Reactivity** | Estado reactivo local | ✅ Activo |
| **Cache Manager (custom)** | Cache de requests HTTP | ✅ Activo |
| **Request Deduplication** | Prevención de requests duplicados | ✅ Activo |

**Estrategia de cache:**
- Cache en memoria para tokens
- Deduplicación de requests GET simultáneos
- TTL configurable por tipo de dato

---

## 🌐 Integraciones Externas

### APIs de Terceros

| API | Base URL | Propósito | Autenticación |
|-----|----------|-----------|---------------|
| **Xubio API** | `https://xubio.com/API/1.1` | Facturación, clientes, productos | OAuth2 Client Credentials |
| **BCRA API** | (vía `/api/bcra`) | Cotizaciones de monedas | (No requiere) |

**Endpoints principales de Xubio:**
- `/TokenEndpoint` - Autenticación
- `/comprobanteVentaBean` - Creación de facturas
- `/cobranzaBean` - Gestión de cobranzas
- `/clienteBean` - CRUD de clientes
- `/productoBean` - CRUD de productos
- `/monedaBean` - Listado de monedas

---

## 🛠️ Desarrollo & Calidad de Código

### TypeScript & Type Checking

| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|--------|
| **TypeScript** | `^5.3.2` | Type checking (no emit) | ✅ Activo |
| **@types/node** | `^20.10.0` | Tipos para Node.js | ✅ Activo |

**Configuración:**
- `checkJs: true` - Type checking en archivos .js
- `noEmit: true` - Solo verificación, sin compilación
- JSDoc para tipos en JavaScript

### Linting & Code Quality

| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|--------|
| **ESLint** | `^8.54.0` | Linter de código | ✅ Activo |
| **@typescript-eslint/parser** | `^6.13.0` | Parser TypeScript para ESLint | ✅ Activo |
| **@typescript-eslint/eslint-plugin** | `^6.13.0` | Reglas TypeScript para ESLint | ✅ Activo |

**Configuración:**
- Reglas recomendadas de ESLint
- Reglas TypeScript específicas
- Soporte para JavaScript y TypeScript
- Globals configurados (Node.js, Browser, Vue)

---

## 🚀 Despliegue & Infraestructura

### Hosting & CI/CD

| Tecnología | Propósito | Estado |
|-----------|-----------|--------|
| **Vercel** | Hosting y serverless functions | ✅ Activo |
| **Vercel CLI** | Desarrollo local con `vercel dev` | ✅ Activo |

**Configuración (`vercel.json`):**
- Build command: `npm run build`
- Output directory: `test-imprimir-pdf/dist`
- Rewrites para API routes
- Headers de cache para assets estáticos

### Optimizaciones de Build

| Característica | Implementación |
|----------------|----------------|
| **Tree-shaking** | Automático con Vite |
| **Minificación** | Terser con opciones personalizadas |
| **Code splitting** | Manual con lazy loading |
| **Asset optimization** | Vite optimiza automáticamente |
| **Cache headers** | Configurados en Vercel (max-age: 1 año) |

---

## 📊 Monitoreo & Análisis

| Tecnología | Propósito | Estado |
|-----------|-----------|--------|
| **rollup-plugin-visualizer** | Análisis de bundle size | ✅ Activo |
| **Logging estructurado** | JSON logs en serverless functions | ✅ Activo |
| **Console logging** | Debugging en desarrollo | ✅ Activo |

**Métricas disponibles:**
- Bundle size por módulo
- Gzip y Brotli sizes
- Build time
- Request duration (en logs)

---

## 🔄 Gestión de Dependencias

### Package Manager

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **npm** | (latest) | Gestión de paquetes |
| **package-lock.json** | - | Lock de versiones |

### Scripts NPM

```json
{
  "dev": "vite",                    // Desarrollo local
  "build": "vite build",            // Build de producción
  "preview": "vite preview",        // Preview del build
  "dev:vercel": "vercel dev",       // Desarrollo con Vercel local
  "lint": "eslint .",               // Linting
  "lint:fix": "eslint . --fix",     // Auto-fix de linting
  "type:check": "tsc --noEmit",     // Type checking
  "check": "npm run lint && npm run type:check"  // Verificación completa
}
```

---

## 📝 Estándares & Convenciones

### Estructura de Código

- **ES Modules:** `import/export` (no CommonJS)
- **Composition API:** Vue 3 Composition API (no Options API)
- **JSDoc:** Tipado mediante comentarios JSDoc
- **Alias de imports:** `@/`, `@utils/`, `@composables/`

### Convenciones de Nomenclatura

- **Componentes:** PascalCase (`ProductoSelector.vue`)
- **Composables:** camelCase con prefijo `use` (`useAuth.js`)
- **Utils:** camelCase (`formatters.js`)
- **API routes:** camelCase (`auth.js`, `proxy.js`)

---

## 🔮 Tecnologías Consideradas (No Adoptadas)

### Framework Alternativo

| Tecnología | Razón de Rechazo | ADR |
|-----------|------------------|-----|
| **Next.js** | Complejidad innecesaria para SPA | ADR-001 |
| **Nuxt.js** | No se requiere SSR/SSG | ADR-002 |

### Build Tools Alternativos

| Tecnología | Razón de Rechazo | ADR |
|-----------|------------------|-----|
| **Webpack** | Lento y complejo | ADR-002 |
| **Rollup** | Enfocado en librerías, no apps | ADR-002 |
| **Parcel** | Menos control y soporte Vue | ADR-002 |

---

## 📈 Métricas de Stack

### Performance

- **Build time:** < 5 segundos
- **HMR:** < 100ms
- **Bundle size:** ~85KB (gzipped)
- **Initial load:** Optimizado con code splitting

### Mantenibilidad

- **Líneas de código:** ~2,500 (app.js principal)
- **Módulos reutilizables:** 4+ (composables + utils)
- **Componentes:** 2+ (reutilizables)
- **Cobertura de tipos:** Parcial (JSDoc + TypeScript checking)

---

## 🎯 Roadmap Tecnológico

### Corto Plazo (Considerado)

- ✅ Migración a Vite completada
- ✅ Estructura modular implementada
- ✅ TypeScript checking configurado

### Medio Plazo (Potencial)

- 🔄 Migración completa a TypeScript (.ts)
- 🔄 Testing (Vitest + Vue Test Utils)
- 🔄 CI/CD pipeline (GitHub Actions)

### Largo Plazo (Si Escala)

- 🔮 Nuxt.js si se requiere SSR
- 🔮 State management (Pinia) si crece complejidad
- 🔮 E2E testing (Playwright/Cypress)

---

## 📚 Referencias

- [ADR-001: Decisión de no migrar a Next.js](./ADRS/ADR-001-decision-no-migrar-nextjs.md)
- [ADR-002: Decisión de Vite y estructura modular](./ADRS/ADR-002-decision-vite-y-estructura-modular.md)
- [Documentación API Xubio](./Consulta%20APIs/API_Xubio.md)
- [Vite Documentation](https://vitejs.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 📝 Notas de Mantenimiento

**Última actualización:** 2024-12-19  
**Mantenido por:** Equipo de desarrollo  
**Frecuencia de actualización:** Con cada cambio significativo en el stack

---

> **Nota para desarrolladores:** Este documento debe actualizarse cuando se agreguen, cambien o remuevan tecnologías del proyecto. Mantener sincronizado con `package.json` y decisiones arquitectónicas (ADRs).

