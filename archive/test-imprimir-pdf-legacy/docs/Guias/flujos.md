# Flujos Conceptuales de la Aplicación

Este documento describe los flujos conceptuales principales de la aplicación cuando el usuario realiza las operaciones críticas: **facturar**, **crear cobranza** y **obtener PDF**.

---

## 🔐 Flujo Base: Autenticación

**Antes de cualquier operación**, el usuario debe autenticarse:

1. **Usuario ingresa credenciales** (`clientId` y `secretId`)
2. **Frontend envía POST** a `/api/auth` con credenciales en el body
3. **Backend construye Basic Auth** en el servidor (nunca en el cliente)
4. **Backend solicita token** a `https://xubio.com/API/1.1/TokenEndpoint`
5. **Backend devuelve** `{ access_token, expires_in }` al frontend
6. **Frontend guarda token** en `localStorage` y memoria
7. **Token se incluye** en todas las peticiones posteriores como `Authorization: Bearer {token}`

**Carga automática después del login:**
- **Monedas**: Se cargan desde cache o API, y se selecciona **DOLARES por defecto**
- **Cotización USD**: Se obtiene automáticamente desde `dolarapi.com` (dólar oficial vendedor)
- **Valores de configuración**: Centros de costo, depósitos, vendedores, etc.

**Características:**
- Token expira en 3600 segundos (1 hora)
- Renovación automática si el token expira (401)
- Cache de token en `localStorage` con validación de expiración
- Monedas y cotización se cargan inmediatamente al obtener el token

---

## 📄 Flujo 1: Facturación (Crear Factura)

### Contexto del Usuario
El usuario quiere generar una factura de venta con productos y obtener su PDF.

### Flujo Conceptual Completo

#### **Fase 1: Preparación de Datos**

1. **Carga de Productos** (con cache)
   - Usuario hace clic en "Listar Productos Activos"
   - Sistema consulta `GET /ProductoVentaBean?activo=1`
   - Sistema obtiene lista de precios AGDP: `GET /listaPrecioBean` → `GET /listaPrecioBean/{id}`
   - Sistema enriquece productos con precios desde `listaPrecioItem`
   - Productos se guardan en cache (TTL: 12 horas)

2. **Selección de Productos**
   - Usuario busca producto por nombre/código
   - Usuario selecciona productos del dropdown
   - Sistema agrega productos a `productosSeleccionados[]` con:
     - `producto` (objeto completo)
     - `cantidad` (default: 1)
     - `precio` (desde lista AGDP o 0 para edición manual)
     - `producto_id`

3. **Carga de Clientes** (con cache)
   - Usuario hace clic en "Listar Clientes Activos"
   - Sistema consulta `GET /clienteBean?activo=1`
   - Clientes se guardan en cache (TTL: 24 horas)

4. **Selección de Cliente**
   - Usuario busca cliente por CUIT/razón social
   - Usuario selecciona cliente del dropdown
   - Sistema asigna `clienteSeleccionadoParaFactura` y `facturaClienteId`

5. **Configuración Adicional**
   - Usuario configura `tipoimpresion` (default: 1)
   - **Moneda**: Se selecciona DOLARES automáticamente al cargar (con cache de 7 días)
   - **Cotización USD**: Se carga automáticamente desde `dolarapi.com` (dólar oficial vendedor) al iniciar sesión

#### **Fase 2: Construcción del Payload**

6. **Validaciones**
   - Verificar que hay cliente seleccionado
   - Verificar que hay productos seleccionados (o JSON manual)
   - Verificar token válido (renovar si es necesario)

7. **Carga de Valores de Configuración** (maestros, con cache)
   - Sistema carga en paralelo:
     - Centros de costo: `GET /centroDeCostoBean?activo=1`
     - Depósitos: `GET /depositos?activo=1`
     - Vendedores: `GET /vendedorBean?activo=1`
     - Circuitos contables: `GET /circuitoContableBean?activo=1`
     - Puntos de venta: `GET /puntoVentaBean?activo=1`
   - Valores se guardan en cache (TTL: 7 días)

