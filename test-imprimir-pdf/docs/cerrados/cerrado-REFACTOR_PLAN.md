# Plan de Refactorización: Test Xubio Web App

Este documento detalla el plan de refactorización para la aplicación de testing `index.html`. El objetivo es transformar el prototipo monolítico actual en una aplicación modular, segura y mantenible.

## 🎯 Objetivos Principales

1.  **Seguridad (Critical):** Eliminar credenciales del almacenamiento local del navegador y mover la lógica de autenticación al servidor (Proxy).
2.  **Mantenibilidad:** Separar la vista (HTML), el estilo (CSS) y la lógica (JS).
3.  **Mejora de Código:** Implementar un framework ligero (Vue.js) para manejar el estado y la reactividad, eliminando la manipulación manual del DOM.

## 🍰 Estrategia: Thin Slicing (Rebanadas Finas)

En lugar de reescribir todo de una vez, aplicaremos cambios incrementales. Cada "slice" o paso debe dejar la aplicación en un estado funcional.

---

## 📅 Hoja de Ruta Detallada

### Slice 1: Modularización Básica (Separation of Concerns)
*Objetivo: Ordenar la casa sin cambiar la lógica funcional.*

1.  **Estructura de Carpetas:** Crear la estructura `test-imprimir-pdf/assets/` (respetando el routing de Vercel).
2.  **Extraer CSS:** Mover todos los estilos `<style>` a `test-imprimir-pdf/assets/styles.css`.
3.  **Extraer JS:** Mover todo el script `<script>` a `test-imprimir-pdf/assets/app.js`.
4.  **Limpiar HTML:** El `index.html` solo debe contener la estructura y las referencias relativas a los nuevos archivos (`./assets/styles.css`, `./assets/app.js`).
5.  **Verificación Manual:** Comprobar manualmente que la app funciona exactamente igual que antes (login, crear factura, ver PDF, listar facturas).

### Slice 2: Hardening de Seguridad (Server-Side Auth)
*Objetivo: Proteger el `client_secret` procesándolo en el servidor, evitando que sea visible en el código del cliente o en logs del navegador.*

**Decisión de Arquitectura:** El usuario seguirá introduciendo `clientId` y `secretId` manualmente desde la app, pero estas credenciales se enviarán al servidor de forma segura (POST body) y el servidor construirá el Basic Auth internamente. El `client_secret` nunca se construye ni se expone en el cliente.

1.  **Backend - Nuevo Endpoint de Autenticación:**
    *   Crear `/api/auth.js` (endpoint específico, no modificar el proxy genérico).
    *   El endpoint:
        *   Recibe `clientId` y `secretId` en el body del POST (JSON).
        *   Construye el header `Authorization: Basic ${btoa(clientId:secretId)}` **en el servidor** (nunca en el cliente).
        *   Hace POST a `https://xubio.com/API/1.1/TokenEndpoint` con `grant_type=client_credentials`.
        *   Devuelve solo `{ access_token, expires_in }` al cliente (nunca las credenciales).
        *   No loguea las credenciales en consola del servidor (solo errores genéricos).

2.  **Frontend - Refactorización:**
    *   Mantener inputs `clientId` y `secretId` en el HTML (el usuario los introduce manualmente).
    *   Mantener checkbox "Guardar credenciales" (opcional, para UX).
    *   Actualizar `obtenerToken()` para:
        *   Leer `clientId` y `secretId` desde los inputs (o localStorage si está guardado).
        *   Enviar POST a `/api/auth` con `{ clientId, secretId }` en el body (JSON).
        *   **Eliminar** la construcción de header `Authorization: Basic` en el cliente (esto ahora lo hace el servidor).
    *   Mantener guardado de credenciales en localStorage (opcional, según checkbox).
    *   Mantener función `limpiarCredenciales()`.
    *   Mantener guardado de `access_token` en localStorage.
    *   Mantener lógica de renovación automática de token en `requestXubio()`.

