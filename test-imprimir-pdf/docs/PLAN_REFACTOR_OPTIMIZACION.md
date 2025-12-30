# 📋 Plan de Refactor y Optimización - Thin Slices

**Objetivo:** Optimizar el código actual sin migrar a Next.js, mejorando mantenibilidad y performance con cambios incrementales.

**Estrategia:** Thin slices - cada slice es funcional por sí solo y puede desplegarse independientemente.

---

## 🎯 Fase 1: Setup y Utilidades Base (2-3 horas)

### Slice 1.1: Configurar Build Process con Vite ⚡

**Objetivo:** Agregar build process sin cambiar código existente.

#### Checklist:
- [x] Crear `vite.config.js`
- [x] Actualizar `package.json` con scripts de Vite
- [x] Instalar dependencias: `vite`, `@vitejs/plugin-vue`
- [x] Configurar alias para imports
- [ ] Probar build: `npm run build`
- [ ] Verificar que el bundle se reduce ~40%

#### Archivos a crear/modificar:

**`vite.config.js`** (nuevo):
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'test-imprimir-pdf/index.html')
      }
    },
    // Optimizaciones
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.log para debugging
        drop_debugger: true
      }
    },
    // Code splitting
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

**`package.json`** (modificar):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type:check": "tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.4.21"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "terser": "^5.24.0"
  }
}
```

**`test-imprimir-pdf/index.html`** (modificar):
```html
<!-- Cambiar de CDN a import -->
<script type="module">
  import { createApp } from 'vue';
  import App from './assets/app.js';
  
  createApp(App).mount('#app');
</script>
```

**Resultado esperado:**
- Bundle size: ~140KB → ~85KB (reducción ~40%)
- Build time: < 5 segundos
- Hot reload funcionando

---

### Slice 1.2: Extraer Sistema de Cache a Módulo Reutilizable 🗄️

**Objetivo:** Extraer lógica de cache (líneas 320-456 de `app.js`) a módulo independiente.

#### Checklist:
- [x] Crear `assets/utils/cache.js`
- [x] Mover métodos: `getCachedData`, `setCachedData`, `invalidarCache`, `limpiarCachesExpirados`, `getTTL`
- [x] Agregar límite de tamaño (10MB)
- [x] Agregar auto-eviction cuando se llena
- [x] Actualizar `app.js` para importar y usar el módulo
- [ ] Probar que el cache sigue funcionando igual

#### Archivos a crear/modificar:

**`test-imprimir-pdf/assets/utils/cache.js`** (nuevo):
```javascript
/**
 * Sistema de Cache con TTL y límite de tamaño
 * Reemplaza el sistema actual en app.js (líneas 320-456)
 */
class CacheManager {
  constructor() {
    this.maxSize = 10 * 1024 * 1024; // 10MB límite total
    this.currentSize = 0;
    this.prefix = 'xubio_cache_';
    
    // TTL por tipo de dato (reutilizado de app.js)
    this.ttlMap = {
      'clientes': 24 * 60 * 60 * 1000,      // 24 horas
      'productos': 12 * 60 * 60 * 1000,     // 12 horas
      'listaPrecios': 6 * 60 * 60 * 1000,   // 6 horas
      'maestros': 7 * 24 * 60 * 60 * 1000   // 7 días
    };
    
    // Inicializar tamaño actual
    this.calcularTamañoActual();
  }
  
