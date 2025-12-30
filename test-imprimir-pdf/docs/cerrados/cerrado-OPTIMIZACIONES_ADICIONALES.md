# 🚀 Optimizaciones Adicionales - Post Refactor

**Contexto:** Después de implementar el plan de refactor, estas son optimizaciones adicionales de alto impacto y bajo esfuerzo.

**Prioridad:** Ordenadas por impacto/efecto (ROI)

---

## 🔥 Alta Prioridad (Alto Impacto, Bajo Esfuerzo)

### 1. Request Deduplication para APIs ⚡

**Problema:** Si varios componentes llaman a la misma API simultáneamente, se hacen múltiples requests innecesarios.

**Solución:** Implementar deduplicación de requests en `useXubio.js`

**Impacto:** Reduce llamadas API en ~30-50%, mejora performance y reduce costos.

**Implementación:**

```javascript
// assets/composables/useXubio.js

// Agregar al inicio del archivo
const pendingRequests = new Map();

export function useXubio(obtenerToken, tokenValido) {
  async function requestXubio(endpoint, method = 'GET', payload = null, queryParams = null) {
    // Crear clave única para el request
    const requestKey = `${method}:${endpoint}:${JSON.stringify(queryParams)}:${payload ? JSON.stringify(payload).substring(0, 100) : ''}`;
    
    // Si ya hay un request pendiente con la misma clave, reutilizar
    if (pendingRequests.has(requestKey)) {
      console.log('🔄 Reutilizando request pendiente:', requestKey);
      return pendingRequests.get(requestKey);
    }
    
    // Crear promise y guardarla
    const requestPromise = (async () => {
      try {
        // ... código existente de requestXubio ...
        const result = await hacerRequestReal();
        return result;
      } finally {
        // Limpiar después de completar
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }
  
  return { requestXubio };
}
```

**Tiempo:** 30 minutos  
**Beneficio:** Menos llamadas API, mejor UX

---

### 2. Debounce en Búsquedas 🔍

**Problema:** Cada tecla en el input de búsqueda dispara un filtro, puede ser costoso con muchos productos/clientes.

**Solución:** Agregar debounce a los inputs de búsqueda.

**Impacto:** Reduce cálculos innecesarios, mejora responsividad.

**Implementación:**

```javascript
// assets/utils/debounce.js (nuevo)
/**
 * Debounce function - retrasa la ejecución hasta que no haya más llamadas
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

**Uso en componentes:**

```vue
<!-- ProductoSelector.vue -->
<script>
import { debounce } from '../utils/debounce.js';