3.  **Seguridad:**
    *   El `client_secret` nunca se construye en el cliente (no más `btoa()` en el frontend).
    *   Las credenciales se envían por HTTPS al servidor (Vercel maneja esto automáticamente).
    *   El servidor no expone las credenciales en la respuesta.
    *   Las credenciales pueden seguir guardándose en localStorage (es una decisión de UX, no de seguridad crítica para una app de testing).

### Slice 3: Migración a Vue.js (Reactivity)
*Objetivo: Eliminar el "Spaghetti Code" de manipulación del DOM usando Vue.js 3.*

1.  **Setup:**
    *   Importar Vue.js 3 via CDN en `index.html`: `<script src="https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js"></script>` (versión específica + producción).
    *   Asegurar que se carga antes de `app.js`.

2.  **Estado Global:**
    *   Crear una instancia de Vue (`const app = Vue.createApp({...})`) en `app.js`.
    *   Mover variables globales (`accessToken`, `tokenExpiration`) al `data()` del componente.
    *   Agregar estados reactivos: `isLoading`, `errorMessage`, `clientId`, `secretId`, etc.

3.  **Migración de UI (Iterativa):**
    *   **Auth:** Convertir sección de autenticación a template de Vue:
        *   Reemplazar `onclick="obtenerToken()"` por `@click="obtenerToken"`.
        *   Mantener inputs de credenciales pero con `v-model` (ej: `v-model="clientId"`).
        *   Mantener checkbox "Guardar credenciales" con `v-model="guardarCredenciales"`.
        *   Mostrar estado del token con `v-if/v-show` y propiedades reactivas.
    *   **Facturas:** Migrar formularios a `v-model`:
        *   `<input id="facturaClienteId">` → `<input v-model="facturaClienteId">`.
        *   Reemplazar todos los `document.getElementById()` por bindings de Vue.
    *   **Listados:** Reemplazar generación de tablas:
        *   Eliminar `innerHTML` y construcción manual de tablas.
        *   Usar `v-for` en el template HTML para renderizar facturas.
        *   Usar `@click` en lugar de `onclick` para eventos.

4.  **Lógica:**
    *   Mover todas las funciones (`obtenerToken`, `flujoCompletoFactura`, `requestXubio`, etc.) a `methods`.
    *   Actualizar referencias: `document.getElementById()` → `this.propertyName`.
    *   Usar `this.mostrarResultado()` en lugar de pasar `div` como parámetro.

5.  **Montaje:**
    *   Usar `app.mount('#app')` al final de `app.js`.
    *   Envolver el contenido del body en `<div id="app">...</div>`.

### Slice 4: Refinamiento de UX y Código
*Objetivo: Pulir la experiencia y el código.*

1.  **Feedback Visual:**
    *   Usar propiedades computadas o watchers para mostrar estados de carga (`isLoading`).
    *   Deshabilitar botones automáticamente cuando `isLoading === true` usando `:disabled="isLoading"`.
    *   Mostrar spinners o mensajes de carga con `v-if="isLoading"`.

2.  **Manejo de Errores:**
    *   Crear función centralizada `handleError(error, context)` en `methods`.
    *   Unificar formato de errores mostrados al usuario.
    *   Logging consistente en consola para debugging.
    *   Manejar errores 401 (token expirado) automáticamente con retry.

3.  **Optimizaciones:**
    *   Usar `computed` para valores derivados (ej: `tokenValido`).
    *   Limpiar código muerto y comentarios obsoletos.
    *   Agregar JSDoc básico en funciones principales.

---

## 🔧 Detalles Técnicos de Implementación

### Slice 2: Endpoint de Autenticación (`/api/auth.js`)

Ejemplo de implementación del endpoint:

```javascript
// /api/auth.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Recibir credenciales del cliente en el body
  const { clientId, secretId } = req.body;

  if (!clientId || !secretId) {
    return res.status(400).json({ 
      error: 'Missing credentials: clientId and secretId are required' 
    });
  }

  try {
    // Construir Basic Auth EN EL SERVIDOR (nunca en el cliente)
    const basic = Buffer.from(`${clientId}:${secretId}`).toString('base64');
    
    const response = await fetch('https://xubio.com/API/1.1/TokenEndpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();

    if (!response.ok) {
      // No exponer detalles sensibles en el error
      return res.status(response.status).json({ 
        error: 'Failed to obtain token',
        message: data.error_description || 'Authentication failed'
      });
    }

    // Devolver solo el token, nunca las credenciales
    return res.status(200).json({
      access_token: data.access_token || data.token,
      expires_in: data.expires_in || 3600
    });
  } catch (error) {
    // No loguear credenciales en consola
    console.error('[AUTH] Error obtaining token:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process authentication request'
    });
  }
}
```

### Slice 2: Refactorización de `obtenerToken()` en Frontend

Antes (actual - INSEGURO):
```javascript
const basic = btoa(`${clientId}:${secretId}`); // ❌ Construye Basic Auth en el cliente
const response = await fetch(`${PROXY_BASE}/TokenEndpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${basic}`, // ❌ Expone credenciales en headers
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  body: 'grant_type=client_credentials'
});
```

Después (refactorizado - SEGURO):
```javascript
// Leer credenciales desde inputs o localStorage
const clientId = document.getElementById('clientId').value.trim();
const secretId = document.getElementById('secretId').value.trim();

// Enviar credenciales al servidor (HTTPS protege el transporte)
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ clientId, secretId }) // ✅ Credenciales en body, servidor construye Basic Auth
});

const data = await response.json();
// ✅ Solo recibimos el token, nunca las credenciales
accessToken = data.access_token;
```

### Slice 3: Estructura Básica de Vue App

```javascript
// app.js
const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      accessToken: null,
      tokenExpiration: null,
      isLoading: false,
      errorMessage: null,
      // ... otros estados
    };
  },
  computed: {
    tokenValido() {
      return this.accessToken && 
             this.tokenExpiration && 
             Date.now() < this.tokenExpiration - 60000;
    }
  },
  methods: {
    async obtenerToken() {
      // Lógica migrada aquí
    },
    // ... otros métodos
  },
  mounted() {
    // Cargar token guardado si existe
    const savedToken = localStorage.getItem('xubio_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }
});

app.mount('#app');
```

---

## ✅ Checklist para el Desarrollador

### Preparación
- [x] Crear estructura de carpetas: `test-imprimir-pdf/assets/`.
- [x] **Opcional - Solo si usas Vercel CLI local**: Asegurar que el entorno local esté corriendo: `vercel dev`.
- [x] **Alternativa (Recomendada)**: Desplegar directamente en Vercel y probar en producción.
- [x] Verificar que el routing funciona correctamente:
    - [x] **Si usas producción**: Abrir tu URL de Vercel y verificar que carga la aplicación
    - [x] **Si usas local**: Abrir `http://localhost:3000` y verificar que carga `test-imprimir-pdf/index.html`
    - [x] Verificar que `/api/proxy/*` funciona (probar con un request)
    - [x] Verificar que `/api/auth` funciona (debe responder 405 para GET, 400 para POST sin body)
    - [x] Verificar que los assets cargan: `./assets/styles.css` y `./assets/app.js` (en producción o local)

### Ejecución - Slice 1 (Modularización)
- [x] Crear `test-imprimir-pdf/assets/styles.css` y mover todo el contenido de `<style>`.
- [x] Crear `test-imprimir-pdf/assets/app.js` y mover todo el contenido de `<script>`.
- [x] Actualizar `index.html`: agregar `<link rel="stylesheet" href="./assets/styles.css">` y `<script src="./assets/app.js"></script>`.
- [x] Eliminar `<style>` y `<script>` del HTML.
- [x] **Verificación Manual - Slice 1:**
    - [x] Abrir la app en el navegador y verificar que los estilos se cargan correctamente
    - [x] Verificar que no hay errores en consola del navegador (F12 → Console)
    - [x] Verificar que el HTML no contiene tags `<style>` ni `<script>` (solo referencias externas)
    - [x] Probar funcionalidad básica:
        - [x] Login: Ingresar credenciales y obtener token
        - [x] Crear factura: Completar formulario y crear factura
        - [x] Ver PDF: Verificar que el PDF se muestra correctamente
        - [x] Listar facturas: Verificar que la tabla se renderiza correctamente
    - [x] Todo debe funcionar exactamente igual que antes de la modularización