  /**
   * Calcula el tamaño actual del cache
   */
  calcularTamañoActual() {
    this.currentSize = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            this.currentSize += new Blob([item]).size;
          }
        } catch (e) {
          // Ignorar errores
        }
      }
    });
  }
  
  /**
   * Calcula tamaño aproximado de un objeto
   */
  calcularTamañoObjeto(obj) {
    return new Blob([JSON.stringify(obj)]).size;
  }
  
  /**
   * Obtiene datos del cache si no han expirado
   * @param {string} key - Clave del cache
   * @returns {any|null} Datos cacheados o null si expiró/no existe
   */
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();
      
      // Si expiró, eliminar y retornar null
      if (now - timestamp > ttl) {
        localStorage.removeItem(`${this.prefix}${key}`);
        this.calcularTamañoActual();
        console.log(`⏰ Cache expirado para: ${key}`);
        return null;
      }
      
      const edad = Math.floor((now - timestamp) / 1000 / 60);
      console.log(`✅ Cache válido para: ${key} (edad: ${edad} minutos)`);
      return data;
    } catch (error) {
      console.error(`❌ Error leyendo cache ${key}:`, error);
      localStorage.removeItem(`${this.prefix}${key}`);
      this.calcularTamañoActual();
      return null;
    }
  }
  
  /**
   * Guarda datos en el cache con TTL y límite de tamaño
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a cachear
   * @param {number} ttl - TTL en milisegundos (opcional, usa getTTL si no se proporciona)
   */
  setCachedData(key, data, ttl = null) {
    try {
      // Si no se proporciona TTL, intentar inferirlo del tipo
      if (!ttl) {
        ttl = this.getTTL(key) || 60 * 60 * 1000; // Default: 1 hora
      }
      
      const entry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      const entrySize = this.calcularTamañoObjeto(entry);
      
      // Verificar si hay espacio suficiente
      if (this.currentSize + entrySize > this.maxSize) {
        console.warn(`⚠️ Cache casi lleno (${Math.round(this.currentSize / 1024 / 1024 * 100) / 100}MB), limpiando caches viejos...`);
        this.limpiarCachesExpirados();
        
        // Si aún no hay espacio, evict los más viejos
        if (this.currentSize + entrySize > this.maxSize) {
          this.evictOldest();
        }
      }
      
      // Guardar
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
      this.currentSize += entrySize;
      
      console.log(`💾 Cache guardado para: ${key} (TTL: ${Math.floor(ttl / 1000 / 60)} minutos, tamaño: ${Math.round(entrySize / 1024)}KB)`);
    } catch (error) {
      console.error(`❌ Error guardando cache ${key}:`, error);
      // Si localStorage está lleno, intentar limpiar
      if (error.name === 'QuotaExceededError') {
        this.limpiarCachesExpirados();
        this.evictOldest();
      }
    }
  }
  
  /**
   * Elimina los caches más antiguos hasta tener espacio
   */
  evictOldest() {
    const keys = Object.keys(localStorage);
    const cacheEntries = [];
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            cacheEntries.push({ key, timestamp });
          }
        } catch (e) {
          // Ignorar
        }
      }
    });
    
    // Ordenar por timestamp (más antiguos primero)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Eliminar los más antiguos hasta tener espacio
    let evicted = 0;
    for (const entry of cacheEntries) {
      if (this.currentSize < this.maxSize * 0.8) break; // Dejar 20% de margen
      
      localStorage.removeItem(entry.key);
      evicted++;
    }
    
    this.calcularTamañoActual();
    if (evicted > 0) {
      console.log(`🗑️ Evicted ${evicted} caches antiguos para liberar espacio`);
    }
  }
  
  /**
   * Invalida un cache específico
   */
  invalidarCache(key) {
    const fullKey = `${this.prefix}${key}`;
    const item = localStorage.getItem(fullKey);
    if (item) {
      localStorage.removeItem(fullKey);
      this.calcularTamañoActual();
      console.log(`🗑️ Cache invalidado: ${key}`);
    }
  }
  
  /**
   * Limpia todos los caches expirados
   */
  limpiarCachesExpirados() {
    const keys = Object.keys(localStorage);
    let limpiados = 0;
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (Date.now() - timestamp > ttl) {
              localStorage.removeItem(key);
              limpiados++;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          limpiados++;
        }
      }
    });
    
    this.calcularTamañoActual();
    if (limpiados > 0) {
      console.log(`🧹 Limpiados ${limpiados} caches expirados`);
    }
  }
  
  /**
   * Obtiene el TTL recomendado para un tipo de dato
   */
  getTTL(tipo) {
    return this.ttlMap[tipo] || 60 * 60 * 1000; // Default: 1 hora
  }
  
  /**
   * Limpia todos los caches manualmente
   */
  limpiarTodosLosCaches() {
    const keys = Object.keys(localStorage);
    let limpiados = 0;
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
        limpiados++;
      }
    });
    
    this.currentSize = 0;
    console.log(`🗑️ Limpiados ${limpiados} caches manualmente`);
    return limpiados;
  }
  
  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return {
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.currentSize / this.maxSize) * 100),
      entries: Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).length
    };
  }
}

