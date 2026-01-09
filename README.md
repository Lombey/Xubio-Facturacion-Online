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

### Tipos de Cobranza Soportados

| Tipo | Cuenta Xubio | Campos requeridos |
|------|--------------|-------------------|
| **Banco** (default) | -14 (Banco) | Solo `idRef` |
| **Cheques** | 681702 (santander cheques) | `idRef` + array `cheques` |

### Trigger en AppSheet:

#### Opción A: Cobrar con BANCO (transferencia)
1. Usuario presiona botón **"Cobrar Banco"**
2. **Acción ejecuta webhook directamente** con body:
```json
{
  "idRef": "<<[ID REF]>>"
}
```

#### Opción B: Cobrar con CHEQUES
1. Usuario presiona botón **"Cobrar Cheque"**
2. Abre formulario para ingresar cheques (número, importe, fecha)
3. **Acción ejecuta webhook directamente** con body:
```json
{
  "idRef": "<<[ID REF]>>",
  "cheques": [
    {
      "numero": "12345678",
      "importe": 252000,
      "fecha": "2026-02-20",
      "descripcion": "opcional"
    },
    {
      "numero": "87654321",
      "importe": 50000,
      "fecha": "2026-03-15"
    }
  ]
}
```

### ⚠️ Importante: Webhook directo vs Bot
Para cobranzas con cheques, el **webhook debe ejecutarse directamente desde la acción**, NO desde un bot que detecta cambio de celda. Esto permite enviar datos dinámicos (array de cheques) que no están en columnas fijas.

### Proceso en Vercel:
1. Lee número de factura de columna 13 (vía Apps Script)
2. Busca factura por `numeroDocumento` en Xubio
3. Detecta tipo de cobro:
   - Sin `cheques` → usa cuenta Banco (-14), cuentaTipo 2
   - Con `cheques` → usa cuenta santander cheques (681702), cuentaTipo 3
4. Crea cobranza heredando datos de la factura (cliente, moneda, cotización)
5. Incluye observación: `IMPUTAR A: {factura} - {cliente} - Total: {monto}`
6. Obtiene PDF público de la cobranza
7. Retorna { cobranzaId, numeroRecibo, pdfUrl }

### Proceso en Apps Script:
1. Actualiza Google Sheets (columna 22: PDF cobranza)

### Columnas Google Sheets (Cobranzas):
| Columna | Índice | Campo |
|---------|--------|-------|
| 13 | M | FACTURA 2026 (input - lee de aquí) |
| 20 | T | ID REF (identificador único fila) |
| 22 | V | LINK_PDF_COBRANZA |

### Estructura del array `cheques`:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `numero` | string | ✅ | Número del cheque (alfanumérico) |
| `importe` | number | ✅ | Importe en ARS |
| `fecha` | string | ✅ | Fecha vencimiento (YYYY-MM-DD) |
| `descripcion` | string | ❌ | Descripción opcional |

### Configuración AppSheet para Cheques (5 slots)

**Columnas auxiliares a agregar en Google Sheets:**

| Columnas | Campos por cheque |
|----------|-------------------|
| CHEQUE1_NUM, CHEQUE1_IMPORTE, CHEQUE1_FECHA | Cheque 1 |
| CHEQUE2_NUM, CHEQUE2_IMPORTE, CHEQUE2_FECHA | Cheque 2 |
| CHEQUE3_NUM, CHEQUE3_IMPORTE, CHEQUE3_FECHA | Cheque 3 |
| CHEQUE4_NUM, CHEQUE4_IMPORTE, CHEQUE4_FECHA | Cheque 4 |
| CHEQUE5_NUM, CHEQUE5_IMPORTE, CHEQUE5_FECHA | Cheque 5 |

**Webhook body (envía los 5, el servidor filtra vacíos):**
```json
{
  "idRef": "<<[ID REF]>>",
  "cheques": [
    { "numero": "<<[CHEQUE1_NUM]>>", "importe": <<IF(ISBLANK([CHEQUE1_IMPORTE]), 0, [CHEQUE1_IMPORTE])>>, "fecha": "<<[CHEQUE1_FECHA]>>" },
    { "numero": "<<[CHEQUE2_NUM]>>", "importe": <<IF(ISBLANK([CHEQUE2_IMPORTE]), 0, [CHEQUE2_IMPORTE])>>, "fecha": "<<[CHEQUE2_FECHA]>>" },
    { "numero": "<<[CHEQUE3_NUM]>>", "importe": <<IF(ISBLANK([CHEQUE3_IMPORTE]), 0, [CHEQUE3_IMPORTE])>>, "fecha": "<<[CHEQUE3_FECHA]>>" },
    { "numero": "<<[CHEQUE4_NUM]>>", "importe": <<IF(ISBLANK([CHEQUE4_IMPORTE]), 0, [CHEQUE4_IMPORTE])>>, "fecha": "<<[CHEQUE4_FECHA]>>" },
    { "numero": "<<[CHEQUE5_NUM]>>", "importe": <<IF(ISBLANK([CHEQUE5_IMPORTE]), 0, [CHEQUE5_IMPORTE])>>, "fecha": "<<[CHEQUE5_FECHA]>>" }
  ]
}
```

