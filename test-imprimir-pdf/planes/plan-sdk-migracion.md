# Plan de Migración: SDK Puro Xubio (Reference Implementation)

**Objetivo**: Extraer toda la lógica de negocio y comunicación con la API de Xubio fuera de la UI (Vue.js) hacia módulos JavaScript puros (`/sdk`).
**Meta Final**: Tener archivos `.js` agnósticos y documentados que una IA o desarrollador pueda copiar directamente a **Google Apps Script (AppSheet)** o Node.js.

---

## 🎯 Arquitectura Objetivo

La UI (`app.js`) pasará de ser un "Cerebro" a ser un "Control Remoto".

```
test-imprimir-pdf/
├── sdk/                      <-- EL ENTREGABLE VALIOSO
│   ├── xubioClient.js        (Cliente HTTP Genérico, Auth)
│   ├── facturaService.js     (Constructor de JSON Facturas)
│   ├── cobranzaService.js    (Constructor de JSON Cobranzas)
│   └── mappers.js            (Normalización de Clientes/Productos)
│
└── assets/
    └── app.js                (Solo captura inputs y llama al SDK)
```

---

## 📝 Pasos de Ejecución

### Fase 1: Conexión del Core (Facturación) 🚧
**Objetivo**: Validar que `FacturaService` y `XubioClient` funcionan en el mundo real.

- [ ] **1.1. Inicializar SDK en `app.js`**
    - [ ] Importar `XubioClient` y `FacturaService` en `app.js`.
    - [ ] Instanciar `xubioSdk` en el `mounted()` o `data` de Vue.
    - [ ] Conectar el manejo de token existente con `xubioSdk.accessToken`.

- [ ] **1.2. Refactorizar `flujoCompletoFactura`**
    - [ ] Identificar variables de entrada (Cliente, Items, PuntoVenta).
    - [ ] Reemplazar la construcción manual del objeto `payload` por `FacturaService.buildPayload(...)`.
    - [ ] Reemplazar `this.requestXubio(...)` por `this.xubioSdk.request(...)` (o similar).
    - [ ] Verificar que los errores se siguen capturando en la UI.

- [ ] **1.3. Prueba de Humo**
    - [ ] Ejecutar el entorno local.
    - [ ] Intentar crear una factura real (en entorno de pruebas).

### Fase 2: Extracción de Cobranzas 📦
**Objetivo**: Replicar el patrón para el módulo de Cobranzas.

- [ ] **2.1. Análisis de `flujoCompletoCobranza`**
    - [ ] Leer `app.js` e identificar qué campos son estrictamente necesarios para el JSON.
    - [ ] Identificar lógica de validación (ej: validar importes, medios de pago).

- [ ] **2.2. Crear `sdk/cobranzaService.js`**
    - [ ] Crear clase `CobranzaService`.
    - [ ] Implementar `buildPayload({ clienteId, facturasAImputar, mediosPago... })`.
    - [ ] Documentar con JSDoc exhaustivo (Tipos de datos, campos obligatorios).

- [ ] **2.3. Integración**
    - [ ] Importar en `app.js`.
    - [ ] Reemplazar lógica en `flujoCompletoCobranza`.

### Fase 3: Maestros y Helpers (Opcional pero Recomendado) 🛠️
**Objetivo**: Limpiar utilidades que AppSheet necesitará (ej: limpiar CUITs).

- [ ] **3.1. Extraer Lógica de Clientes**
    - [ ] Si hay lógica para buscar clientes por CUIT o limpiar strings, moverla a `sdk/mappers.js` o `sdk/utils.js`.

### Fase 4: Entregable Final 📄
**Objetivo**: Dejar la guía para la posteridad.

- [ ] **4.1. Crear `docs/APPSHEET_GUIDE.md`**
    - [ ] Explicar cómo mapear estos archivos a un script de Google Apps Script (`.gs`).
    - [ ] Ejemplo de cómo llamar a `crearFactura` desde una automatización de AppSheet.

---

## ⚠️ Reglas de Oro durante la Migración
1. **No romper la UI**: La aplicación debe seguir siendo usable para pruebas manuales.
2. **JSDoc es Ley**: Cada función del SDK debe tener `@param` y `@returns` detallados. Esto es lo que leerá la IA en el futuro.
3. **Sin Dependencias de Vue**: El código en `/sdk` NO puede tener `this.`, `ref`, `computed`, ni `alert()`. Solo `throw new Error()`.