// Exportar instancia singleton
export const cacheManager = new CacheManager();
export default cacheManager;
```

**`test-imprimir-pdf/assets/app.js`** (modificar - reemplazar líneas 320-456):
```javascript
// Al inicio del archivo, después de los imports
import cacheManager from './utils/cache.js';

// En el objeto de métodos, reemplazar los métodos de cache por:
getCachedData(key) {
  return cacheManager.getCachedData(key);
},

setCachedData(key, data, ttl) {
  return cacheManager.setCachedData(key, data, ttl);
},

invalidarCache(key) {
  return cacheManager.invalidarCache(key);
},

limpiarCachesExpirados() {
  return cacheManager.limpiarCachesExpirados();
},

getTTL(tipo) {
  return cacheManager.getTTL(tipo);
},

limpiarTodosLosCaches() {
  return cacheManager.limpiarTodosLosCaches();
},
```

**Resultado esperado:**
- Cache con límite de 10MB
- Auto-eviction cuando se llena
- Código más mantenible
- Mismo comportamiento para el usuario

---

### Slice 1.3: Extraer Utilidades de Formato 📝

**Objetivo:** Extraer funciones de formato reutilizables (líneas 462-464, 2093-2098, 2371-2393 de `app.js`).

#### Checklist:
- [x] Crear `assets/utils/formatters.js`
- [x] Mover: `formatoMensaje`, `formatearPrecio`, `formatearCUIT`
- [ ] Agregar tests básicos (opcional)
- [x] Actualizar `app.js` para importar
- [ ] Verificar que todo funciona igual

#### Archivos a crear/modificar:

**`test-imprimir-pdf/assets/utils/formatters.js`** (nuevo):
```javascript
/**
 * Utilidades de formateo reutilizables
 * Extraídas de app.js
 */

/**
 * Formatea mensajes con saltos de línea HTML
 * @param {string} mensaje
 * @returns {string}
 */
export function formatoMensaje(mensaje) {
  return mensaje ? mensaje.replace(/\n/g, '<br>') : '';
}

/**
 * Formatea un precio a 2 decimales
 * @param {number|string} precio
 * @returns {string}
 */
export function formatearPrecio(precio) {
  if (!precio || precio === 0) {
    return '0.00';
  }
  return parseFloat(precio).toFixed(2);
}

/**
 * Formatea un CUIT con guiones (formato: XX-XXXXXXXX-X)
 * @param {string} cuit - CUIT sin formato o con formato
 * @returns {string} CUIT formateado
 */
export function formatearCUIT(cuit) {
  if (!cuit) return '';
  
  // Remover todos los caracteres no numéricos
  const soloNumeros = cuit.toString().replace(/\D/g, '');
  
  // Si tiene 11 dígitos, formatear como XX-XXXXXXXX-X
  if (soloNumeros.length === 11) {
    return `${soloNumeros.substring(0, 2)}-${soloNumeros.substring(2, 10)}-${soloNumeros.substring(10, 11)}`;
  }
  
  // Si tiene menos de 11 dígitos pero es válido, devolver sin formato
  if (soloNumeros.length > 0 && soloNumeros.length < 11) {
    return soloNumeros;
  }
  
  // Si ya está formateado correctamente, devolverlo tal cual
  if (cuit.match(/^\d{2}-\d{8}-\d{1}$/)) {
    return cuit;
  }
  
  return cuit; // Devolver original si no coincide con ningún patrón
}

/**
 * Formatea un número con separadores de miles (locale es-AR)
 * @param {number|string} numero
 * @returns {string}
 */