export default {
  data() {
    return {
      busquedaProducto: '',
      busquedaDebounced: ''
    };
  },
  created() {
    // Debounce de 300ms
    this.debouncedBusqueda = debounce((value) => {
      this.busquedaDebounced = value;
    }, 300);
  },
  watch: {
    busquedaProducto(newValue) {
      this.debouncedBusqueda(newValue);
    }
  },
  computed: {
    productosFiltrados() {
      // Usar busquedaDebounced en lugar de busquedaProducto
      if (!this.busquedaDebounced.trim()) {
        return this.productos;
      }
      // ... resto del filtro
    }
  }
};
</script>
```

**Tiempo:** 20 minutos  
**Beneficio:** Mejor performance en búsquedas

---

### 3. Virtual Scrolling para Listas Grandes 📜

**Problema:** Si hay muchos productos/clientes, renderizar todos puede ser lento.

**Solución:** Virtual scrolling - solo renderizar items visibles.

**Impacto:** Mejora performance con listas >100 items.

**Implementación (usando vue-virtual-scroller o implementación simple):**

```vue
<!-- ProductoSelector.vue - Versión optimizada -->
<template>
  <div class="dropdown-productos" ref="dropdown">
    <div 
      v-for="producto in productosVisibles" 
      :key="producto.id"
      :style="{ height: itemHeight + 'px' }"
      class="dropdown-item">
      <!-- contenido -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      itemHeight: 60, // altura de cada item
      visibleItems: 10, // cuántos items mostrar
      scrollTop: 0
    };
  },
  computed: {
    productosVisibles() {
      const start = Math.floor(this.scrollTop / this.itemHeight);
      const end = start + this.visibleItems;
      return this.productosFiltrados.slice(start, end);
    }
  },
  mounted() {
    this.$refs.dropdown?.addEventListener('scroll', (e) => {
      this.scrollTop = e.target.scrollTop;
    });
  }
};
</script>
```

**Tiempo:** 1-2 horas (opcional, solo si hay >100 items)  
**Beneficio:** Performance mejorada con listas grandes

---

### 4. Service Worker para Cache Offline 🔌

**Problema:** Si el usuario pierde conexión, no puede usar datos cacheados.

**Solución:** Service Worker para cache de assets y datos.

**Impacto:** App funciona offline, mejor UX.

**Implementación:**

```javascript
// public/sw.js (nuevo)
const CACHE_NAME = 'xubio-app-v1';
const urlsToCache = [
  '/',
  '/assets/app.js',
  '/assets/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Registro en index.html:**

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
```

**Tiempo:** 1 hora  
**Beneficio:** App funciona offline

---

## 🟡 Media Prioridad (Alto Impacto, Medio Esfuerzo)

### 5. Optimización de Bundle con Análisis 📊

**Problema:** No sabemos qué está ocupando espacio en el bundle.

**Solución:** Agregar análisis de bundle.

**Implementación:**

```bash
npm install --save-dev rollup-plugin-visualizer
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  // ...
});
```

**Uso:** `npm run build` genera `dist/stats.html` con análisis visual.

**Tiempo:** 15 minutos  
**Beneficio:** Identificar qué optimizar

---

### 6. Preload de Recursos Críticos 🎯

**Problema:** Recursos críticos se cargan tarde.

**Solución:** Preload de CSS y JS críticos.

**Implementación en index.html:**

```html
<head>
  <link rel="preload" href="/assets/styles.css" as="style">
  <link rel="preload" href="/assets/app.js" as="script">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
```

**Tiempo:** 10 minutos  
**Beneficio:** Mejor LCP (Largest Contentful Paint)

---

### 7. Compresión Gzip/Brotli en Vercel 🗜️

**Problema:** Assets sin comprimir son más grandes.

**Solución:** Vercel comprime automáticamente, pero podemos optimizar.

**Verificar en vercel.json:**

```json
{
  "version": 2,
  "compression": ["gzip", "brotli"],
  "routes": [
    // ...
  ]
}
```

**Tiempo:** 5 minutos  
**Beneficio:** Bundle ~70% más pequeño

---

### 8. Lazy Loading de Imágenes (si hay) 🖼️

**Problema:** Si hay imágenes, cargan todas de una vez.

**Solución:** Lazy loading nativo.

**Implementación:**

```html
<img loading="lazy" src="..." alt="...">
```

**Tiempo:** 5 minutos  
**Beneficio:** Mejor performance inicial

---

## 🟢 Baja Prioridad (Mejoras Incrementales)

### 9. Error Boundary / Error Handling Mejorado 🛡️

**Problema:** Errores no manejados pueden romper la app.

**Solución:** Error boundary global.

**Implementación:**

```javascript
// assets/composables/useErrorHandler.js
export function useErrorHandler() {
  const handleError = (error, context) => {
    console.error(`Error en ${context}:`, error);
    // Enviar a servicio de logging (opcional)
    // Mostrar mensaje amigable al usuario
  };
  
  return { handleError };
}
```

**Tiempo:** 1 hora  
**Beneficio:** Mejor UX en errores

---

### 10. Performance Monitoring 📈

**Problema:** No sabemos cómo performa la app en producción.

**Solución:** Agregar métricas básicas.

**Implementación simple:**

```javascript
// assets/utils/performance.js
export function trackPerformance() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('Page Load:', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart
          });
        }
      }
    });
    observer.observe({ entryTypes: ['navigation'] });
  }
}
```

**Tiempo:** 30 minutos  
**Beneficio:** Visibilidad de performance

---

### 11. Optimización de CSS 🎨

**Problema:** CSS puede tener reglas no usadas.

**Solución:** PurgeCSS (si hay mucho CSS).

**Implementación:**

```bash
npm install --save-dev @fullhuman/postcss-purgecss
```

```javascript
// vite.config.js
import purgecss from '@fullhuman/postcss-purgecss';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        purgecss({
          content: ['./test-imprimir-pdf/**/*.html', './test-imprimir-pdf/**/*.vue', './test-imprimir-pdf/**/*.js']
        })
      ]
    }
  }
});
```

**Tiempo:** 30 minutos  
**Beneficio:** CSS más pequeño

---

## 🎯 Optimizaciones Específicas de Vercel

### 12. Headers de Cache para Assets 📦

**Problema:** Assets se recargan innecesariamente.

**Solución:** Headers de cache en Vercel.

**Implementación en vercel.json:**

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "routes": [
    // ...
  ]
}
```