8. **Construcción de `transaccionProductoItems`**
   - Para cada producto seleccionado:
     - Calcular `importe = cantidad × precio`
     - Calcular `iva` (asumiendo precio con IVA incluido)
     - Obtener `centroDeCosto` (primer disponible o default)
     - Obtener `deposito` (opcional, primer disponible)
     - Construir objeto con campos requeridos según Swagger:
       ```javascript
       {
         producto: { ID, id, nombre, codigo },
         cantidad: number,
         precio: number, // Con IVA incluido
         descripcion: string,
         iva: number,
         importe: number,
         total: number,
         montoExento: 0,
         porcentajeDescuento: 0,
         centroDeCosto: { ID, id }, // REQUERIDO
         deposito: { ID, id } // Opcional
       }
       ```

9. **Construcción del Payload Completo**
   - Sistema construye objeto `ComprobanteVentaBean`:
     ```javascript
     {
       circuitoContable: { ID, id },
       tipo: 1, // 1=Factura
       cliente: { cliente_id: number },
       fecha: "YYYY-MM-DD",
       fechaVto: "YYYY-MM-DD",
       condicionDePago: 1, // 1=Cuenta Corriente
       puntoVenta: { ID, id },
       vendedor: { ID, id },
       transaccionProductoItems: [...], // Array construido arriba
       // Campos requeridos con valores por defecto
       cantComprobantesCancelados: 0,
       cantComprobantesEmitidos: 0,
       cbuinformada: false,
       cotizacionListaDePrecio: 1,
       descripcion: "",
       externalId: "",
       facturaNoExportacion: false,
       mailEstado: "",
       nombre: "",
       numeroDocumento: "",
       porcentajeComision: 0,
       provincia: null,
       transaccionCobranzaItems: [],
       transaccionPercepcionItems: []
     }
     ```
   - Si hay moneda USD configurada:
     - Agregar `moneda: { ID, codigo, nombre }`
     - Agregar `cotizacion: number`
     - Agregar `utilizaMonedaExtranjera: 1`

#### **Fase 3: Creación de Factura**

10. **Envío a API**
    - Sistema envía `POST /comprobanteVentaBean` con payload completo
    - Request pasa por proxy: `/api/proxy/comprobanteVentaBean`
    - Proxy agrega header `Authorization: Bearer {token}`
    - Proxy reenvía a `https://xubio.com/API/1.1/comprobanteVentaBean`

11. **Procesamiento de Respuesta**
    - Si éxito: API devuelve `ComprobanteVentaBean` con `transaccionId`
    - Sistema extrae `transaccionId` de la respuesta
    - Sistema muestra mensaje de éxito con `transaccionId`

#### **Fase 4: Obtención de PDF** (automático en flujo completo)

12. **Solicitud de PDF**
    - Sistema llama automáticamente a `obtenerPDF(transaccionId, tipoimpresion, 'factura')`
    - Sistema envía `GET /imprimirPDF?idtransaccion={transaccionId}&tipoimpresion={tipoimpresion}`
    - Request pasa por proxy: `/api/proxy/imprimirPDF?...`

13. **Procesamiento de PDF**
    - API devuelve `{ urlPdf, nombrexml, datasource }`
    - Sistema muestra PDF en iframe
    - Sistema muestra enlaces para descargar/abrir en nueva pestaña

### Diagrama de Flujo Simplificado

```
Usuario
  ↓
[Login/Token] → /api/auth → accessToken
  ↓
[Auto] Cargar Monedas → Cache/API → DOLARES seleccionado automáticamente
  ↓
[Auto] Cargar Cotización → dolarapi.com → cotización USD actualizada
  ↓
[Seleccionar Productos] → Cache/API → productosSeleccionados[]
  ↓
[Seleccionar Cliente] → Cache/API → clienteSeleccionadoParaFactura
  ↓
[Crear Factura] → POST /comprobanteVentaBean → transaccionId
  ↓
[Obtener PDF] → GET /imprimirPDF → urlPdf → Mostrar en iframe
```