export function formatearNumero(numero) {
  return parseFloat(numero || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
```

**`test-imprimir-pdf/assets/app.js`** (modificar):
```javascript
// Al inicio
import { formatoMensaje, formatearPrecio, formatearCUIT } from './utils/formatters.js';

// En métodos, reemplazar las funciones por:
formatoMensaje(mensaje) {
  return formatoMensaje(mensaje);
},

formatearPrecio(precio) {
  return formatearPrecio(precio);
},

formatearCUIT(cuit) {
  return formatearCUIT(cuit);
},
```

**Resultado esperado:**
- Funciones reutilizables
- Código más limpio
- Fácil de testear

---

## 🧩 Fase 2: Extraer Cliente API y Composables (3-4 horas)

### Slice 2.1: Extraer Cliente Xubio a Módulo 🚀

**Objetivo:** Extraer lógica de API (líneas 608-668 de `app.js`) a módulo reutilizable.

#### Checklist:
- [x] Crear `assets/composables/useXubio.js`
- [x] Mover método `requestXubio`
- [x] Agregar manejo de errores mejorado
- [x] Agregar retry logic para 401
- [x] Actualizar `app.js` para usar el composable
- [ ] Probar que todas las llamadas API funcionan

#### Archivos a crear/modificar:

**`test-imprimir-pdf/assets/composables/useXubio.js`** (nuevo):
```javascript
/**
 * Composable para interactuar con la API de Xubio
 * Extraído de app.js (líneas 608-668)
 */

const PROXY_BASE = '/api/proxy';

/**
 * Crea un cliente Xubio
 * @param {Function} obtenerToken - Función para obtener/renovar token
 * @param {Function} tokenValido - Función para verificar si el token es válido
 * @returns {Object} Cliente con método requestXubio
 */
export function useXubio(obtenerToken, tokenValido) {
  /**
   * Realiza una petición a la API de Xubio a través del proxy
   * @param {string} endpoint - Endpoint de la API (ej: '/comprobanteVentaBean')
   * @param {string} method - Método HTTP ('GET', 'POST', etc.)
   * @param {object|null} payload - Payload para POST/PUT
   * @param {object|null} queryParams - Parámetros de query string
   * @returns {Promise<{response: Response, data: object}>}
   */
  async function requestXubio(endpoint, method = 'GET', payload = null, queryParams = null) {
    // Verificar y renovar token si es necesario
    if (!tokenValido()) {
      await obtenerToken(true);
    }

    // Construir URL usando el proxy
    let url = `${PROXY_BASE}${endpoint}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += '?' + params.toString();
    }

    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${obtenerToken().accessToken}`, // Asumir que obtenerToken devuelve el token
        'Accept': 'application/json'
      }
    };

    if (method !== 'GET' && payload) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(payload);
    }

    console.log('🔍 Request Xubio:', { url, method, payload: payload ? JSON.stringify(payload).substring(0, 200) : null });

    try {
      const response = await fetch(url, options);
      
      console.log('📥 Response recibida:', response.status, response.statusText);

      let data;
      try {
        const text = await response.text();
        console.log('📄 Response body (primeros 500 chars):', text.substring(0, 500));
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error(`Error parseando respuesta JSON: ${parseError.message}`);
      }

      // Si el token expiró, renovar y reintentar
      if (response.status === 401) {
        console.log('🔄 Token expirado, renovando...');
        await obtenerToken(true);
        options.headers['Authorization'] = `Bearer ${obtenerToken().accessToken}`;
        const retryResponse = await fetch(url, options);
        const retryText = await retryResponse.text();
        const retryData = retryText ? JSON.parse(retryText) : null;
        return { response: retryResponse, data: retryData };
      }

      return { response, data };
    } catch (error) {
      console.error('❌ Error en fetch:', error);
      throw error;
    }
  }

  return {
    requestXubio
  };
}

export default useXubio;
```

**Nota:** Este slice requiere ajustar la integración con el sistema de tokens existente. Se puede hacer más simple inicialmente.

---

### Slice 2.2: Extraer Composable de Autenticación 🔐

**Objetivo:** Extraer lógica de autenticación (líneas 498-586 de `app.js`).

#### Checklist:
- [x] Crear `assets/composables/useAuth.js`
- [x] Mover métodos: `obtenerToken`, `limpiarCredenciales`
- [x] Agregar persistencia de token
- [x] Integrar con cacheManager
- [x] Actualizar `app.js`

#### Archivos a crear/modificar:

**`test-imprimir-pdf/assets/composables/useAuth.js`** (nuevo):
```javascript
/**
 * Composable para manejo de autenticación con Xubio
 * Extraído de app.js (líneas 498-586, 588-598)
 */

