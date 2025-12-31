# Arquitectura del Proyecto - Test Xubio PDF

**Fecha**: 2025-12-31
**Versión**: 2.0 (Post-Refactorización)
**Estado**: ✅ Producción
**Patrón**: Divide y Conquista + Container/Presentational

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Arquitectura de Componentes](#arquitectura-de-componentes)
4. [Flujo de Datos](#flujo-de-datos)
5. [Patrones de Diseño](#patrones-de-diseño)
6. [Componentes Principales](#componentes-principales)
7. [Sistema de Comunicación](#sistema-de-comunicación)
8. [SDK y Servicios](#sdk-y-servicios)
9. [Convenciones de Código](#convenciones-de-código)
10. [Guía de Mantenimiento](#guía-de-mantenimiento)

---

## 🎯 Visión General

### Propósito
Aplicación Vue 3 para crear facturas y cobranzas usando la API de Xubio, con generación automática de PDFs.

### Arquitectura
**Patrón Principal**: Container/Presentational Pattern
- **Container** (`App.vue` + `app.js`): Orquestador sin lógica de negocio
- **Presentational** (`Tab*`): Componentes especializados con lógica completa

### Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Total de Líneas** | 233 líneas (app.js + App.vue) |
| **app.js** | 178 líneas (orquestador + token management) |
| **App.vue** | 55 líneas (template) |
| **Bundle Size** | 110.31 kB |
| **Componentes Tab** | 3 (Auth, Factura, Cobranza) |
| **Reducción vs Legacy** | -94.3% de código (4118 → 233) |

---

## 📁 Estructura de Archivos

```
test-imprimir-pdf/
│
├── assets/
│   ├── App.vue                    # 55 líneas - Template principal
│   ├── app.js                     # 178 líneas - Orquestador + Token Management
│   │
│   ├── components/                # Componentes Vue
│   │   ├── TabAuth.vue           # 458 líneas - Autenticación
│   │   ├── TabFactura.vue        # 620 líneas - Facturas
│   │   ├── TabCobranza.vue       # 637 líneas - Cobranzas
│   │   ├── PdfViewer.vue         # 87 líneas - Visor PDF global
│   │   ├── ClienteSelector.vue   # Selector de clientes
│   │   ├── ProductoSelector.vue  # Selector de productos
│   │   └── PuntoVentaSelector.vue # Selector de puntos de venta
│   │
│   ├── composables/               # Composables Vue (legacy, no usados)
│   │   ├── useAuth.js
│   │   ├── useFacturas.js
│   │   ├── useCobranzas.js
│   │   ├── usePuntosDeVenta.js
│   │   └── useDiagnostico.js
│   │
│   ├── services/                  # Capa de servicios (legacy)
│   │   └── xubioApi.js
│   │
│   └── utils/                     # Utilidades compartidas
│       ├── cache.js              # Sistema de cache
│       ├── formatters.js         # Formateo de datos
│       ├── validators.js         # Validaciones
│       ├── transformers.js       # Transformación de datos
│       ├── constants.js          # Constantes
│       ├── logger.js             # Sistema de logging
│       └── api-logger.js         # Logger específico de API
│
├── sdk/                           # SDK Xubio (usado activamente)
│   ├── xubioClient.js            # Cliente HTTP base
│   ├── facturaService.js         # Servicio de facturas
│   └── cobranzaService.js        # Servicio de cobranzas
│
├── docs/                          # Documentación
│   ├── REFACTOR_CHECKPOINT.md    # Historial de refactorización
│   ├── Guias/
│   │   └── ARQUITECTURA_PROYECTO.md  # Este documento
│   └── ADRS/                      # Architecture Decision Records
│
├── index.html                     # Entry point
├── package.json                   # Dependencias
└── vite.config.js                 # Configuración Vite
```

---

## 🏗️ Arquitectura de Componentes

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue (55 líneas)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Navegación: [🔐 Auth] [🧾 Facturas] [💰 Cobranzas]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  TabAuth     │  │ TabFactura   │  │ TabCobranza  │     │
│  │  (458 líneas)│  │ (620 líneas) │  │ (637 líneas) │     │
│  │              │  │              │  │              │     │
│  │ @login-      │  │ @show-pdf    │  │ @show-pdf    │     │
│  │  success     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │  PdfViewer  │                         │
│                    │  (87 líneas)│                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   app.js    │
                    │ (113 líneas)│
                    │             │
                    │ provide():  │
                    │  - sdk      │
                    │  - showToast│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ XubioClient │
                    │   (SDK)     │
                    └─────────────┘
```

### Jerarquía de Componentes

```
App (Container)
├── TabAuth (Presentational)
│   └── [Lógica de autenticación completa]
│
├── TabFactura (Presentational)
│   ├── ClienteSelector
│   ├── ProductoSelector
│   ├── PuntoVentaSelector
│   └── [Lógica de facturación completa]
│
├── TabCobranza (Presentational)
│   └── [Lógica de cobranzas completa]
│
└── PdfViewer (Presentational)
    └── [Visor modal de PDFs]
```

---

## 🔄 Flujo de Datos

### 1. Flujo de Autenticación

```
Usuario → TabAuth.vue
           │
           ├─ Input: clientId, secretId
           │
           ├─ SDK: POST /api/auth
           │
           ├─ Recibe: { token, expiration }
           │
           └─ Emite: @login-success → App.vue
                                        │
                                        ├─ Guarda: accessToken, tokenExpiration
                                        │
                                        ├─ Crea: XubioClient(token)
                                        │
                                        ├─ Provee: sdk → TabFactura, TabCobranza
                                        │
                                        └─ Cambia: currentTab = 'factura'
```

### 2. Flujo de Creación de Factura

```
Usuario → TabFactura.vue
           │
           ├─ 1. mounted(): Carga inicial
           │   ├─ cargarClientes()
           │   ├─ cargarProductos()
           │   └─ cargarPuntosDeVenta()
           │
           ├─ 2. Usuario selecciona:
           │   ├─ Cliente (ClienteSelector)
           │   ├─ Productos (ProductoSelector)
           │   └─ Punto de Venta (PuntoVentaSelector)
           │
           ├─ 3. Usuario click: "Crear Factura"
           │   │
           │   ├─ construirPayload()
           │   │   ├─ Validar datos
           │   │   └─ Estructura JSON completa
           │   │
           │   ├─ SDK: sdk.crearFactura(payload)
           │   │   └─ POST /comprobanteVentaBean
           │   │
           │   ├─ Recibe: { transaccionId, numeroComprobante }
           │   │
           │   └─ obtenerPDF(transaccionId)
           │       │
           │       ├─ SDK: sdk.obtenerPDF(transaccionId, '1')
           │       │   └─ GET /imprimir/{transaccionId}
           │       │
           │       ├─ Recibe: pdfUrl (base64 o URL)
           │       │
           │       └─ Emite: @show-pdf(pdfUrl) → App.vue
           │                                       │
           │                                       └─ PdfViewer se muestra
```

### 3. Flujo de Creación de Cobranza

```
Usuario → TabCobranza.vue
           │
           ├─ 1. mounted(): cargarClientes()
           │
           ├─ 2. Usuario selecciona cliente
           │   └─ cargarFacturasPendientes(clienteId)
           │       └─ SDK: GET /comprobantesAsociados
           │
           ├─ 3. Usuario selecciona factura pendiente
           │   └─ Pre-rellena importe con saldo
           │
           ├─ 4. Usuario click: "Crear Cobranza"
           │   │
           │   ├─ Obtener datos factura:
           │   │   └─ SDK: GET /comprobanteVentaBean/{id}
           │   │
           │   ├─ construirPayload()
           │   │   └─ Estructura con detalleCobranzas
           │   │
           │   ├─ SDK: sdk.crearCobranza(payload)
           │   │   └─ POST /cobranzaBean
           │   │
           │   └─ obtenerPDF(transaccionId)
           │       └─ Emite: @show-pdf(pdfUrl) → App.vue
```

---

## 🎨 Patrones de Diseño

### 1. Container/Presentational Pattern

**Container** (`app.js` + `App.vue`):
- Gestiona estado global (currentTab, pdfUrl, pdfVisible)
- Provee dependencias (SDK, showToast)
- Maneja eventos de componentes hijos
- **CERO lógica de negocio**

**Presentational** (`Tab*.vue`):
- Componentes autónomos y completos
- Toda la lógica de negocio interna
- Se comunican vía eventos (@login-success, @show-pdf)
- Reciben dependencias vía inject

### 2. Dependency Injection (provide/inject)

```javascript
// app.js - Container provee
provide() {
  return {
    sdk: () => this.xubioSdk,        // SDK compartido
    showToast: this.showToast         // Sistema de notificaciones
  };
}

// TabFactura.vue - Presentational inyecta
inject: {
  sdk: { from: 'sdk', default: () => null },
  showToast: { from: 'showToast', default: () => (msg) => console.log(msg) }
}
```

### 3. Event-Driven Architecture

**Comunicación padre → hijo**: Props (no usado actualmente, todo via inject)
**Comunicación hijo → padre**: Eventos personalizados

```javascript
// TabAuth.vue emite
this.$emit('login-success', { token, expiration });

// App.vue escucha
<tab-auth @login-success="handleLogin"></tab-auth>

// TabFactura.vue emite
this.$emit('show-pdf', pdfUrl);

// App.vue escucha
<tab-factura @show-pdf="handleShowPdf"></tab-factura>
```

### 4. Single Responsibility Principle

Cada componente tiene UNA responsabilidad clara:

| Componente | Responsabilidad |
|------------|-----------------|
| `App.vue` | Navegación y layout |
| `app.js` | Orquestación y provide |
| `TabAuth.vue` | Autenticación completa |
| `TabFactura.vue` | Creación de facturas |
| `TabCobranza.vue` | Creación de cobranzas |
| `PdfViewer.vue` | Visualización de PDFs |

### 5. Composición sobre Herencia

Los componentes Tab usan selectores como bloques:
- `ClienteSelector`: Reutilizado en TabFactura y TabCobranza
- `ProductoSelector`: Usado en TabFactura
- `PuntoVentaSelector`: Usado en TabFactura

---

## 🧩 Componentes Principales

### App.vue (55 líneas)

**Responsabilidad**: Template principal y navegación

```vue
<template>
  <div class="container">
    <!-- Navegación de tabs -->
    <button @click="currentTab = 'auth'">🔐 Autenticación</button>
    <button @click="currentTab = 'factura'">🧾 Facturas</button>
    <button @click="currentTab = 'cobranza'">💰 Cobranzas</button>

    <!-- Renderizado condicional de tabs -->
    <tab-auth v-if="currentTab === 'auth'" @login-success="handleLogin" />
    <tab-factura v-if="currentTab === 'factura'" @show-pdf="handleShowPdf" />
    <tab-cobranza v-if="currentTab === 'cobranza'" @show-pdf="handleShowPdf" />

    <!-- Visor PDF global -->
    <pdf-viewer :url="pdfUrl" :visible="pdfVisible" @close="closePdf" />
  </div>
</template>
```

**Estado**:
- `currentTab`: 'auth' | 'factura' | 'cobranza'
- `pdfUrl`: URL del PDF a mostrar
- `pdfVisible`: boolean

**Métodos**: Ninguno (importa appOptions de app.js)

---

### app.js (178 líneas)

**Responsabilidad**: Orquestador, proveedor de dependencias y token management

**Data (8 propiedades)**:
```javascript
{
  currentTab: 'auth',           // Navegación
  pdfUrl: null,                 // Visor PDF
  pdfVisible: false,            // Visor PDF
  accessToken: null,            // Token JWT
  tokenExpiration: null,        // Timestamp expiración
  clientId: null,               // Client ID Xubio
  secretId: null,               // Secret ID Xubio
  xubioSdk: null               // Instancia apiClient (createXubioApiClient)
}
```

**provide() - Dependency Injection**:
```javascript
provide() {
  return {
    sdk: () => this.xubioSdk,      // API Client compartido
    showToast: this.showToast       // Notificaciones
  };
}
```

**methods (7 métodos)**:

1. **`showToast(message, type)`**
   - Muestra notificaciones (actualmente console.log)
   - Tipos: 'success', 'error', 'warning', 'info'

2. **`isTokenValid()`**
   - Verifica si el token actual es válido
   - Margen de 60 segundos para renovación

3. **`getAccessToken()`**
   - Retorna el token actual sin renovación
   - Usado por el API client

4. **`renewToken()`**
   - Renueva el token usando clientId y secretId
   - POST a /api/auth
   - Actualiza accessToken y tokenExpiration

5. **`handleShowPdf(url)`**
   - Abre el visor PDF global
   - Usado por TabFactura y TabCobranza

6. **`closePdf()`**
   - Cierra el visor PDF global

7. **`handleLogin(data)`**
   - Recibe { token, expiration, clientId, secretId } de TabAuth
   - Guarda credenciales para renovación automática
   - Crea apiClient con createXubioApiClient()
   - Cambia a pestaña 'factura'

---

### TabAuth.vue (458 líneas)

**Responsabilidad**: Autenticación completa con Xubio API

**Flujo**:
1. Usuario ingresa `clientId` y `secretId`
2. Click en "Obtener Token"
3. POST a `/api/auth` vía fetch directo (no usa SDK)
4. Recibe token JWT + expiración
5. Guarda en localStorage (opcional)
6. Emite `@login-success` con { token, expiration, clientId, secretId }

**Características**:
- ✅ Validación de campos requeridos
- ✅ Carga de credenciales desde localStorage
- ✅ Opción "Guardar credenciales"
- ✅ Manejo de errores robusto
- ✅ Indicador de loading

**inject**:
- `showToast`: Para notificaciones

**emits**:
- `login-success`: { token, expiration, clientId, secretId }

**Métodos Principales**:
- `autenticar()`: Proceso completo de auth
- `cargarCredencialesGuardadas()`: Desde localStorage
- `guardarCredenciales()`: A localStorage

---

### TabFactura.vue (620 líneas)

**Responsabilidad**: Creación de facturas con SDK de Xubio

**Flujo Completo**:
1. **mounted()**: Carga paralela de clientes, productos, puntos de venta
2. **Usuario selecciona**: Cliente, productos (cantidad), punto de venta
3. **Usuario configura**: Moneda, cotización, fecha vencimiento, condición pago
4. **Click "Crear Factura"**:
   - Valida datos requeridos
   - Construye payload completo
   - `sdk.crearFactura(payload)` → POST /comprobanteVentaBean
   - Recibe `transaccionId`
   - `sdk.obtenerPDF(transaccionId)` → GET /imprimir
   - Emite `@show-pdf` con URL del PDF

**Características**:
- ✅ Normalización de datos API (cliente_id/ID/id)
- ✅ Validaciones pre-creación
- ✅ Cálculo automático de totales con IVA
- ✅ Preview de factura antes de crear
- ✅ Soporte para moneda extranjera con cotización
- ✅ Generación automática de PDF
- ✅ Limpieza de formulario post-creación

**inject**:
- `sdk`: XubioClient instance
- `showToast`: Notificaciones

**emits**:
- `show-pdf`: (pdfUrl)

**Componentes Usados**:
- `<cliente-selector>`
- `<producto-selector>`
- `<punto-venta-selector>`

**Métodos Principales**:
- `cargarClientes()`: GET /clienteBean
- `cargarProductos()`: GET /listasDePreciosConProductos
- `cargarPuntosDeVenta()`: SDK.getPuntosVenta()
- `construirPayload()`: Estructura el JSON completo
- `crearFactura()`: Flujo completo de creación
- `obtenerPDF()`: Generación de PDF

**Payload Factura** (estructura):
```javascript
{
  cliente: { cliente_id: number },
  circuitoContable: { ID: 1 },
  centroDeCosto: { ID: 1 },
  deposito: { ID: 1 },
  vendedor: { ID: 1 },
  puntoVenta: { puntoVentaId: number },
  fecha: "YYYY-MM-DD",
  fechaVencimiento: "YYYY-MM-DD",
  moneda: { codigo: "ARS" },
  cotizacion: 1,
  condicionPago: 1,
  detalles: [
    {
      producto: { producto_id: number },
      cantidad: number,
      precioUnitario: number,
      listaDePrecio: { ID: number }
    }
  ]
}
```

---

### TabCobranza.vue (637 líneas)

**Responsabilidad**: Creación de cobranzas con SDK de Xubio

**Flujo Completo**:
1. **mounted()**: Carga clientes
2. **Usuario selecciona cliente**: Auto-carga facturas pendientes
3. **Usuario selecciona factura**: Pre-rellena importe con saldo
4. **Usuario ingresa importe**
5. **Click "Crear Cobranza"**:
   - Obtiene datos completos de factura: GET /comprobanteVentaBean/{id}
   - Construye payload con `detalleCobranzas`
   - `sdk.crearCobranza(payload)` → POST /cobranzaBean
   - Recibe `transaccionId`
   - `sdk.obtenerPDF(transaccionId)` → GET /imprimir
   - Emite `@show-pdf` con URL del PDF

**Características**:
- ✅ Reutiliza endpoint de clientes de TabFactura
- ✅ Carga automática de facturas al seleccionar cliente
- ✅ Filtrado client-side de facturas con saldo > 0
- ✅ Pre-relleno inteligente de importe
- ✅ Validación de importe vs saldo pendiente
- ✅ Construcción automática de payload completo
- ✅ Generación automática de PDF
- ✅ Limpieza de formulario post-creación

**inject**:
- `sdk`: XubioClient instance
- `showToast`: Notificaciones

**emits**:
- `show-pdf`: (pdfUrl)

**Métodos Principales**:
- `cargarClientes()`: GET /clienteBean (reutilizado)
- `cargarFacturasPendientes()`: GET /comprobantesAsociados
- `seleccionarClientePorId()`: Auto-carga facturas
- `seleccionarFacturaPorId()`: Pre-rellena importe
- `crearCobranza()`: Flujo completo de creación
- `obtenerPDF()`: Generación de PDF

**Payload Cobranza** (estructura):
```javascript
{
  circuitoContable: comprobante.circuitoContable,
  cliente: { cliente_id: number },
  fecha: "YYYY-MM-DD",
  monedaCtaCte: comprobante.moneda,
  cotizacion: number,
  utilizaMonedaExtranjera: 0 | 1,
  transaccionInstrumentoDeCobro: [
    {
      cuentaTipo: 1,                    // 1 = Caja
      cuenta: { ID: 1, id: 1 },
      moneda: { ID: number },
      cotizacion: number,
      importe: number,
      descripcion: string
    }
  ],
  detalleCobranzas: [
    {
      idComprobante: number,            // ID de la factura
      importe: number                   // Importe a aplicar
    }
  ]
}
```

---

### PdfViewer.vue (87 líneas)

**Responsabilidad**: Visor modal de PDFs

**Características**:
- ✅ Modal overlay con fondo oscuro
- ✅ iframe para mostrar PDF
- ✅ Botón de cerrar (X)
- ✅ Click en overlay cierra el modal
- ✅ Responsive y centrado

**Props**:
- `url`: String - URL del PDF (base64 o HTTP)
- `visible`: Boolean - Controla visibilidad

**Emits**:
- `close`: Sin parámetros

**Uso**:
```vue
<pdf-viewer
  :url="pdfUrl"
  :visible="pdfVisible"
  @close="closePdf"
/>
```

---

## 📡 Sistema de Comunicación

### 1. Provide/Inject (Padre → Hijo)

**app.js provee**:
```javascript
provide() {
  return {
    sdk: () => this.xubioSdk,        // Función que retorna SDK
    showToast: this.showToast         // Función directa
  };
}
```

**Tab* inyectan**:
```javascript
inject: {
  sdk: {
    from: 'sdk',
    default: () => null
  },
  showToast: {
    from: 'showToast',
    default: () => (msg) => console.log(msg)
  }
}
```

**Uso en Tab***:
```javascript
// Llamar al SDK
const response = await this.sdk().crearFactura(payload);

// Mostrar notificación
this.showToast('Factura creada exitosamente', 'success');
```

### 2. Custom Events (Hijo → Padre)

**TabAuth emite**:
```javascript
// En TabAuth.vue
this.$emit('login-success', {
  token: data.access_token,
  expiration: data.expire_at
});
```

**App.vue escucha**:
```vue
<tab-auth @login-success="handleLogin"></tab-auth>
```

```javascript
// En app.js
handleLogin(data) {
  this.accessToken = data.token;
  this.tokenExpiration = data.expiration;
  this.xubioSdk = new XubioClient(data.token);
  this.currentTab = 'factura';
  this.showToast('Login exitoso', 'success');
}
```

**TabFactura/TabCobranza emiten**:
```javascript
// En Tab*.vue
this.$emit('show-pdf', pdfUrl);
```

**App.vue escucha**:
```vue
<tab-factura @show-pdf="handleShowPdf"></tab-factura>
<tab-cobranza @show-pdf="handleShowPdf"></tab-cobranza>
```

```javascript
// En app.js
handleShowPdf(url) {
  this.pdfUrl = url;
  this.pdfVisible = true;
}
```

### 3. Diagrama de Comunicación

```
┌─────────────────────────────────────────────────┐
│                    app.js                        │
│                                                  │
│  provide: { sdk, showToast }                    │
│           │                                      │
│           ▼                                      │
│  ┌────────────────────────────────────┐         │
│  │   TabAuth    TabFactura  TabCobranza│         │
│  │      │            │           │     │         │
│  │      │ inject: { sdk, showToast }  │         │
│  │      │            │           │     │         │
│  └──────┼────────────┼───────────┼─────┘         │
│         │            │           │               │
│         │ @login-    │ @show-pdf │ @show-pdf     │
│         │  success   │           │               │
│         ▼            ▼           ▼               │
│  ┌─────────────────────────────────────┐        │
│  │  handleLogin()  handleShowPdf()     │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

---

## 🔌 SDK y Servicios

### Arquitectura de Servicios

El proyecto usa un **Service Layer** ubicado en `assets/services/xubioApi.js` que abstrae toda la comunicación con la API de Xubio.

**Nota**: Existe una carpeta `/sdk/` con implementaciones alternativas (XubioClient, FacturaService, CobranzaService) que están planificadas para futuro uso pero **NO se usan actualmente**.

### createXubioApiClient (assets/services/xubioApi.js)

**Factory function que crea un cliente de API de Xubio**

```javascript
import { createXubioApiClient } from './services/xubioApi.js';

// En app.js - handleLogin()
this.xubioSdk = createXubioApiClient(
  () => this.renewToken(),      // Función para renovar token
  () => this.isTokenValid(),    // Función para verificar validez
  () => this.getAccessToken()   // Función para obtener token actual
);
```

**Métodos del API Client**:

```javascript
// request genérico
await sdk.request(endpoint, method, payload, queryParams);

// getPuntosVenta
const puntosVenta = await sdk.getPuntosVenta(activo = 1);

// crearFactura
const { response, data } = await sdk.crearFactura(payload);

// obtenerPDF
const { response, data } = await sdk.obtenerPDF(transaccionId, tipoimpresion);

// crearCobranza
const { response, data } = await sdk.crearCobranza(payload);
```

**Uso en componentes Tab**:
```javascript
// En TabFactura.vue
const sdk = this.sdk();  // Obtener SDK inyectado desde app.js
const { response, data } = await sdk.crearFactura(payload);

if (response.ok) {
  const transaccionId = data.transaccion.ID;
  const pdfResult = await sdk.obtenerPDF(transaccionId, '1');
  // ...
}
```

### Token Management (app.js)

app.js mantiene las credenciales y maneja renovación automática de tokens:

```javascript
// Métodos en app.js
isTokenValid() {
  return this.accessToken &&
         this.tokenExpiration &&
         Date.now() < this.tokenExpiration - 60000;
}

async renewToken() {
  const response = await fetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify({
      clientId: this.clientId,
      secretId: this.secretId
    })
  });
  // Actualiza this.accessToken y this.tokenExpiration
}
```

### Endpoints Principales

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/auth` | POST | Autenticación (obtener token) |
| `/clienteBean` | GET | Listar clientes activos |
| `/productoBean` | GET | Listar productos |
| `/listasDePreciosConProductos` | GET | Productos con precios |
| `/puntoVentaBean` | GET | Puntos de venta disponibles |
| `/comprobanteVentaBean` | POST | Crear factura |
| `/comprobanteVentaBean/{id}` | GET | Obtener datos de factura |
| `/comprobantesAsociados` | GET | Facturas pendientes de un cliente |
| `/cobranzaBean` | POST | Crear cobranza |
| `/imprimir/{transaccionId}` | GET | Generar PDF de comprobante |

---

## 📐 Convenciones de Código

### Nomenclatura

**Componentes Vue**:
- PascalCase: `TabAuth.vue`, `PdfViewer.vue`
- Prefijo "Tab" para pestañas: `TabFactura.vue`
- Sufijo "Selector" para selectores: `ClienteSelector.vue`

**Archivos JavaScript**:
- camelCase: `xubioClient.js`, `formatters.js`

**Variables y Funciones**:
- camelCase: `clienteSeleccionado`, `cargarClientes()`

**Constantes**:
- SCREAMING_SNAKE_CASE: `DEFAULTS`, `ENDPOINTS`

### Estructura de Componentes Vue

```vue
<template>
  <!-- Template -->
</template>

<script>
export default {
  name: 'ComponentName',

  inject: {
    // Dependencias inyectadas
  },

  emits: ['event-name'],

  data() {
    return {
      // Estado local
    };
  },

  computed: {
    // Propiedades computadas
  },

  mounted() {
    // Inicialización
  },

  methods: {
    // Métodos del componente
  }
};
</script>

<style scoped>
/* Estilos del componente */
</style>
```

### Comentarios y Documentación

**JSDoc para métodos públicos**:
```javascript
/**
 * Crea una factura en Xubio
 * @param {Object} payload - Datos de la factura
 * @returns {Promise<Object>} Respuesta con transaccionId
 */
async crearFactura(payload) {
  // ...
}
```

**Comentarios inline**:
```javascript
// Normalizar cliente_id (API inconsistente)
const clienteId = cliente.cliente_id || cliente.ID || cliente.id;
```

### Manejo de Errores

**try-catch en operaciones async**:
```javascript
async crearFactura() {
  this.isLoading = true;
  try {
    const { response, data } = await this.sdk().crearFactura(payload);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    this.showToast('Factura creada exitosamente', 'success');
    return data;

  } catch (error) {
    console.error('Error al crear factura:', error);
    this.showToast(`Error: ${error.message}`, 'error');

  } finally {
    this.isLoading = false;
  }
}
```

### Normalización de Datos

**API de Xubio es inconsistente**, normalizar siempre:

```javascript
// Normalización de cliente_id
const clienteId = cliente.cliente_id || cliente.ID || cliente.id;

// Normalización de CUIT
const cuit = cliente.cuit || cliente.identificacionTributaria?.numero || '';

// Normalización de razón social
const razonSocial = cliente.razonSocial || cliente.nombre || '';
```

---

## 🔧 Guía de Mantenimiento

### Agregar Nueva Pestaña

1. **Crear componente** `TabNombre.vue` en `assets/components/`

```vue
<template>
  <div class="tab-nombre">
    <h2>Nueva Funcionalidad</h2>
    <!-- UI del tab -->
  </div>
</template>

<script>
export default {
  name: 'TabNombre',
  inject: {
    sdk: { from: 'sdk', default: () => null },
    showToast: { from: 'showToast', default: () => (msg) => console.log(msg) }
  },
  emits: ['evento-personalizado'],
  // ...
};
</script>
```

2. **Registrar en app.js**:

```javascript
import TabNombre from './components/TabNombre.vue';

export const appOptions = {
  components: {
    TabAuth,
    TabFactura,
    TabCobranza,
    TabNombre  // ← Agregar aquí
  },
  // ...
};
```

3. **Agregar a navegación en App.vue**:

```vue
<button @click="currentTab = 'nombre'">📋 Nombre</button>
<tab-nombre v-if="currentTab === 'nombre'" @evento="handleEvento" />
```

4. **Agregar handler si es necesario**:

```javascript
// En app.js methods
handleEvento(data) {
  // Manejar evento del nuevo tab
}
```

### Agregar Método al SDK

1. **Editar** `sdk/xubioClient.js`:

```javascript
async nuevoMetodo(parametros) {
  return this.request('/nuevoEndpoint', 'POST', parametros);
}
```

2. **Usar en componente Tab**:

```javascript
const resultado = await this.sdk().nuevoMetodo({ dato: 'valor' });
```

### Modificar Payload de Factura/Cobranza

1. **Localizar** método `construirPayload()` en TabFactura/TabCobranza
2. **Modificar** estructura según necesidad
3. **Probar** con API de Xubio
4. **Documentar** cambios en comentarios

### Debugging

**Console.log estratégico**:
```javascript
console.log('📤 Payload a enviar:', payload);
console.log('📥 Respuesta de API:', data);
console.log('❌ Error:', error);
```

**Vue DevTools**:
- Inspeccionar state de componentes
- Verificar inject de sdk y showToast
- Revisar eventos emitidos

**Network Tab**:
- Verificar payloads enviados
- Ver respuestas de API
- Confirmar headers (Authorization)

---

## 📚 Referencias

### Documentos Relacionados

- [REFACTOR_CHECKPOINT.md](../REFACTOR_CHECKPOINT.md) - Historial de refactorización
- [ADR-005](../ADRS/ADR-005-refactorizacion-app-js-y-sistema-logging.md) - Decisión de refactorización
- [flujos.md](./flujos.md) - Flujos de negocio detallados
- [INTEGRACION_LOGGER_API.md](./INTEGRACION_LOGGER_API.md) - Sistema de logging

### API de Xubio

- Base URL: `https://app.xubio.com/api`
- Autenticación: Bearer token (JWT)
- Documentación: Swagger interno de Xubio

### Stack Tecnológico

- **Vue 3**: Framework JavaScript reactivo
- **Vite**: Build tool y dev server
- **ESLint**: Linter de JavaScript
- **Vitest**: Testing framework (configurado, no usado)

---

## 🎓 Conclusiones

### Logros de la Refactorización

✅ **Reducción masiva**: De 4118 a 168 líneas (-95.9%)
✅ **Bundle optimizado**: De 199.83 kB a 108.69 kB (-45.6%)
✅ **Arquitectura limpia**: Container/Presentational pattern
✅ **Zero business logic** en app.js
✅ **Componentes autónomos** y reutilizables
✅ **Mantenibilidad mejorada** significativamente

### Principios Aplicados

- **Divide y Conquista**: Problema grande → componentes pequeños
- **Single Responsibility**: Un componente, una responsabilidad
- **Dependency Injection**: Proveer dependencias, no crearlas
- **Event-Driven**: Comunicación desacoplada vía eventos
- **Composition over Inheritance**: Usar componentes, no extender

### Próximos Pasos Recomendados

1. **Testing**: Implementar tests unitarios con Vitest
2. **TypeScript**: Migrar a TypeScript para type safety
3. **Error Boundary**: Componente para capturar errores
4. **Toast UI**: Sistema de notificaciones visual
5. **Loading States**: Indicadores de carga más sofisticados
6. **Validación de Formularios**: Librería como VeeValidate
7. **State Management**: Considerar Pinia si crece la complejidad

---

**Última actualización**: 2025-12-31
**Autor**: Refactorización asistida por Claude Code
**Versión del documento**: 1.0
