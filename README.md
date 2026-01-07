# Sheets con Xubio - API Centralizada (Vercel)

Este proyecto es una infraestructura de API serverless para conectar Google Sheets (via AppSheet y Apps Script) con Xubio para la creación de facturas y cobranzas.

**URL Base Vercel:** `https://xubio-facturacion-online.vercel.app`

## 🚀 Arquitectura General

El sistema utiliza una arquitectura de 4 capas:

```
AppSheet (UI)
    ↓ trigger botón
Google Apps Script (Webhook)
    ↓ HTTP POST
Vercel API (Serverless)
    ↓ OAuth + lógica
Xubio REST API
    ↓
✅ Factura/Cobranza creada
```

---

## 📄 FLUJO 1: FACTURACIÓN

**Script:** `apps-script/XubioDiscovery.js`
**Endpoint:** `POST /api/crear-factura`

### Trigger en AppSheet:
1. Usuario presiona botón "Facturar"
2. **Acción** cambia columna ESTADO → `"FACTURA PENDIENTE"`
3. **Bot** detecta el cambio de estado (Updates + Condition)
4. Bot ejecuta webhook con body `{ cuit, cantidad, idRef }`

### Proceso en Vercel:
1. Busca cliente por CUIT en Xubio
2. Obtiene cotización USD desde DolarAPI
3. Obtiene precio del producto desde lista de precios
4. Crea factura vía Xubio REST API
5. **Solicita CAE a AFIP** (automático, POST /solicitarCAE)
6. Obtiene PDF público de la factura
7. Retorna { transaccionId, numeroDocumento, pdfUrl }

### Proceso en Apps Script:
1. Actualiza Google Sheets (columna 13: número factura, columna 21: PDF)

### Columnas Google Sheets (Facturación):
| Columna | Índice | Campo |
|---------|--------|-------|
| 13 | M | FACTURA 2026 (numeroDocumento) |
| 20 | T | ID REF (identificador único fila) |
| 21 | U | LINK_PDF_FACTURA |

---

## 💰 FLUJO 2: COBRANZAS

**Script:** `apps-script/XubioCobranzas.js`
**Endpoint:** `POST /api/crear-cobranza`

### Trigger en AppSheet:
1. Usuario presiona botón "Cobrar"
2. **Acción** cambia columna ESTADO → `"COBRADO"`
3. **Bot** detecta el cambio de estado (Updates + Condition)
4. Bot ejecuta webhook con body `{ idRef }`

### Proceso en Vercel:
1. Lee número de factura de columna 13 (vía Apps Script)
2. Busca factura por `numeroDocumento` en Xubio
3. Crea cobranza heredando datos de la factura (cliente, moneda, cotización)
4. Incluye observación: `IMPUTAR A: {factura} - {cliente} - Total: {monto}`
5. Obtiene PDF público de la cobranza
6. Retorna { cobranzaId, numeroRecibo, pdfUrl }

### Proceso en Apps Script:
1. Actualiza Google Sheets (columna 22: PDF cobranza)

### Columnas Google Sheets (Cobranzas):
| Columna | Índice | Campo |
|---------|--------|-------|
| 13 | M | FACTURA 2026 (input - lee de aquí) |
| 20 | T | ID REF (identificador único fila) |
| 22 | V | LINK_PDF_COBRANZA |

### ⚠️ Limitación Conocida: Imputación Manual
La REST API de Xubio **NO soporta imputación automática** de cobranzas a facturas. La cobranza se crea correctamente pero debe imputarse manualmente desde Xubio UI:

1. Ir a **Xubio → Cuenta Corriente** del cliente
2. La cobranza aparece con observación: `IMPUTAR A: A-00004-00001685 - CLIENTE - Total: 169.4 USD`
3. Click en **Aplicar** → Seleccionar factura → **Guardar** (2 clicks)

---

## ✨ Características Compartidas

- **OAuth2 Centralizado**: Token gestionado en Vercel, cacheado por 1 hora
- **CAE Automático**: Al crear factura se solicita CAE a AFIP automáticamente
- **Generación de PDF Público**: Ambos flujos obtienen link de descarga público
- **Idempotencia**: `externalId` compuesto (idRef + timestamp) previene duplicados
- **Datos Bancarios Automáticos**: Observaciones incluyen CBU/Alias (facturas) o datos de imputación (cobranzas)

---

## 🔀 Router de Webhooks (Apps Script)

**Archivo:** `apps-script/router.gs`

Un único `doPost()` que rutea automáticamente según los campos del request:

```
Request con "cuit"     → Facturación (xubiodiscovery.gs)
Request sin "cuit"     → Cobranza (xubiocobranzas.gs)
```

### Estructura de archivos Apps Script:

| Archivo | Función | doPost |
|---------|---------|--------|
| `router.gs` | Router principal | ✅ Único doPost() |
| `xubiodiscovery.gs` | Lógica facturación | ❌ Comentado |
| `xubiocobranzas.gs` | Lógica cobranzas | ❌ Comentado |

### Body del webhook según operación:

**Facturación:**
```json
{
  "cuit": "<<[CUIT]>>",
  "cantidad": <<[Equipos]>>,
  "idRef": "<<[ID REF]>>"
}
```

**Cobranza:**
```json
{
  "idRef": "<<[ID REF]>>"
}
```

Ambos usan la **misma URL de webhook** - el router detecta qué hacer.

## ⚠️ Nota sobre Fly.io y Puppeteer (Dead End)

Se intentó implementar un servicio de login automatizado con Puppeteer en Fly.io para obtener cookies de sesión. Esta vía fue **descartada** debido a los bloqueos de firewall de Visma Connect en IPs de datacenters. El enfoque actual utiliza exclusivamente la **API Oficial de Xubio (OAuth2)**.

## 🛠️ Configuración en Vercel

Se deben configurar las siguientes variables de entorno en el dashboard de Vercel:

- `XUBIO_CLIENT_ID`: Obtenido en Configuración > Mi cuenta > API.
- `XUBIO_SECRET_ID`: Obtenido en Configuración > Mi cuenta > API.

---

## 📁 Estructura del Proyecto

- `api/`: Funciones serverless de Vercel (Auth, Proxy, Crear Factura).
- `sdk/`: (DEPRECADO) Lógica del cliente XML legacy. La funcionalidad principal está en `api/`.
- `apps-script/`: Código para copiar en el editor de Google Apps Script.

## 📝 Endpoints Principales

- `POST /api/auth`: Gestiona el token de acceso oficial.
- `POST /api/crear-factura`: Procesa la creación de facturas (Usa Bearer Token).
- `POST /api/crear-cobranza`: Crea cobranzas asociadas a facturas existentes.
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
- `ANY /api/discovery`: Proxy genérico para endpoints de consulta de Xubio.