### Ejecución - Slice 2 (Seguridad)
- [x] Crear `/api/auth.js` con la lógica de autenticación:
    - [x] Recibir `{ clientId, secretId }` en el body del POST.
    - [x] Construir `Authorization: Basic` en el servidor (usar `Buffer.from()` en Node.js).
    - [x] Hacer request a Xubio TokenEndpoint.
    - [x] Devolver solo `{ access_token, expires_in }` al cliente.
- [x] Refactorizar `obtenerToken()` en `app.js`:
    - [x] Leer `clientId` y `secretId` desde inputs o localStorage.
    - [x] Enviar POST a `/api/auth` con `{ clientId, secretId }` en el body (JSON).
    - [x] **Eliminar** construcción de `btoa()` y header `Authorization: Basic` en el cliente.
- [x] Mantener inputs `clientId` y `secretId` en el HTML (no eliminar).
- [x] Mantener checkbox "Guardar credenciales" y su funcionalidad.
- [x] Mantener función `limpiarCredenciales()`.
- [x] Mantener guardado de `access_token` en localStorage.
- [x] **Verificación Manual - Slice 2 (Seguridad):**
    - [x] Abrir DevTools (F12) → Network tab
    - [x] Ingresar credenciales y hacer clic en "Obtener Token"
    - [x] Verificar en Network tab:
        - [x] El request a `/api/auth` muestra `clientId` y `secretId` en el **body** (Request Payload)
        - [x] **NO** debe aparecer header `Authorization: Basic` en el request del cliente
        - [x] La respuesta solo contiene `{ access_token, expires_in }` (sin credenciales)
    - [x] Verificar en Console tab:
        - [x] **NO** debe aparecer `btoa()` en ningún log
        - [x] **NO** debe aparecer el `client_secret` construido
    - [x] Verificar en Sources tab:
        - [x] Buscar `btoa` en `app.js` → **NO** debe aparecer
        - [x] Buscar `Authorization: Basic` en `app.js` → **NO** debe aparecer
    - [x] Verificar funcionalidad:
        - [x] El token se obtiene correctamente
        - [x] El token se guarda en localStorage
        - [x] Las credenciales se guardan en localStorage si el checkbox está marcado
        - [x] El botón "Limpiar Credenciales" funciona correctamente

### Ejecución - Slice 3 (Vue.js)
- [x] Agregar `<script src="https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js"></script>` en `index.html` (antes de `app.js`).
- [x] Envolver contenido del body en `<div id="app">...</div>`.
- [x] Inicializar Vue app en `app.js`: `const app = Vue.createApp({ data() {...}, methods: {...} })`.
- [x] Mover variables globales (`accessToken`, `tokenExpiration`) a `data()`.
- [x] Mover todas las funciones a `methods`.
- [x] Refactorizar inputs: reemplazar `id="..."` y `document.getElementById()` por `v-model`.
- [x] Refactorizar botones: reemplazar `onclick="..."` por `@click="..."`.
- [x] Refactorizar tablas: usar `v-for` en lugar de `innerHTML`.
- [x] Agregar `app.mount('#app')` al final de `app.js`.
- [x] **Verificación Manual - Slice 3 (Vue.js):**
    - [x] Abrir DevTools (F12) → Console tab
    - [x] Verificar que Vue se carga correctamente (no debe haber errores de Vue)
    - [x] Verificar reactividad:
        - [x] Cambiar valor en input de `clientId` → debe actualizarse en `v-model`
        - [x] Cambiar checkbox "Guardar credenciales" → debe actualizarse reactivamente
    - [x] Verificar que no hay manipulación manual del DOM:
        - [x] Buscar `document.getElementById` en `app.js` → **NO** debe aparecer (excepto en casos muy específicos)
        - [x] Buscar `innerHTML` para tablas → **NO** debe aparecer (debe usar `v-for`)
    - [x] Probar todos los flujos:
        - [x] Autenticación completa
        - [x] Listar productos y seleccionar
        - [x] Crear factura con productos seleccionados
        - [x] Obtener PDF de factura
        - [x] Crear cobranza
        - [x] Obtener PDF de cobranza
        - [x] Listar facturas del último mes
        - [x] Seleccionar factura de la lista
        - [x] Obtener PDF de comprobante existente
    - [x] Verificar que la app funciona igual que antes pero con código más limpio
    - [x] Verificar en Sources tab que `app.js` usa sintaxis Vue (data(), methods, computed, etc.)