### Endpoints Utilizados

- `GET /ProductoVentaBean?activo=1` - Listar productos
- `GET /listaPrecioBean` - Listar listas de precios
- `GET /listaPrecioBean/{id}` - Obtener precios de productos
- `GET /clienteBean?activo=1` - Listar clientes
- `GET /clienteBean/{id}` - Obtener datos completos del cliente
- `GET /monedaBean?activo=1` - Obtener monedas disponibles (cache 7 días, DOLARES por defecto)
- `GET /centroDeCostoBean?activo=1` - Obtener centros de costo
- `GET /depositos?activo=1` - Obtener depósitos
- `GET /vendedorBean?activo=1` - Obtener vendedores
- `GET /circuitoContableBean?activo=1` - Obtener circuitos contables
- `GET /puntoVentaBean?activo=1` - Obtener puntos de venta
- `POST /comprobanteVentaBean` - Crear factura
- `GET /imprimirPDF?idtransaccion={id}&tipoimpresion={tipo}` - Obtener PDF

### Endpoints Externos

- `GET https://dolarapi.com/v1/dolares/oficial` - Cotización dólar oficial vendedor (carga automática)

---

## 💰 Flujo 2: Cobranza (Crear Cobranza)

### Contexto del Usuario
El usuario quiere crear una cobranza asociada a una factura existente y obtener su PDF.

### Flujo Conceptual Completo

#### **Fase 1: Preparación de Datos**

1. **Identificación de Factura a Cobrar**
   - Usuario ingresa `cobranzaClienteId` (ID del cliente)
   - Usuario ingresa `cobranzaIdComprobante` (ID de la factura a cobrar)
   - Usuario ingresa `cobranzaImporte` (importe a aplicar)
   - Usuario configura `cobranzaTipoimpresion` (default: 1)

2. **Validaciones Iniciales**
   - Verificar que hay `clienteId`, `idComprobante` e `importe`
   - Verificar token válido (renovar si es necesario)

#### **Fase 2: Obtención de Datos del Comprobante**

3. **Consulta del Comprobante**
   - Sistema envía `GET /comprobanteVentaBean/{idComprobante}`
   - Sistema obtiene datos completos de la factura:
     - `circuitoContable`
     - `moneda`
     - `cotizacion`
     - `cliente`
     - Otros datos necesarios

#### **Fase 3: Construcción del Payload**

4. **Construcción de `transaccionInstrumentoDeCobro`**
   - Sistema construye array con instrumentos de pago:
     ```javascript
     [{
       cuentaTipo: 1, // 1 = Caja
       cuenta: { ID: 1, id: 1 }, // Cuenta de caja por defecto
       moneda: { ID, id }, // Desde comprobante
       cotizacion: number, // Desde comprobante
       importe: number, // Importe ingresado por usuario
       descripcion: "Cobranza de factura {idComprobante}"
     }]
     ```

5. **Construcción de `detalleCobranzas`**
   - Sistema construye array para asociar el comprobante:
     ```javascript
     [{
       idComprobante: number, // ID de la factura
       importe: number // Importe a aplicar
     }]
     ```

6. **Construcción del Payload Completo**
   - Sistema construye objeto `CobranzaBean`:
     ```javascript
     {
       circuitoContable: { ID, id }, // Desde comprobante
       cliente: { cliente_id: number },
       fecha: "YYYY-MM-DD", // Fecha actual
       monedaCtaCte: { ID, id }, // Desde comprobante
       cotizacion: number, // Desde comprobante
       utilizaMonedaExtranjera: 0|1, // Según moneda del comprobante
       transaccionInstrumentoDeCobro: [...], // Array construido arriba
       detalleCobranzas: [...] // Array construido arriba
     }
     ```

#### **Fase 4: Creación de Cobranza**

7. **Envío a API**
    - Sistema envía `POST /cobranzaBean` con payload completo
    - Request pasa por proxy: `/api/proxy/cobranzaBean`
    - Proxy agrega header `Authorization: Bearer {token}`
    - Proxy reenvía a `https://xubio.com/API/1.1/cobranzaBean`