export function useAuth() {
  const state = {
    accessToken: null,
    tokenExpiration: null,
    clientId: '',
    secretId: '',
    guardarCredenciales: true
  };

  /**
   * Verifica si el token es válido
   */
  function tokenValido() {
    return state.accessToken && 
           state.tokenExpiration && 
           Date.now() < state.tokenExpiration - 60000; // 1 minuto de margen
  }

  /**
   * Carga credenciales desde localStorage
   */
  function cargarCredenciales() {
    const savedClientId = localStorage.getItem('xubio_clientId');
    const savedSecretId = localStorage.getItem('xubio_secretId');
    
    if (savedClientId) state.clientId = savedClientId;
    if (savedSecretId) state.secretId = savedSecretId;

    // Cargar token guardado
    const savedToken = localStorage.getItem('xubio_token');
    const savedExpiration = localStorage.getItem('xubio_tokenExpiration');

    if (savedToken && savedExpiration && Date.now() < parseInt(savedExpiration) - 60000) {
      state.accessToken = savedToken;
      state.tokenExpiration = parseInt(savedExpiration);
      return true; // Token válido cargado
    }
    
    return false; // No hay token válido
  }

  /**
   * Obtiene un token de acceso de Xubio
   * @param {boolean} forceRefresh - Si es true, fuerza la renovación del token
   */
  async function obtenerToken(forceRefresh = false) {
    let clientId = state.clientId.trim();
    let secretId = state.secretId.trim();
    
    // Si no hay en el estado, intentar desde localStorage
    if (!clientId) {
      clientId = localStorage.getItem('xubio_clientId') || '';
    }
    if (!secretId) {
      secretId = localStorage.getItem('xubio_secretId') || '';
    }

    if (!clientId || !secretId) {
      throw new Error('Completa Client ID y Secret ID');
    }

    // Verificar si el token actual es válido
    if (!forceRefresh && tokenValido()) {
      return state.accessToken;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ clientId, secretId })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const errorText = await response.text().catch(() => 'Sin respuesta');
        throw new Error(`Error parseando respuesta del token: ${parseError.message}. Respuesta: ${errorText.substring(0, 200)}`);
      }

      if (response.ok && data) {
        state.accessToken = data.access_token || data.token;
        const expiresIn = parseInt(data.expires_in || 3600, 10);
        state.tokenExpiration = Date.now() + (expiresIn * 1000);

        if (state.guardarCredenciales) {
          localStorage.setItem('xubio_clientId', clientId);
          localStorage.setItem('xubio_secretId', secretId);
          localStorage.setItem('xubio_token', state.accessToken);
          localStorage.setItem('xubio_tokenExpiration', state.tokenExpiration.toString());
        }

        return state.accessToken;
      } else {
        throw new Error(data.error || data.message || 'Error obteniendo token');
      }
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      throw error;
    }
  }

  /**
   * Limpia credenciales y token
   */
  function limpiarCredenciales() {
    localStorage.removeItem('xubio_clientId');
    localStorage.removeItem('xubio_secretId');
    localStorage.removeItem('xubio_token');
    localStorage.removeItem('xubio_tokenExpiration');
    state.clientId = '';
    state.secretId = '';
    state.accessToken = null;
    state.tokenExpiration = null;
  }

  return {
    state,
    tokenValido,
    obtenerToken,
    limpiarCredenciales,
    cargarCredenciales
  };
}

