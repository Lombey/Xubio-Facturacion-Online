# Plan de Acción - Mejoras Prioritarias

**Objetivo**: Mejorar seguridad y arquitectura manteniendo funcionalidad de testing  
**Tiempo estimado**: 3-5 días de desarrollo  
**Prioridad**: ALTA (Seguridad y Mantenibilidad)

---

## 🎯 Resumen Ejecutivo

Este plan aborda las 3 mejoras críticas identificadas en el análisis, priorizando **seguridad primero** y luego **refactoring del frontend** de manera incremental sin romper funcionalidad existente.

---

## ✅ Acción 1: Restringir CORS (1-2 horas)

### **Problema Actual**
```javascript
// api/proxy.js, api/auth.js, api/bcra.js
res.setHeader('Access-Control-Allow-Origin', '*'); // ❌ Permisivo
```

### **Solución Propuesta**

#### **Paso 1.1: Crear utilidad de CORS compartida**

Crear `api/lib/cors.js` para centralizar la lógica:

```javascript
// api/lib/cors.js
/**
 * Configuración de CORS segura
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 * @param {boolean} isPreflight
 */
export function setCorsHeaders(req, res, isPreflight = false) {
  // Obtener origen permitido desde variable de entorno
  // Para desarrollo local: permite localhost
  // Para producción: solo tu dominio de Vercel
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);

  const origin = req.headers.origin || req.headers.referer?.match(/^https?:\/\/[^/]+/)?.[0];
  
  // Verificar si el origen está permitido
  if (origin && allowedOrigins.some(allowed => {
    // Soporta wildcards simples como *.vercel.app
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return allowed === origin;
  })) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

  if (isPreflight) {
    res.status(200).end();
  }
}

/**
 * Middleware helper para manejar OPTIONS preflight
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res, true);
    return true;
  }
  return false;
}
```

#### **Paso 1.2: Actualizar api/proxy.js**

```javascript
// api/proxy.js
import { setCorsHeaders, handlePreflight } from './lib/cors.js';

export default async function handler(req, res) {
  // Manejar preflight CORS
  if (handlePreflight(req, res)) {
    return;
  }

  try {
    // ... código existente ...

    // Establecer headers CORS ANTES de enviar respuesta
    setCorsHeaders(req, res);
    
    // ... resto del código ...
    
  } catch (error) {
    setCorsHeaders(req, res);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'proxy_error'
    });
  }
}
```

#### **Paso 1.3: Actualizar api/auth.js y api/bcra.js**

Aplicar el mismo patrón:

```javascript
// api/auth.js
import { setCorsHeaders, handlePreflight } from './lib/cors.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) {
    return;
  }

  // ... código existente ...

  // Reemplazar todas las instancias de:
  // res.setHeader('Access-Control-Allow-Origin', '*');
  // con:
  setCorsHeaders(req, res);
}
```

#### **Paso 1.4: Configurar variables de entorno**

En Vercel Dashboard → Settings → Environment Variables:

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production  
ALLOWED_ORIGINS=https://tu-app.vercel.app,https://www.tu-dominio.com
```

O crear `.env.local` para desarrollo local (si usas `vercel dev`):
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Nota sobre variables de entorno**:
- En el **backend (serverless functions)**: `process.env` funciona normalmente
- En el **frontend (sin build)**: NO existe `process.env`. Si necesitas config dinámica, usar:
  - Rutas relativas (`/api/proxy`) - ✅ Ya estamos haciendo esto
  - O inyectar en `window` desde HTML si es necesario

#### **Paso 1.5: Testing**

1. ✅ Verificar que la app funciona en desarrollo local
2. ✅ Verificar que funciona en Vercel preview
3. ✅ Verificar que otros dominios NO pueden hacer requests
4. ✅ Test manual: Intentar request desde Postman/curl (debe fallar sin origin válido)

---

## ✅ Acción 2: Validar Inputs (2-3 horas)

### **Problema Actual**
```javascript
// api/proxy.js - No valida path antes de usar
let path = req.query.path || '';
let url = `${XUBIO_BASE_URL}${path}`; // ❌ Path injection possible
```

### **Solución Propuesta**

#### **Paso 2.1: Instalar Zod para validación**

```bash
# IMPORTANTE: Ejecutar en la raíz del proyecto donde está package.json
npm install zod