8. **Procesamiento de Respuesta**
    - Si éxito: API devuelve `CobranzaBean` con `transaccionId`
    - Sistema extrae `transaccionId` de la respuesta
    - Sistema muestra mensaje de éxito con `transaccionId`

#### **Fase 5: Obtención de PDF** (automático en flujo completo)

9. **Solicitud de PDF**
    - Sistema llama automáticamente a `obtenerPDF(transaccionId, tipoimpresion, 'cobranza')`
    - Sistema envía `GET /imprimirPDF?idtransaccion={transaccionId}&tipoimpresion={tipoimpresion}`
    - Request pasa por proxy: `/api/proxy/imprimirPDF?...`

10. **Procesamiento de PDF**
    - API devuelve `{ urlPdf, nombrexml, datasource }`
    - Sistema muestra PDF en iframe
    - Sistema muestra enlaces para descargar/abrir en nueva pestaña

### Diagrama de Flujo Simplificado

```
Usuario
  ↓
[Ingresar Cliente ID, Factura ID, Importe] → Validaciones
  ↓
[Obtener Comprobante] → GET /comprobanteVentaBean/{id} → Datos de factura
  ↓
[Construir Payload] → CobranzaBean con instrumentos de cobro
  ↓
[Crear Cobranza] → POST /cobranzaBean → transaccionId
  ↓
[Obtener PDF] → GET /imprimirPDF → urlPdf → Mostrar en iframe
```

### Endpoints Utilizados

- `GET /comprobanteVentaBean/{id}` - Obtener factura a cobrar
- `POST /cobranzaBean` - Crear cobranza
- `GET /imprimirPDF?idtransaccion={id}&tipoimpresion={tipo}` - Obtener PDF

---

## 📑 Flujo 3: Obtención de PDF (Comprobante Existente)

### Contexto del Usuario
El usuario quiere obtener el PDF de un comprobante (factura o cobranza) que ya existe en Xubio.

### Flujo Conceptual Completo

#### **Fase 1: Entrada de Datos**

1. **Usuario ingresa datos**
   - Usuario ingresa `transaccionId` (ID de la transacción)
   - Usuario ingresa `tipoimpresion` (tipo de impresión, default: 1)
   - Usuario puede probar diferentes valores (1, 2, 3, 0)

2. **Validaciones**
   - Verificar que hay `transaccionId` y `tipoimpresion`
   - Verificar que ambos son números > 0
   - Verificar token válido (renovar si es necesario)

#### **Fase 2: Solicitud de PDF**

3. **Envío a API**
    - Sistema envía `GET /imprimirPDF?idtransaccion={transaccionId}&tipoimpresion={tipoimpresion}`
    - Request pasa por proxy: `/api/proxy/imprimirPDF?idtransaccion={transaccionId}&tipoimpresion={tipoimpresion}`
    - Proxy agrega header `Authorization: Bearer {token}`
    - Proxy reenvía a `https://xubio.com/API/1.1/imprimirPDF?...`

#### **Fase 3: Procesamiento de Respuesta**

4. **Respuesta de la API**
    - Si éxito: API devuelve objeto `ImprimirPDFBean`:
      ```javascript
      {
        nombrexml: string, // Nombre del XML asociado
        datasource: string, // Fuente de datos
        urlPdf: string // URL para descargar el PDF
      }
      ```

5. **Visualización del PDF**
    - Sistema muestra mensaje de éxito con detalles
    - Sistema construye HTML con:
      - Enlace de descarga: `<a href="{urlPdf}" download>⬇️ Descargar</a>`
      - Enlace para abrir en nueva pestaña: `<a href="{urlPdf}" target="_blank">🔗 Abrir en nueva pestaña</a>`
      - Iframe para vista previa: `<iframe src="{urlPdf}"></iframe>`
    - Sistema muestra el PDF en el visor integrado

### Diagrama de Flujo Simplificado