**Comportamiento del servidor:**
- Filtra automáticamente cheques con `numero` vacío o `importe` = 0
- Si todos los cheques son vacíos → usa cobro tipo BANCO
- Solo se procesan los cheques con datos válidos

### ⚠️ Limitación Conocida: Imputación Manual
La REST API de Xubio **NO soporta imputación automática** de cobranzas a facturas. La cobranza se crea correctamente pero debe imputarse manualmente desde Xubio UI:

1. Ir a **Xubio → Cuenta Corriente** del cliente
2. La cobranza aparece con observación: `IMPUTAR A: A-00004-00001685 - CLIENTE - Total: 169.4 USD`
3. Click en **Aplicar** → Seleccionar factura → **Guardar** (2 clicks)

---

## 🔍 FLUJO 3: AUTOCOMPLETAR RAZÓN SOCIAL (Solapa TABLET)

**Script:** `apps-script/AutocompletarRazonSocial.gs`
**Endpoint:** `GET /api/consulta-cuit?cuit={CUIT}`

### Funcionamiento (via AppSheet Bot):
1. Usuario ingresa/modifica CUIT en columna W desde AppSheet
2. **Bot AppSheet** detecta el cambio y ejecuta webhook
3. Router (`router.gs`) rutea a `procesarConsultaCuit()`
4. Apps Script llama al endpoint de Vercel
5. Vercel hace scraping de cuitonline.com y extrae razón social
6. Se actualiza columna AI buscando la fila por ID (columna AQ)

### Columnas Google Sheets (Solapa TABLET):
| Columna | Índice | Campo |
|---------|--------|-------|
| W | 23 | CUIT (input) |
| AI | 35 | RAZON SOCIAL (output - autocompletado) |
| AQ | 43 | ID (UNIQUEID - identificador único de fila) |

### Comportamiento:
- **Solo completa si está vacío**: Si la columna AI ya tiene valor, no sobrescribe
- **Normaliza CUIT automáticamente**: Acepta `33-71584119-9`, `33715841199`, etc.
- **Si falla**: Deja la celda vacía (sin mensaje de error)

### Configuración Bot AppSheet:
**Nombre:** OBTENER RAZON SOCIAL CON CUIT
**Evento:** Updates (detecta cambios)
**Tabla:** TABLET
**Condición:** `AND(ISNOTBLANK([CUIT]), ISBLANK([RAZON SOCIAL]))`

**Webhook Body:**
```json
{
  "accion": "consultaCuit",
  "cuit": "<<[CUIT]>>",
  "idRef": "<<[ID]>>"
}
```

**Settings recomendados:**
- Timeout: 10-15 segundos
- Max retries: 1-2

### ⚠️ Nota importante:
Los triggers de Apps Script (`onEdit`, `onChange`) **NO detectan cambios desde AppSheet**. Solo funcionan para ediciones manuales en Google Sheets. Por eso se usa bot + webhook.

### Test manual:
```javascript
testConsultaCUIT()  // Prueba con CUIT 33715841199 (LA MAYACA SRL)
```

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

**Cobranza Banco:**
```json
{
  "idRef": "<<[ID REF]>>"
}
```

**Cobranza Cheques:**
```json
{
  "idRef": "<<[ID REF]>>",
  "cheques": [
    { "numero": "12345", "importe": 100000, "fecha": "2026-02-20" },
    { "numero": "67890", "importe": 50000, "fecha": "2026-03-15" }
  ]
}
```

Todos usan la **misma URL de webhook** - el router detecta qué hacer:
- Con `cuit` → Facturación
- Sin `cuit`, sin `cheques` → Cobranza Banco
- Sin `cuit`, con `cheques` → Cobranza Cheques

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
- `GET /api/consulta-cuit`: Consulta razón social por CUIT (scraping cuitonline.com).
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
- `ANY /api/discovery`: Proxy genérico para endpoints de consulta de Xubio.