### Ejecución - Slice 4 (Refinamiento)
- [x] Agregar estados reactivos: `isLoading`, `errorMessage` en `data()`.
- [x] Usar `:disabled="isLoading"` en botones.
- [x] Mostrar spinners/mensajes de carga con `v-if="isLoading"`.
- [x] Crear función `handleError(error, context)` centralizada.
- [x] Agregar `computed` para valores derivados (ej: `tokenValido`).
- [x] Limpiar código muerto y comentarios obsoletos.
- [x] Agregar JSDoc básico en funciones principales.
- [x] **Verificación Manual - Slice 4 (Refinamiento):**
    - [x] Verificar estados de carga:
        - [x] Al hacer clic en cualquier botón, debe aparecer indicador de carga
        - [x] Los botones deben deshabilitarse automáticamente durante la carga (`:disabled="isLoading"`)
        - [x] El mensaje de carga debe ser contextual (`loadingContext` muestra qué se está cargando)
    - [x] Verificar manejo de errores:
        - [x] Probar con credenciales incorrectas → debe mostrar error claro
        - [x] Probar con token expirado → debe manejar el 401 y renovar automáticamente
        - [x] Los errores deben mostrarse de forma consistente (mismo formato)
    - [x] Verificar computed properties:
        - [x] `tokenValido` debe actualizarse automáticamente cuando cambia `accessToken` o `tokenExpiration`
    - [x] Verificar UX mejorada:
        - [x] Los mensajes de éxito/error son más claros
        - [x] La experiencia de carga es más fluida
        - [x] No hay "botones fantasma" (botones clickeables durante carga)
    - [x] Verificar código limpio:
        - [x] No hay código muerto comentado
        - [x] Las funciones principales tienen JSDoc
        - [x] El código es más legible que antes

### Finalización
- [x] **Validación End-to-End Completa:**
    - [x] Flujo completo de autenticación:
        - [x] Ingresar credenciales → Obtener token → Verificar que se guarda
        - [x] Recargar página → Verificar que el token se carga automáticamente
        - [x] Si el token expiró → Verificar renovación automática
    - [x] Flujo completo de factura:
        - [x] Listar productos → Seleccionar productos → Ajustar cantidades/precios
        - [x] Crear factura → Verificar que se crea correctamente
        - [x] Obtener PDF → Verificar que el PDF se muestra correctamente
    - [x] Flujo completo de cobranza:
        - [x] Crear cobranza asociada a factura → Verificar creación
        - [x] Obtener PDF de cobranza → Verificar visualización
    - [x] Flujo de listado y selección:
        - [x] Listar facturas del último mes → Verificar tabla
        - [x] Seleccionar factura → Verificar que se copian los IDs
    - [x] Flujo de PDF existente:
        - [x] Ingresar Transaction ID → Obtener PDF → Verificar diferentes tipos de impresión (1, 2, 3, 0)