```
Usuario
  ↓
[Ingresar Transaction ID y Tipo Impresión] → Validaciones
  ↓
[Obtener PDF] → GET /imprimirPDF → { urlPdf, nombrexml, datasource }
  ↓
[Mostrar PDF] → Iframe + Enlaces de descarga
```

### Endpoints Utilizados

- `GET /imprimirPDF?idtransaccion={id}&tipoimpresion={tipo}` - Obtener URL del PDF

### Notas Importantes

- **`tipoimpresion`**: Los valores específicos no están documentados públicamente. La aplicación permite probar valores 1, 2, 3 y 0. Típicamente se usa `1` para impresión estándar.
- **Ambos parámetros son obligatorios** según el Swagger, aunque puedan aparecer como opcionales en la definición técnica.
- El PDF se obtiene mediante una URL temporal que apunta al servidor de Xubio.

---

## 🔄 Flujos Auxiliares

### Flujo: Listar Facturas del Último Mes

1. Usuario hace clic en "Traer Facturas del Último Mes"
2. Sistema calcula rango de fechas (hace 1 mes hasta hoy)
3. Sistema envía `GET /comprobanteVentaBean?fechaDesde={fechaDesde}&fechaHasta={fechaHasta}`
4. Sistema procesa respuesta y muestra tabla con:
   - ID, Número, Fecha, CUIT, Razón Social, Monto
5. Usuario puede seleccionar una factura de la lista
6. Sistema copia `transaccionId` e `id` a campos correspondientes

### Flujo: Carga de Valores de Configuración (Maestros)

Este flujo se ejecuta automáticamente después de obtener el token:

1. Sistema carga en paralelo:
   - Centros de costo
   - Depósitos
   - Vendedores
   - Circuitos contables
   - Puntos de venta
2. Valores se guardan en cache (TTL: 7 días)
3. Valores se usan para construir payloads de facturas/cobranzas

### Flujo: Carga Automática de Monedas y Cotización

Este flujo se ejecuta automáticamente después de obtener el token:

1. **Monedas** (`GET /monedaBean?activo=1`):
   - Se verifica cache en localStorage (TTL: 7 días)
   - Si hay cache válido, se usa
   - Si no, se obtiene de la API y se cachea
   - **Se selecciona DOLARES automáticamente** (busca `codigo='DOLARES'` o `'USD'`)

2. **Cotización del Dólar**:
   - Se obtiene desde `https://dolarapi.com/v1/dolares/oficial`
   - Se usa el valor `venta` (dólar oficial vendedor)
   - Se muestra fecha/hora de actualización
   - Se ejecuta en modo silencioso (sin mensajes al usuario)

**Resultado:** Al cargar la página con credenciales guardadas, el formulario ya tiene:
- ✅ Moneda DOLARES seleccionada
- ✅ Cotización del dólar oficial actualizada

---

## 🎯 Puntos Clave de los Flujos

### Cache y Performance

- **Productos**: Cache de 12 horas
- **Clientes**: Cache de 24 horas
- **Lista de Precios**: Cache de 6 horas
- **Maestros**: Cache de 7 días
- **Monedas**: Cache de 7 días (datos estables)
- **Token**: Validación con margen de 60 segundos antes de expiración

### Manejo de Errores

- **401 (Unauthorized)**: Token expirado → Renovación automática y retry
- **Errores de validación**: Mensajes claros al usuario
- **Errores de red**: Reintentos automáticos cuando aplica

### Seguridad

- **Credenciales**: Nunca se construyen en el cliente, siempre en el servidor (`/api/auth`)
- **Token**: Se incluye en todas las peticiones a través del proxy
- **HTTPS**: Todas las comunicaciones son seguras (Vercel maneja esto automáticamente)

### Arquitectura

- **Proxy API**: Todas las peticiones a Xubio pasan por `/api/proxy/*`
- **Separación de responsabilidades**: Frontend (Vue.js) → Backend (Vercel Functions) → API Xubio
- **Reactividad**: Vue.js maneja el estado y la UI de forma reactiva

---

---

## 👤 Análisis del Flujo desde la Perspectiva del Usuario