**Tiempo:** 10 minutos  
**Beneficio:** Assets cacheados por navegador

---

### 13. Edge Functions para APIs (si aplica) ⚡

**Problema:** Serverless Functions pueden tener cold start.

**Solución:** Mover a Edge Functions si es posible.

**Implementación:**

```javascript
// api/proxy.js -> api/proxy.edge.js
export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  // ... código existente adaptado a Edge
}
```

**Tiempo:** 1-2 horas (solo si hay problemas de latencia)  
**Beneficio:** Menor latencia, sin cold start

---

## 📊 Resumen de Optimizaciones

| # | Optimización | Tiempo | Impacto | Prioridad |
|---|-------------|--------|---------|-----------|
| 1 | Request Deduplication | 30min | 🔥 Alto | 🔴 Alta |
| 2 | Debounce en Búsquedas | 20min | 🔥 Alto | 🔴 Alta |
| 3 | Virtual Scrolling | 1-2h | 🟡 Medio | 🟡 Media |
| 4 | Service Worker | 1h | 🟡 Medio | 🟡 Media |
| 5 | Bundle Analysis | 15min | 🟡 Medio | 🟡 Media |
| 6 | Preload Recursos | 10min | 🟡 Medio | 🟡 Media |
| 7 | Compresión Vercel | 5min | 🟡 Medio | 🟡 Media |
| 8 | Lazy Loading Imágenes | 5min | 🟢 Bajo | 🟢 Baja |
| 9 | Error Handling | 1h | 🟢 Bajo | 🟢 Baja |
| 10 | Performance Monitoring | 30min | 🟢 Bajo | 🟢 Baja |
| 11 | PurgeCSS | 30min | 🟢 Bajo | 🟢 Baja |
| 12 | Cache Headers | 10min | 🟡 Medio | 🟡 Media |
| 13 | Edge Functions | 1-2h | 🟡 Medio | 🟡 Media |

---

## 🚀 Plan de Implementación Recomendado

### Fase 1: Quick Wins (1 hora)
1. ✅ Request Deduplication (30min) - **COMPLETADO**
2. ✅ Debounce en Búsquedas (20min) - **COMPLETADO**
3. ✅ Cache Headers Vercel (10min) - **COMPLETADO**

### Fase 2: Optimizaciones de Performance (2-3 horas)
4. ✅ Bundle Analysis (15min)
5. ✅ Preload Recursos (10min)
6. ✅ Compresión Vercel (5min)
7. ✅ Service Worker (1h) - opcional

### Fase 3: Mejoras Incrementales (según necesidad)
8. Virtual Scrolling (si hay >100 items)
9. Error Handling mejorado
10. Performance Monitoring

---

## 💡 Recomendación Final

**Empezar con Fase 1** (Quick Wins):
- **ROI máximo:** 1 hora de trabajo, mejoras inmediatas
- **Bajo riesgo:** Cambios pequeños y testeables
- **Alto impacto:** Mejor performance y UX

**Luego evaluar Fase 2** según métricas reales del bundle analysis.

---

## 📝 Notas

- Todas las optimizaciones son **opcionales** y **incrementales**
- Implementar solo las que aporten valor real
- Medir antes y después para validar mejoras
- Priorizar según problemas reales encontrados