# Verificar que se instaló correctamente
npm list zod
```

**Nota**: Vercel incluirá automáticamente `zod` en el build de las funciones serverless si está en `package.json`.

#### **Paso 2.2: Crear schemas de validación**

Crear `api/lib/validations.js`:

```javascript
// api/lib/validations.js
import { z } from 'zod';

/**
 * Schema para validar paths de API
 * Solo permite caracteres alfanuméricos, guiones, barras y guiones bajos
 * Previene path traversal y SSRF
 */
export const apiPathSchema = z.string()
  .min(1, 'Path cannot be empty')
  .max(500, 'Path too long')
  .regex(
    /^\/[a-zA-Z0-9\/\-_.]+$/,
    'Invalid path format. Only alphanumeric characters, slashes, hyphens, dots and underscores allowed'
  )
  .refine(
    (path) => !path.includes('..'), // Prevenir path traversal
    { message: 'Path traversal not allowed' }
  )
  .refine(
    (path) => !path.match(/\/{2,}/), // Prevenir double slashes
    { message: 'Invalid path format: multiple slashes' }
  );

/**
 * Schema para validar query parameters del proxy
 */
export const proxyQuerySchema = z.object({
  path: apiPathSchema.optional(),
  // Agregar otros query params según necesidad
}).passthrough(); // Permite otros params pero valida los conocidos

/**
 * Schema para validar body de autenticación
 */
export const authBodySchema = z.object({
  clientId: z.string()
    .min(1, 'clientId is required')
    .max(200, 'clientId too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid clientId format'),
  secretId: z.string()
    .min(1, 'secretId is required')
    .max(200, 'secretId too long')
});

/**
 * Helper para validar y parsear con Zod
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ success: true, data: T } | { success: false, error: string }}
 */