Este análisis identifica **qué información necesita saber el usuario** y **qué problemas de UX existen** en los flujos actuales.

### 🔍 Problemas Identificados en el Flujo de Facturación

#### 1. **¿Cómo sabe el usuario que la facturación es en dólares?**

**Estado: ✅ RESUELTO**

**Implementación actual:**
- Existe un **selector de moneda visible** con las monedas disponibles desde la API
- **DOLARES se selecciona automáticamente** al cargar la página
- La cotización del dólar oficial se carga automáticamente desde `dolarapi.com`
- Las monedas se cachean por 7 días para mejor performance

**Flujo actual:**
1. Al obtener el token → se cargan las monedas desde cache/API
2. Se busca la moneda con código `DOLARES` o `USD`
3. Se selecciona automáticamente
4. La cotización se obtiene de `dolarapi.com` (dólar oficial vendedor)

**Lo que el usuario ve:**
- ✅ Selector de moneda con DOLARES preseleccionado
- ✅ Campo de cotización con el valor del dólar oficial actualizado
- ✅ Fecha/hora de última actualización de la cotización

---

#### 2. **¿Cómo sabe el usuario qué observación se envía en la factura?**

**Problema actual:**
- La observación está **hardcodeada** en el código:
  ```javascript
  const observacion = "CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5";
  ```
- **Nunca se muestra al usuario** antes de crear la factura
- El usuario no puede editarla ni ver qué se está enviando
- No hay campo visible en la UI para la observación

**Lo que el usuario necesita saber:**
- ✅ **¿Qué observación se enviará?** (mostrar antes de crear)
- ✅ **¿Puedo editarla?** (campo editable)
- ✅ **¿Es obligatoria?** (indicar si es opcional)

**Solución sugerida:**
- Agregar campo de texto visible: "Observaciones (opcional)"
- Pre-llenar con el valor por defecto pero permitir edición
- Mostrar preview de la observación antes de crear la factura

---

#### 3. **¿Para qué necesita el usuario el campo "JSON de Factura"?**

**Problema actual:**
- Campo opcional que permite sobrescribir **todo el payload** de la factura
- **Muy técnico** para usuarios no desarrolladores
- No está claro cuándo usarlo ni qué formato debe tener
- Puede causar confusión: "¿Debo llenarlo o dejarlo vacío?"

**Lo que el usuario necesita saber:**
- ✅ **¿Cuándo debo usar este campo?** (solo para casos avanzados)
- ✅ **¿Qué formato debe tener?** (ejemplo visible)
- ✅ **¿Qué pasa si lo lleno?** (sobrescribe productos seleccionados)

**Solución sugerida:**
- Ocultar por defecto con opción "Modo avanzado"
- Agregar tooltip/ayuda explicando que es solo para casos especiales
- Mostrar ejemplo de formato si se activa
- Renombrar a algo más claro: "JSON Manual (Solo para casos avanzados)"

---

#### 4. **¿Cómo sabe el usuario que la factura se realizó correctamente?**

**Problema actual:**
- Solo muestra mensaje de texto: "✅ Factura creada exitosamente! Transaction ID: 12345"
- **No muestra un resumen** de lo que se creó:
  - Cliente seleccionado
  - Productos incluidos
  - Totales (subtotal, IVA, total)
  - Moneda utilizada
  - Observación enviada
  - Valores por defecto usados

**Lo que el usuario necesita saber:**
- ✅ **¿Qué se creó exactamente?** (resumen completo)
- ✅ **¿Cuáles son los totales?** (subtotal, IVA, total)
- ✅ **¿Qué valores por defecto se usaron?** (centro de costo, depósito, vendedor, etc.)
- ✅ **¿Dónde puedo ver la factura?** (enlace directo a Xubio si es posible)

**Solución sugerida:**
- Mostrar resumen completo antes de crear (preview)
- Después de crear, mostrar:
  - Resumen de la factura creada
  - Totales calculados
  - Valores por defecto usados
  - Enlace al PDF generado
  - Transaction ID destacado

---

#### 5. **¿Qué otra información necesita el usuario?**