- [x] **Verificación de Consola:**
    - [x] Abrir DevTools (F12) → Console tab
    - [x] Recargar página → **NO** debe haber errores (solo warnings menores si los hay)
    - [x] Ejecutar todos los flujos → **NO** debe haber errores en consola
    - [x] Verificar que los logs estructurados aparecen en consola (formato JSON)
- [x] **Documentación:**
    - [x] Actualizar `README.md` con:
        - [x] Instrucciones de desarrollo local (`vercel dev`)
        - [x] Estructura del proyecto
        - [x] Configuración de variables de entorno (si aplica)
        - [x] Endpoints disponibles (`/api/auth`, `/api/proxy/*`)
        - [x] Notas sobre seguridad (credenciales en servidor)

---

## ✅ Mejoras Aplicadas (Post-Review)

### Mejoras de Performance y Seguridad

#### 1. CDN de Vue.js - Versión Específica ✅
**Problema:** Uso de `vue@3` sin version pinning podía causar breaking changes inesperados.

**Solución Aplicada:**
- Cambiado a `vue@3.4.21/dist/vue.global.prod.js` (versión específica + build de producción)
- Beneficios:
  - Evita breaking changes inesperados
  - Bundle más pequeño (versión de producción)
  - Mejor performance

**Archivo modificado:** `test-imprimir-pdf/index.html`

#### 2. Logging Estructurado ✅
**Problema:** Logging básico dificultaba debugging en producción (Vercel Logs).

**Solución Aplicada:**
- Logging estructurado en JSON para fácil parsing en Vercel Logs
- Eventos trackeados:
  - `auth_success`: Autenticación exitosa con duración
  - `auth_failed`: Fallo de autenticación con status y tipo de error
  - `auth_error`: Errores de red/sistema
  - `auth_validation_failed`: Validación de credenciales fallida

**Beneficios:**
- Fácil debugging en Vercel Dashboard
- Métricas de performance (duración de requests)
- Tracking de errores sin exponer credenciales

**Archivo modificado:** `api/auth.js`

#### 3. Validación Mejorada de Credenciales ✅
**Problema:** Validación básica no detectaba strings vacíos después de trim.

**Solución Aplicada:**
- Validación de credenciales no vacías después de `trim()`
- Mensajes de error más claros y específicos
- Logging de razones de validación fallida

**Archivo modificado:** `api/auth.js`

### Decisiones Técnicas para Escala Pequeña (3 usuarios)

**Optimizaciones NO aplicadas (por ahora):**
- ❌ Rate Limiting: No necesario para 3 usuarios controlados
- ❌ SRI (Subresource Integrity): Opcional para app privada
- ❌ TypeScript: JSDoc es suficiente para escala pequeña
- ❌ Tests automatizados: Verificación manual es suficiente
- ❌ Cache en servidor: localStorage es suficiente

**Razón:** Para una app de testing con máximo 3 usuarios, estas optimizaciones agregarían complejidad sin beneficio significativo. Se pueden implementar fácilmente si se necesita escalar en el futuro.

### Próximos Pasos Opcionales

Si en el futuro necesitas escalar o mejorar:

1. **Rate Limiting** (si la app se vuelve pública):
   - Implementar con Vercel Edge Config o middleware
   - ~30 minutos de implementación

2. **SRI para Vue.js** (si quieres seguridad extra):
   - Agregar `integrity` y `crossorigin` al script tag
   - ~5 minutos de implementación

3. **TypeScript** (si el código crece):
   - Migración gradual empezando por `/api/*.js`
   - Mejor DX y type safety

4. **Tests E2E** (si se vuelve crítico):
   - Playwright o Cypress para flujos principales
   - Útil para regresiones

---

## 📝 Notas de Implementación

- **Contexto:** App de testing, máximo 3 usuarios en producción
- **Prioridad:** Funcionalidad > Optimizaciones avanzadas
- **Filosofía:** "Make it work, make it right, make it fast" (en ese orden)