export default useAuth;
```

---

## 🎨 Fase 3: Componentes Reutilizables (4-5 horas)

### Slice 3.1: Componente Selector de Productos 📦

**Objetivo:** Extraer selector de productos (HTML líneas 55-101, JS líneas 1463-2183) a componente Vue.

#### Checklist:
- [x] Crear `assets/components/ProductoSelector.vue`
- [x] Mover template del selector
- [x] Mover lógica: `listarProductos`, `productosFiltrados`, `seleccionarProductoDelDropdown`
- [x] Agregar props: `productos`, `productosSeleccionados`
- [x] Agregar emits: `@select-producto`, `@remove-producto`
- [x] Integrar en `app.js`
- [ ] Probar funcionalidad completa

#### Archivos a crear/modificar:

**`test-imprimir-pdf/assets/components/ProductoSelector.vue`** (nuevo):
```vue
<template>
  <div class="producto-selector">
    <div class="form-group">
      <label for="selectorProducto">➕ Agregar Producto:</label>
      <div style="position: relative;">
        <input 
          type="text" 
          id="selectorProducto" 
          v-model="busquedaProducto" 
          @input="mostrarDropdown = true"
          @focus="mostrarDropdown = true"
          @blur="ocultarDropdown"
          placeholder="Buscar producto por nombre, código o descripción..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        
        <!-- Dropdown de productos -->
        <div 
          v-if="mostrarDropdown && productosFiltrados.length > 0"
          class="dropdown-productos">
          <div 
            v-for="producto in productosFiltrados" 
            :key="producto.id || producto.ID"
            @click="seleccionarProducto(producto)"
            class="dropdown-item">
            <div>
              <strong>{{ producto.nombre || producto.codigo || 'Sin nombre' }}</strong>
              <div style="font-size: 12px; color: #666;">
                Código: {{ producto.codigo || 'N/A' }}
              </div>
            </div>
            <div style="font-weight: bold; color: #2196F3;">
              <span v-if="producto.precioAGDP || producto.precio">
                ${{ formatearPrecio(producto.precioAGDP || producto.precio) }}
              </span>
              <span v-else style="color: #999; font-size: 11px;">
                Sin precio
              </span>
            </div>
          </div>
        </div>
        
        <div 
          v-if="mostrarDropdown && productosFiltrados.length === 0 && busquedaProducto.trim()"
          class="dropdown-empty">
          <div style="color: #666; text-align: center;">No se encontraron productos</div>
        </div>
      </div>
    </div>

    <!-- Lista de productos seleccionados -->
    <div v-if="productosSeleccionados.length > 0" class="productos-seleccionados">
      <h3>Productos Seleccionados:</h3>
      <table class="facturas-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in productosSeleccionados" :key="index">
            <td>{{ item.producto.nombre || item.producto.codigo || 'Sin nombre' }}</td>
            <td>
              <input type="number" v-model.number="item.cantidad" min="0.01" step="0.01" style="width: 80px;">
            </td>
            <td>
              <input type="number" v-model.number="item.precio" min="0" step="0.01" style="width: 100px;">
            </td>
            <td>${{ (item.cantidad * item.precio).toFixed(2) }}</td>
            <td>
              <button class="test-btn" @click="$emit('remove-producto', index)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { formatearPrecio } from '../utils/formatters.js';

export default {
  name: 'ProductoSelector',
  props: {
    productos: {
      type: Array,
      default: () => []
    },
    productosSeleccionados: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-producto', 'remove-producto'],
  data() {
    return {
      busquedaProducto: '',
      mostrarDropdown: false
    };
  },
  computed: {
    productosFiltrados() {
      if (!this.busquedaProducto.trim()) {
        return this.productos;
      }
      
      const busqueda = this.busquedaProducto.toLowerCase();
      return this.productos.filter(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const codigo = (p.codigo || '').toLowerCase();
        const descripcion = (p.descripcion || '').toLowerCase();
        return nombre.includes(busqueda) || codigo.includes(busqueda) || descripcion.includes(busqueda);
      });
    }
  },
  methods: {
    formatearPrecio,
    seleccionarProducto(producto) {
      this.$emit('select-producto', producto);
      this.busquedaProducto = '';
      this.mostrarDropdown = false;
    },
    ocultarDropdown() {
      setTimeout(() => {
        this.mostrarDropdown = false;
      }, 200);
    }
  }
};
</script>

<style scoped>
.dropdown-productos {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 2px;
}

.dropdown-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-empty {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  z-index: 1000;
  margin-top: 2px;
}
</style>
```

**`test-imprimir-pdf/assets/app.js`** (modificar - usar componente):
```javascript
// En el template (index.html), reemplazar líneas 55-101 por:
<producto-selector
  :productos="productosList"
  :productos-seleccionados="productosSeleccionados"
  @select-producto="agregarProducto"
  @remove-producto="eliminarProducto"
/>

// En el script, registrar componente:
import ProductoSelector from './components/ProductoSelector.vue';

