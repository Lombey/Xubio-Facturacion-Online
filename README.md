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
4. Bot ejecuta webhook con body (ver abajo)

**Webhook body:**
```json
{
  "cuit": "<<[CUIT]>>",
  "cantidad": <<[Equipos]>>,
  "idRef": "<<[ID REF]>>",
  "descuento": <<[DESCUENTO (%)]>>
}
```

### Descuento (opcional)
| Valor columna | Comportamiento |
|---------------|----------------|
| vacío o 0 | Precio de lista completo |
| 25 | Aplica 25% descuento al precio, IVA se recalcula |

**Ejemplo:** Precio lista 20 USD, descuento 25% → Neto 15 USD → IVA 3.15 → Total 18.15 USD

### Proceso en Vercel:
1. Busca cliente por CUIT en Xubio
2. Obtiene cotización USD desde DolarAPI
3. Obtiene precio del producto desde lista de precios
4. **Aplica descuento** si existe (sobre neto, antes de IVA)
5. Crea factura vía Xubio REST API
6. **Solicita CAE a AFIP** (automático, POST /solicitarCAE)
7. Obtiene PDF público de la factura
8. Retorna { transaccionId, numeroDocumento, pdfUrl }

### Proceso en Apps Script:
1. Actualiza Google Sheets (columna 13: número factura, columna 21: PDF)

### Columnas Google Sheets (Facturación):
| Columna | Índice | Campo |
|---------|--------|-------|
| 13 | M | FACTURA 2026 (numeroDocumento) |
| 20 | T | ID REF (identificador único fila) |
| 21 | U | LINK_PDF_FACTURA |
| ? | ? | DESCUENTO (%) - porcentaje descuento (opcional) |

---

## 💰 FLUJO 2: COBRANZAS

**Script:** `apps-script/XubioCobranzas.js`
**Endpoint:** `POST /api/crear-cobranza`

### Tipos de Cobranza Soportados

| Tipo | Cuenta Xubio | ESTADO en AppSheet |
|------|--------------|-------------------|
| **Banco** (transfer) | -14 (Banco) | `COBRADA (TRANSFER)` |
| **Cheque** | 681702 (santander cheques) | `COBRADA (CHEQUES)` |

### Configuración en AppSheet:

#### Acción: Cobrar Banco
| Campo | Valor |
|-------|-------|
| Do this | `Data: set the values of some columns` |
| Set these columns | `ESTADO` = `"COBRADA (TRANSFER)"` |

#### Acción: Cobrar Cheque
| Campo | Valor |
|-------|-------|
| Do this | `Data: set the values of some columns` |
| Set these columns | `N° CHEQUE` = `[_INPUT].[NumCheque]` |
| | `ESTADO` = `"COBRADA (CHEQUES)"` |
| **Advanced** | Input name: `NumCheque`, Type: `Text` |

#### Bot: Cobrar con Xubio
| Campo | Valor |
|-------|-------|
| Event | Data Change → Updates |
| Condition | `OR([ESTADO] = "COBRADA (TRANSFER)", [ESTADO] = "COBRADA (CHEQUES)")` |
| Task | Call a webhook (ver body abajo) |

**Webhook body:**
```json
{
  "idRef": "<<[ID REF]>>",
  "chequeNumero": "<<[N° CHEQUE]>>"
}
```

### Formato de chequeNumero
Si hay **múltiples cheques físicos**, concatenar los números con `/`:
- 1 cheque: `"12345678"`
- 3 cheques: `"12345/67890/11111"`

El **importe se toma automáticamente de la factura**. La fecha se genera automáticamente (hoy).

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

### Campos del cheque:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `chequeNumero` | string | Número(s) de cheque separados por "/" (ej: "a1/a2/a3") |

El importe se toma de la factura. La fecha se genera automáticamente (hoy).

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

**Cobranza (Banco o Cheque):**
```json
{
  "idRef": "<<[ID REF]>>",
  "chequeNumero": "<<[N° CHEQUE]>>"
}
```

Todos usan la **misma URL de webhook** - el router detecta qué hacer:
- Con `cuit` → Facturación
- Sin `cuit`, `chequeNumero` vacío → Cobranza Banco
- Sin `cuit`, `chequeNumero` con valor → Cobranza Cheque

## 📦 FLUJO 4: FACTURACIÓN DE EQUIPOS (KITS AGDP)