**Información faltante que el usuario necesita:**

1. **Valores por defecto que se usarán:**
   - ✅ ¿Qué centro de costo se usará? (mostrar nombre, no solo ID)
   - ✅ ¿Qué depósito se usará? (mostrar nombre)
   - ✅ ¿Qué vendedor se usará? (mostrar nombre)
   - ✅ ¿Qué punto de venta se usará? (mostrar código/nombre)
   - ✅ ¿Qué circuito contable se usará? (mostrar nombre)

2. **Cálculos y totales:**
   - ✅ **Total de la factura antes de crearla** (preview)
   - ✅ **Desglose de IVA** por producto
   - ✅ **Subtotal sin IVA** y **Total con IVA**
   - ✅ **Total en moneda extranjera** (si aplica)

3. **Validaciones y advertencias:**
   - ✅ ¿Falta algún dato requerido? (mostrar antes de intentar crear)
   - ✅ ¿Los productos tienen precios válidos? (advertir si hay $0)
   - ✅ ¿La cotización es válida? (advertir si es muy alta/baja)

4. **Información del IVA:**
   - ✅ ¿Qué porcentaje de IVA se aplica a cada producto? (mostrar en tabla)
   - ✅ ¿El precio incluye IVA o no? (aclarar en la UI)

5. **Opciones de configuración:**
   - ✅ **Condición de pago**: ¿Cuenta Corriente o Contado? (actualmente hardcodeado a 1)
   - ✅ **Fecha de vencimiento**: ¿Puedo cambiarla? (actualmente igual a fecha)
   - ✅ **Tipo de comprobante**: ¿Solo factura o también notas? (actualmente hardcodeado a 1)

6. **Feedback visual:**
   - ✅ **Preview de la factura** antes de crearla (resumen visual)
   - ✅ **Indicador de progreso** durante la creación
   - ✅ **Confirmación visual** después de crear (no solo texto)

---

### 🔍 Problemas Identificados en el Flujo de Cobranza

#### 1. **¿Cómo sabe el usuario qué factura está cobrando?**

**Problema actual:**
- Usuario ingresa solo el ID de la factura
- No hay búsqueda/selector visual de facturas pendientes
- No se muestra información de la factura antes de crear la cobranza

**Lo que el usuario necesita saber:**
- ✅ **¿Qué factura estoy cobrando?** (mostrar detalles: número, fecha, monto, cliente)
- ✅ **¿Cuánto se debe?** (saldo pendiente)
- ✅ **¿Puedo cobrar parcialmente?** (validar que el importe no exceda el saldo)

**Solución sugerida:**
- Integrar con `/comprobantesAsociados` para listar facturas pendientes
- Mostrar preview de la factura antes de crear la cobranza
- Validar que el importe no exceda el saldo pendiente

---

#### 2. **¿Qué instrumento de pago se está usando?**

**Problema actual:**
- El instrumento de pago está hardcodeado:
  ```javascript
   cuentaTipo: 1, // 1 = Caja
   cuenta: { ID: 1, id: 1 }, // Cuenta de caja por defecto
   ```
- El usuario no sabe qué cuenta se usará
- No puede elegir entre diferentes formas de pago (efectivo, cheque, transferencia)

**Lo que el usuario necesita saber:**
- ✅ **¿Qué forma de pago se usará?** (efectivo, cheque, transferencia, etc.)
- ✅ **¿Qué cuenta se acreditará?** (mostrar nombre de la cuenta)
- ✅ **¿Puedo cambiar la forma de pago?** (selector de instrumentos)

**Solución sugerida:**
- Agregar selector de forma de pago
- Mostrar cuenta por defecto pero permitir cambiar
- Cargar cuentas disponibles desde la API

---

### 🔍 Problemas Identificados en el Flujo de PDF

#### 1. **¿Qué significa "Tipo Impresión"?**

**Problema actual:**
- Campo numérico sin explicación
- Usuario no sabe qué valores son válidos
- No hay descripción de qué hace cada tipo