export function validateSchema(schema, data) {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errors };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation error' 
    };
  }
}
```

#### **Paso 2.3: Actualizar api/proxy.js con validación**

```javascript
// api/proxy.js
import { setCorsHeaders, handlePreflight } from './lib/cors.js';
import { apiPathSchema, proxyQuerySchema, validateSchema } from './lib/validations.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) {
    return;
  }

  try {
    // Validar query parameters
    const queryValidation = validateSchema(proxyQuerySchema, req.query);
    if (!queryValidation.success) {
      setCorsHeaders(req, res);
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryValidation.error
      });
    }

    // Obtener y validar el path
    let path = req.query?.path || '';
    
    // Si no viene en query, intentar desde la URL (con validación)
    if (!path && req.url) {
      const urlPath = req.url.split('?')[0];
      path = urlPath.replace('/api/proxy', '').replace(/^\//, '');
    }
    
    if (!path) {
      path = '/';
    }
    
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // VALIDAR el path antes de usarlo
    const pathValidation = apiPathSchema.safeParse(path);
    if (!pathValidation.success) {
      setCorsHeaders(req, res);
      return res.status(400).json({
        error: 'Invalid path format',
        details: pathValidation.error.errors.map(e => e.message).join(', ')
      });
    }

    const validatedPath = pathValidation.data;

    // Construir URL con path validado
    let url = `${XUBIO_BASE_URL}${validatedPath}`;
    
    // ... resto del código existente (ya seguro porque path está validado) ...
    
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

#### **Paso 2.4: Actualizar api/auth.js con validación**

```javascript
// api/auth.js
import { setCorsHeaders, handlePreflight } from './lib/cors.js';
import { authBodySchema, validateSchema } from './lib/validations.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    setCorsHeaders(req, res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar body
  const bodyValidation = validateSchema(authBodySchema, req.body);
  if (!bodyValidation.success) {
    setCorsHeaders(req, res);
    return res.status(400).json({
      error: 'Invalid request body',
      details: bodyValidation.error
    });
  }

  const { clientId, secretId } = bodyValidation.data;

  try {
    // ... resto del código (ya validado) ...
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

#### **Paso 2.5: Testing de validación**

1. ✅ Test path válido: `/clienteBean/123` → debe funcionar
2. ✅ Test path inválido: `/clienteBean/../admin` → debe rechazar (400)
3. ✅ Test path con caracteres especiales: `/test<script>` → debe rechazar
4. ✅ Test path muy largo (>500 chars) → debe rechazar
5. ✅ Test auth sin clientId → debe rechazar (400)
6. ✅ Test auth con clientId inválido → debe rechazar (400)

---

## ✅ Acción 3: Refactorizar Frontend (4-6 horas)

### **Problema Actual**
- Archivo monolítico `app.js` de 2000+ líneas
- Sin componentes reutilizables
- Sin code splitting

### **Solución Propuesta: Refactoring Incremental (Enfoque Pragmático)**

**Estrategia**: Como estamos **sin build system**, evitamos módulos ES6 en el navegador (problemas con rutas, MIME types, CORS). En su lugar, organizamos el código en **múltiples archivos cargados secuencialmente** o **namespaces globales** para mantenerlo mantenible sin complicar el setup.

**⚠️ Consideración Importante**: Los módulos ES6 (`import/export`) en navegadores sin bundler pueden tener problemas:
- Rutas relativas requieren headers MIME correctos
- Vercel dev lo maneja bien, pero añade complejidad
- Alternativa más segura: Namespaces globales o carga secuencial de scripts

#### **Paso 3.1: Crear estructura de componentes**

```
test-imprimir-pdf/
├── assets/
│   ├── app.js                    # Main app (reducido, solo setup)
│   ├── components/
│   │   ├── AuthSection.js        # Sección de autenticación
│   │   ├── ProductSection.js     # Sección de productos
│   │   ├── FacturaSection.js     # Sección de facturas
│   │   ├── CobranzaSection.js    # Sección de cobranzas
│   │   ├── PDFViewer.js          # Visualizador de PDF
│   │   └── ResultMessage.js      # Mensajes de resultado
│   ├── composables/
│   │   ├── useAuth.js            # Lógica de autenticación
│   │   ├── useXubioAPI.js        # Cliente API
│   │   └── useFormValidation.js  # Validación de formularios
│   └── utils/
│       ├── formatters.js         # Funciones de formato
│       └── constants.js          # Constantes
```

#### **Paso 3.2 (ALTERNATIVA A): Usar Namespace Global (Recomendado sin Build)**

Para evitar problemas con módulos ES6 en el navegador, usamos un namespace global:

Crear `assets/composables/useAuth.js`:

```javascript
// assets/composables/useAuth.js
// NOTA: Este archivo se carga ANTES de app.js en index.html
// Usa namespace global en lugar de export/import

window.AppComposables = window.AppComposables || {};

window.AppComposables.useAuth = function() {
  const PROXY_BASE = '/api/proxy';
  const AUTH_ENDPOINT = '/api/auth';

  return {
    /**
     * Obtener token de acceso
     * @param {string} clientId
     * @param {string} secretId
     * @param {boolean} forceRefresh
     * @returns {Promise<{access_token: string, expires_in: number}>}
     */
    async obtenerToken(clientId, secretId, forceRefresh = false) {
      // Validar credenciales
      if (!clientId?.trim() || !secretId?.trim()) {
        throw new Error('Client ID y Secret ID son requeridos');
      }

      // Si hay token válido y no es force refresh, usar el existente
      if (!forceRefresh) {
        const savedToken = localStorage.getItem('xubio_token');
        const savedExpiration = localStorage.getItem('xubio_tokenExpiration');
        
        if (savedToken && savedExpiration && Date.now() < parseInt(savedExpiration) - 60000) {
          return {
            access_token: savedToken,
            expires_in: Math.floor((parseInt(savedExpiration) - Date.now()) / 1000)
          };
        }
      }

      // Obtener nuevo token
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId: clientId.trim(), secretId: secretId.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener token');
      }

      const data = await response.json();
      const expiration = Date.now() + (data.expires_in * 1000);

      // Guardar en localStorage
      localStorage.setItem('xubio_token', data.access_token);
      localStorage.setItem('xubio_tokenExpiration', expiration.toString());

      return data;
    },

    /**
     * Limpiar credenciales y token
     */
    limpiarCredenciales() {
      localStorage.removeItem('xubio_clientId');
      localStorage.removeItem('xubio_secretId');
      localStorage.removeItem('xubio_token');
      localStorage.removeItem('xubio_tokenExpiration');
    },

    /**
     * Verificar si hay token válido
     * @returns {boolean}
     */
    tokenValido() {
      const token = localStorage.getItem('xubio_token');
      const expiration = localStorage.getItem('xubio_tokenExpiration');
      
      return token && expiration && Date.now() < parseInt(expiration) - 60000;
    },

    /**
     * Obtener token actual
     * @returns {string | null}
     */
    getToken() {
      return localStorage.getItem('xubio_token');
    }
  };
}
```

#### **Paso 3.3: Extraer cliente API**

Crear `assets/composables/useXubioAPI.js` (usando namespace global):

```javascript
// assets/composables/useXubioAPI.js
// Usa namespace global
window.AppComposables = window.AppComposables || {};