**Solapa:** `TABLET`
**Script:** `apps-script/XubioEquipos.js`
**Endpoint:** `POST /api/crear-factura-equipos`
**Estado:** ✅ Funcionando

### Problema que resuelve
Facturar múltiples equipos del mismo cliente en **1 sola factura** con N items.
Soporta descuento porcentual y licencias opcionales.

### Columnas Google Sheets (TABLET):
| Columna | Índice | Campo |
|---------|--------|-------|
| W | 23 | CUIT |
| AE | 31 | ESTADO_PAGO (`NO FACTURADO` / `FACTURADO` / `FACTURADO (XUBIO)`) |
| AD | 30 | FACTURA_NUMERO (output) |
| AT | 46 | SELECCION_PARA_FC (checkbox Yes/No) |
| AW | 49 | LINK_PDF (output) |

### Estados de pago:
| Estado | Comportamiento |
|--------|----------------|
| `NO FACTURADO` | Estado inicial |
| `FACTURADO` | Dispara bot (si no tiene factura) |
| `FACTURADO (XUBIO)` | Marca manual, NO dispara bot |

### Configuración AppSheet:

**Bot: Facturar Kits AGDP**
| Campo | Valor |
|-------|-------|
| Event | Data Change → Updates on TABLET |
| Condition | `AND([ESTADO_PAGO] = "FACTURADO", ISBLANK([FACTURA_NUMERO]))` |
| Task | Call webhook |

**Webhook body:**
```json
{
  "accion": "facturarEquipos",
  "cuit": "<<[CUIT]>>",
  "idRef": "<<[ID]>>",
  "incluirLicencias": "<<[INCLUIR_LICENCIAS]>>",
  "precioEquipo": <<NUMBER([PRESUPUESTO (USD)])*1>>,
  "descuento": <<[DESCUENTO (%)]>>
}
```

**Acción: FACTURAR EQUIPOS**
| Campo | Valor |
|-------|-------|
| Do this | Data: set the values of some columns |
| Set columns | `ESTADO_PAGO` = `"FACTURADO"` |
| | `INCLUIR_LICENCIAS` = `[_INPUT].[¿Incluir licencias?]` |
| | `DESCUENTO (%)` = `[_INPUT].[Descuento]` |
| Inputs | `¿Incluir licencias?` (Yes/No, default TRUE) |
| | `Descuento` (Number, default 0) |
| Confirmation | Fórmula con preview de cliente, equipos y montos |

### Flujo del usuario:
```
1. Equipos se cargan → SELECCION_PARA_FC = TRUE (automático)
2. Usuario ejecuta "FACTURAR EQUIPOS" en 1 fila del CUIT
3. Confirmation muestra preview (cliente, cantidad, montos)
4. Inputs: ¿Incluir licencias? + Descuento %
5. Bot detecta ESTADO_PAGO = "FACTURADO" + sin factura
6. Webhook procesa TODAS las filas con SELECCION=TRUE del mismo CUIT
7. Apps Script actualiza: ESTADO_PAGO, FACTURA_NUMERO, LINK_PDF
8. Apps Script limpia SELECCION_PARA_FC = FALSE
```

### IDs de productos Xubio:
| Producto | ID |
|----------|-----|
| KIT SISTEMA AGDP | 2751285 |
| CONECTIVIDAD ANUAL POR TOLVA | 2751338 |

### Factura resultante (ejemplo):
```
3 equipos, incluir licencias = YES, descuento = 25%
→ Línea 1: Kit AGDP × 3 @ 1900 USD = 5700 USD - 25% = 4275 USD
→ Línea 2: Licencia × 3 @ 490 USD = 1470 USD - 25% = 1102.50 USD
→ Total neto: 5377.50 USD + IVA
```

### Lock para evitar duplicados:
El bot puede disparar múltiples veces si se usa multi-select. Apps Script usa `LockService` para que solo 1 ejecución procese y las demás se descarten.

---

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
- `POST /api/crear-factura-equipos`: Crea facturas multi-item (Kits AGDP + Licencias).
- `POST /api/crear-cobranza`: Crea cobranzas asociadas a facturas existentes.
- `GET /api/consulta-cuit`: Consulta razón social por CUIT (scraping cuitonline.com).
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
- `ANY /api/discovery`: Proxy genérico para endpoints de consulta de Xubio.