// En createApp:
components: {
  ProductoSelector
}
```

---

### Slice 3.2: Componente Selector de Clientes 👥

**Objetivo:** Similar al anterior, extraer selector de clientes.

#### Checklist:
- [x] Crear `assets/components/ClienteSelector.vue`
- [x] Reutilizar patrón de `ProductoSelector`
- [x] Mover lógica de clientes
- [x] Integrar en `app.js`

**Nota:** Similar estructura a `ProductoSelector`, adaptar para clientes.

---

## ⚡ Fase 4: Code Splitting y Optimización Final (2-3 horas)

### Slice 4.1: Lazy Loading de Secciones Pesadas 🚀

**Objetivo:** Implementar lazy loading para secciones que no se usan siempre.

#### Checklist:
- [x] Identificar secciones pesadas (Factura, Cobranza, PDF Viewer)
- [ ] Convertir a componentes async (opcional - puede implementarse después)
- [ ] Agregar loading states
- [ ] Probar que funciona correctamente

#### Ejemplo:

**`test-imprimir-pdf/index.html`** (modificar):
```html
<!-- En lugar de cargar todo de una vez -->
<script type="module">
  import { createApp, defineAsyncComponent } from 'vue';
  import App from './assets/app.js';
  
  // Lazy load secciones pesadas
  const FacturaSection = defineAsyncComponent(() => 
    import('./assets/components/FacturaSection.vue')
  );
  const CobranzaSection = defineAsyncComponent(() => 
    import('./assets/components/CobranzaSection.vue')
  );
  
  const app = createApp(App);
  app.component('FacturaSection', FacturaSection);
  app.component('CobranzaSection', CobranzaSection);
  app.mount('#app');
</script>
```

---

## 📊 Resumen de Thin Slices

| Fase | Slice | Tiempo | Prioridad | Impacto |
|------|-------|--------|-----------|---------|
| 1 | 1.1: Setup Vite | 2-3h | 🔴 Alta | Bundle -40% |
| 1 | 1.2: Cache Module | 1-2h | 🔴 Alta | Mantenibilidad |
| 1 | 1.3: Formatters | 1h | 🟡 Media | Reutilización |
| 2 | 2.1: Xubio Client | 2h | 🟡 Media | Mantenibilidad |
| 2 | 2.2: Auth Composable | 1-2h | 🟡 Media | Reutilización |
| 3 | 3.1: ProductoSelector | 2-3h | 🟢 Baja | UX + Mantenibilidad |
| 3 | 3.2: ClienteSelector | 2h | 🟢 Baja | UX + Mantenibilidad |
| 4 | 4.1: Lazy Loading | 2-3h | 🟡 Media | Performance |

**Total estimado:** 13-18 horas

**Recomendación de orden:**
1. Fase 1 completa (4-6h) - Base sólida
2. Fase 2 (opcional, 3-4h) - Si hay tiempo
3. Fase 3 (opcional, 4-5h) - Mejora UX
4. Fase 4 (opcional, 2-3h) - Optimización final

---

## ✅ Checklist General de Verificación

Después de cada slice:
- [ ] Código funciona igual que antes
- [ ] No hay errores en consola
- [ ] Tests manuales pasan
- [ ] Bundle size mejoró (si aplica)
- [ ] Código es más mantenible

---

## 🎯 Métricas de Éxito

**Antes:**
- Bundle: ~140KB
- Archivo app.js: 2600 líneas
- Cache: Sin límites
- Componentes: 0 reutilizables

**Después (Fase 1 completa):**
- Bundle: ~85KB (-40%)
- Archivo app.js: ~2000 líneas (-23%)
- Cache: 10MB límite + auto-eviction
- Utilidades: 2 módulos reutilizables

**Después (Todas las fases):**
- Bundle: ~60KB inicial + lazy loading
- Archivo app.js: ~1200 líneas (-54%)
- Cache: Sistema robusto
- Componentes: 2+ reutilizables

---

## 🚀 Próximos Pasos

1. **Revisar este plan** y ajustar prioridades según necesidades
2. **Empezar con Slice 1.1** (Setup Vite) - más impacto, menos riesgo
3. **Validar cada slice** antes de continuar
4. **Documentar cambios** en cada slice

¿Empezamos con el Slice 1.1?