window.AppComposables.useXubioAPI = function() {
  // Usar el composable de auth del namespace
  const auth = window.AppComposables.useAuth();
  
  const PROXY_BASE = '/api/proxy';

  /**
   * Hacer request a la API de Xubio
   * @param {string} endpoint
   * @param {string} method
   * @param {any} payload
   * @param {Record<string, string>} queryParams
   * @returns {Promise<{response: Response, data: any}>}
   */
  async function requestXubio(endpoint, method = 'GET', payload = null, queryParams = null) {
    // Verificar token
    if (!auth.tokenValido()) {
      throw new Error('Token no válido. Obtén un nuevo token primero.');
    }

    // Construir URL
    let url = `${PROXY_BASE}${endpoint}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    // Preparar opciones
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);
    
    let data;
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.arrayBuffer();
    }

    return { response, data };
  }

  return {
    requestXubio,
    // Helpers específicos
    async obtenerCliente(clienteId) {
      const { response, data } = await requestXubio(`/clienteBean/${clienteId}`, 'GET');
      if (!response.ok) throw new Error(`Error al obtener cliente: ${response.status}`);
      return data;
    },
    async crearFactura(facturaData) {
      const { response, data } = await requestXubio('/facturaBean', 'POST', facturaData);
      if (!response.ok) throw new Error(`Error al crear factura: ${response.status}`);
      return data;
    },
    // ... más helpers según necesidad
  };
};
```

**Alternativa con módulos ES6**:
```javascript
// Si usas módulos ES6 (ALTERNATIVA B)
import { useAuth } from './useAuth.js';

export function useXubioAPI() {
  const auth = useAuth();
  // ...
}
```

#### **Paso 3.4: Extraer componente AuthSection**

Crear `assets/components/AuthSection.js`:

```javascript
// assets/components/AuthSection.js
import { useAuth } from '../composables/useAuth.js';
import { ResultMessage } from './ResultMessage.js';

/**
 * Componente de autenticación
 * @param {Object} props
 * @returns {Object}
 */
export function AuthSection(props = {}) {
  const { 
    clientId = '',
    secretId = '',
    guardarCredenciales = true,
    onTokenObtained = () => {},
    onError = () => {}
  } = props;

  const auth = useAuth();
  const state = Vue.reactive({
    clientId,
    secretId,
    guardarCredenciales,
    isLoading: false,
    result: { message: '', type: '', visible: false }
  });

  async function obtenerToken() {
    state.isLoading = true;
    state.result.visible = false;

    try {
      const data = await auth.obtenerToken(state.clientId, state.secretId, true);
      
      // Guardar credenciales si está habilitado
      if (state.guardarCredenciales) {
        localStorage.setItem('xubio_clientId', state.clientId);
        localStorage.setItem('xubio_secretId', state.secretId);
      }

      state.result = {
        message: '✅ Token obtenido exitosamente',
        type: 'success',
        visible: true
      };

      onTokenObtained(data);
    } catch (error) {
      state.result = {
        message: `❌ Error: ${error.message}`,
        type: 'error',
        visible: true
      };
      onError(error);
    } finally {
      state.isLoading = false;
    }
  }

  function limpiarCredenciales() {
    auth.limpiarCredenciales();
    state.clientId = '';
    state.secretId = '';
    state.result = {
      message: '✅ Credenciales limpiadas',
      type: 'success',
      visible: true
    };
  }

  // Template (retornar objeto con template y setup)
  return {
    setup() {
      return { state, obtenerToken, limpiarCredenciales };
    },
    template: `
      <div class="section">
        <h2>1. Autenticación</h2>
        <div class="form-group">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" v-model="state.clientId" placeholder="Ingresa tu Client ID">
        </div>
        <div class="form-group">
          <label for="secretId">Secret ID:</label>
          <input type="password" id="secretId" v-model="state.secretId" placeholder="Ingresa tu Secret ID">
        </div>
        <button @click="obtenerToken" :disabled="state.isLoading">Obtener Token</button>
        <button class="btn-danger" @click="limpiarCredenciales">Limpiar Credenciales</button>
        <ResultMessage :result="state.result" v-if="state.result.visible" />
      </div>
    `
  };
}
```

**Nota**: Como estamos usando Vue CDN sin build system, los "componentes" se implementarán como funciones que retornan objetos de configuración de Vue, o podemos usar `<script type="module">` y crear elementos directamente.

#### **Paso 3.5: Refactorizar app.js principal**

Simplificar `assets/app.js` para usar los composables (namespace global):

```javascript
// assets/app.js (VERSIÓN REFACTORIZADA - simplificada)
// Asume que Vue y los composables ya están cargados (vía script tags)

const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      // Solo estado mínimo necesario
      clientId: '',
      secretId: '',
      accessToken: null,
      isLoading: false,
      // ... solo las propiedades esenciales
    };
  },
  
  setup() {
    // Usar composables del namespace global
    const auth = window.AppComposables.useAuth();
    const api = window.AppComposables.useXubioAPI();
    
    return {
      auth,
      api
    };
  },

  computed: {
    tokenValido() {
      return this.auth.tokenValido();
    }
  },

  methods: {
    // Métodos simplificados que usan los composables
    async obtenerToken() {
      try {
        const data = await this.auth.obtenerToken(this.clientId, this.secretId);
        this.accessToken = data.access_token;
        // ... resto de lógica simplificada
      } catch (error) {
        this.handleError(error, 'autenticación');
      }
    },
    
    // ... otros métodos simplificados
  }
});

app.mount('#app');
```

#### **Paso 3.6: Actualizar index.html (Namespace Global - Recomendado)**

```html
<!-- index.html -->
<!-- 1. Cargar composables primero (namespace global) -->
<script src="./assets/composables/useAuth.js"></script>
<script src="./assets/composables/useXubioAPI.js"></script>
<!-- ... otros composables ... -->

<!-- 2. Cargar utilidades -->
<script src="./assets/utils/formatters.js"></script>
<script src="./assets/utils/constants.js"></script>

<!-- 3. Cargar Vue (CDN) -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<!-- 4. Cargar app principal (usa los namespaces) -->
<script src="./assets/app.js"></script>
```

En `assets/app.js`:
```javascript
// assets/app.js
const { createApp } = Vue;

const app = createApp({
  setup() {
    // Usar composables del namespace global
    const auth = window.AppComposables.useAuth();
    const api = window.AppComposables.useXubioAPI();
    
    return { auth, api };
  },
  // ... resto del código
});

app.mount('#app');
```

#### **Paso 3.6 (ALTERNATIVA): Si prefieres módulos ES6**

```html
<!-- index.html -->
<script type="module">
  // Import Vue desde CDN
  import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
  
  // Import composables (rutas con .js explícito)
  import { useAuth } from './assets/composables/useAuth.js';
  import { useXubioAPI } from './assets/composables/useXubioAPI.js';
  
  // Import app principal
  import('./assets/app.js');
</script>
```

**⚠️ Consideraciones con módulos ES6**:
- Vercel dev sirve correctamente los archivos JS con MIME type adecuado ✅
- Rutas relativas funcionan si están bien configuradas ✅
- Puede haber problemas en algunos entornos de desarrollo local
- Recomendación: **Namespace global es más simple y confiable para este caso**

---

## 🚨 ADVERTENCIAS Y CONSIDERACIONES TÉCNICAS

### ⚠️ Módulos ES6 en Frontend (Sin Bundler)

**Problema**: El uso de `import/export` directamente en el navegador puede tener complicaciones:
- Rutas relativas requieren que el servidor sirva archivos con headers MIME correctos
- Vercel dev maneja esto bien, pero puede fallar en otros entornos
- Problemas de CORS si los módulos se sirven desde diferentes orígenes

**Solución Recomendada**: 
- ✅ **Usar Namespace Global** (`window.AppComposables`) en lugar de módulos ES6
- ✅ Cargar scripts con `<script src="">` en lugar de `<script type="module">`
- ✅ Más simple, más compatible, sin problemas de MIME/CORS

**Si decides usar Módulos ES6**:
- Todas las rutas deben tener extensión `.js` explícita ✅
- Todos los scripts deben tener `type="module"` ✅
- Asegurar que Vercel sirva correctamente (lo hace por defecto) ✅

### ⚠️ Variables de Entorno

**Backend (Serverless Functions)**:
- ✅ `process.env` funciona normalmente
- ✅ Variables configuradas en Vercel Dashboard se inyectan automáticamente
- ✅ `.env.local` funciona con `vercel dev`

**Frontend (Sin Build Process)**:
- ❌ `process.env` NO existe en el navegador
- ✅ Usar rutas relativas (`/api/proxy`) - Ya implementado correctamente
- ✅ Si necesitas config dinámica: definir en archivo JS o inyectar en `window` desde HTML

### ⚠️ Instalación de Zod

**Importante**:
1. Ejecutar `npm install zod` en la **raíz del proyecto** (donde está `package.json`)
2. Verificar instalación: `npm list zod`
3. Vercel incluirá automáticamente `zod` en el build de serverless functions si está en `package.json`
4. NO es necesario instalarlo como `devDependency` - debe ser `dependency` normal

---

## 📋 Checklist de Implementación

### Acción 1: CORS
- [ ] Crear `api/lib/cors.js`
- [ ] Actualizar `api/proxy.js`
- [ ] Actualizar `api/auth.js`
- [ ] Actualizar `api/bcra.js`
- [ ] Configurar variables de entorno en Vercel
- [ ] Testing local
- [ ] Testing en preview de Vercel

### Acción 2: Validación
- [ ] Instalar `zod`
- [ ] Crear `api/lib/validations.js`
- [ ] Actualizar `api/proxy.js` con validación
- [ ] Actualizar `api/auth.js` con validación
- [ ] Testing de casos válidos
- [ ] Testing de casos inválidos (edge cases)

### Acción 3: Refactoring Frontend
- [ ] Crear estructura de carpetas
- [ ] Extraer `useAuth.js`
- [ ] Extraer `useXubioAPI.js`
- [ ] Extraer funciones de utilidad
- [ ] Refactorizar `app.js` para usar composables
- [ ] Testing funcional (verificar que todo funciona igual)
- [ ] **Opcional**: Extraer componentes (más complejo sin build system)

---

## 🚀 Orden de Implementación Recomendado

1. **Primero: CORS** (1-2h) - Más rápido, impacto inmediato en seguridad
2. **Segundo: Validación** (2-3h) - Seguridad crítica, dependiente de CORS
3. **Tercero: Refactoring Frontend** (4-6h) - Mejora arquitectura, más complejo

**Tiempo total estimado**: 7-11 horas de desarrollo + testing

---

## ⚠️ Consideraciones Importantes

### Para Testing (No Producción)
- CORS puede mantener algún nivel de permisividad durante desarrollo
- Validación puede ser más flexible pero DEBE estar presente
- Refactoring puede ser incremental sin presión de tiempo

### Variables de Entorno
- **Backend (serverless)**: `process.env` funciona normalmente ✅
- **Frontend (sin build)**: NO usar `process.env`. Usar:
  - Rutas relativas (`/api/proxy`) - ✅ Ya implementado
  - Constantes en archivo JS si es necesario
  - O inyectar en `window` desde HTML (solo si realmente necesario)

### Módulos ES6 vs Namespace Global
- **Namespace Global (Recomendado)**: Más simple, funciona en todos los navegadores, sin problemas de MIME/CORS
- **Módulos ES6**: Funciona pero requiere `type="module"`, rutas con `.js` explícito, y puede tener edge cases

### Testing después de cada cambio
- ✅ Probar funcionalidad existente
- ✅ Verificar que no se rompió nada
- ✅ Hacer commit después de cada acción completada
- ✅ Probar en `vercel dev` localmente antes de deploy

### Rollback Plan
- Cada cambio debe estar en su propio commit
- Facilita revertir si algo se rompe
- Mantener branch de backup antes de empezar

### Instalación de Dependencias
- ✅ `zod` debe instalarse en la raíz donde está `package.json`
- ✅ Vercel incluirá automáticamente en el build si está en `package.json`
- ✅ Verificar con `npm list zod` después de instalar

---

## 📝 Notas Finales

Este plan está diseñado para ser **incremental y seguro**, permitiendo implementar mejoras sin romper la funcionalidad existente. Cada acción puede hacerse de forma independiente y probada antes de continuar.

**Siguiente paso después de completar estas 3 acciones**:
- Implementar rate limiting (siguiente prioridad media)
- Agregar tests básicos
- Considerar migración completa a Next.js o Vite (futuro)