**Lo que el usuario necesita saber:**
- ✅ **¿Qué es "Tipo Impresión"?** (explicación breve)
- ✅ **¿Qué valores puedo usar?** (1, 2, 3, etc. con descripciones si es posible)
- ✅ **¿Cuál es el valor por defecto?** (recomendado)

**Solución sugerida:**
- Agregar tooltip/ayuda explicando el campo
- Mostrar valores comunes con descripciones si están disponibles
- Guardar preferencia del usuario

---

## 📋 Resumen: Información que el Usuario Necesita Ver

### Antes de Crear la Factura (Preview/Resumen):

```
┌─────────────────────────────────────────────────┐
│ 📄 Resumen de Factura a Crear                  │
├─────────────────────────────────────────────────┤
│ Cliente: CORVUSWEB SRL (CUIT: 30-71241712-5)  │
│ Moneda: USD (Cotización: $1,250.00)            │
│ Fecha: 2024-01-15                               │
│ Vencimiento: 2024-01-15                         │
│ Condición de Pago: Cuenta Corriente            │
│                                                 │
│ Productos:                                      │
│ • Producto A - Cant: 2 - $100.00 c/u           │
│   IVA 21%: $42.00 - Subtotal: $200.00         │
│ • Producto B - Cant: 1 - $50.00 c/u            │
│   IVA 21%: $10.50 - Subtotal: $50.00           │
│                                                 │
│ Totales:                                        │
│ Subtotal: $250.00                               │
│ IVA: $52.50                                     │
│ Total: $302.50                                  │
│                                                 │
│ Valores por Defecto:                            │
│ • Centro de Costo: Centro Principal            │
│ • Depósito: Depósito Central                    │
│ • Vendedor: Juan Pérez                          │
│ • Punto de Venta: 0001                          │
│ • Circuito Contable: Circuito Principal        │
│                                                 │
│ Observaciones:                                  │
│ CC ARS 261-6044134-3 // CBU...                 │
│ [Editar]                                        │
└─────────────────────────────────────────────────┘
```

### Después de Crear la Factura (Confirmación):

```
┌─────────────────────────────────────────────────┐
│ ✅ Factura Creada Exitosamente                  │
├─────────────────────────────────────────────────┤
│ Transaction ID: 67519506                        │
│ Número de Factura: 0001-00001234                │
│                                                 │
│ Cliente: CORVUSWEB SRL                          │
│ Total: $302.50 USD                              │
│                                                 │
│ [Ver PDF] [Ver en Xubio] [Crear Otra]          │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Recomendaciones de Mejora

### Prioridad Alta (Crítico para UX):

1. ~~**Agregar selector de moneda visible** (USD/ARS)~~ ✅ **IMPLEMENTADO** - Selector con DOLARES por defecto + cotización automática
2. **Mostrar campo de observaciones editable** con valor por defecto
3. **Mostrar resumen/preview antes de crear** la factura
4. **Mostrar valores por defecto** que se usarán (centro de costo, depósito, etc.)
5. **Calcular y mostrar totales** antes de crear

### Prioridad Media (Mejora significativa):

6. **Ocultar campo JSON** en modo avanzado
7. **Agregar selector de condición de pago** (Cuenta Corriente/Contado)
8. **Mostrar porcentaje de IVA** por producto
9. **Validar datos antes de crear** (mostrar advertencias)
10. **Mejorar feedback visual** (indicadores de progreso, confirmaciones)

### Prioridad Baja (Nice to have):

11. **Integrar búsqueda de facturas pendientes** en cobranza
12. **Agregar selector de forma de pago** en cobranza
13. **Guardar preferencias del usuario** (tipo impresión, moneda, etc.)
14. **Agregar tooltips/ayuda contextual** en campos técnicos

---

## 📚 Referencias

- **Documentación API Xubio**: `test-imprimir-pdf/docs/API_Xubio.md`
- **Plan de Refactorización**: `test-imprimir-pdf/docs/REFACTOR_PLAN.md`
- **Requerimientos**: `test-imprimir-pdf/docs/requerimientos.md`

