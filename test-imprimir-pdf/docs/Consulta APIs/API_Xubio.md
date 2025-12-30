# Documentación de la API Xubio

Esta documentación resume la información obtenida de la documentación oficial de la API de Xubio:
- **Documentación interactiva**: `https://xubio.com/API/documentation/index.html`
- **Swagger JSON**: `https://xubio.com/API/1.1/swagger.json`

Para cada recurso se indican las operaciones disponibles, la ruta del servicio, el método HTTP, los parámetros (nombre y descripción) y un resumen del objeto de respuesta/solicitud. Esta documentación ha sido completada y actualizada con información detallada del swagger.json oficial.

---

## Autenticación

La API de Xubio utiliza autenticación OAuth2 con el flujo **Client Credentials**. Todas las peticiones a la API requieren un token de acceso válido.

### Configuración Base

- **Base URL**: `https://xubio.com/API/1.1`
- **Token Endpoint**: `https://xubio.com/API/1.1/TokenEndpoint`

### Obtención del Token de Acceso

#### POST `/TokenEndpoint` – Obtener token de acceso

* **Descripción:** Obtiene un token de acceso usando las credenciales del cliente (clientId y secretId).

* **Método:** POST

* **URL:** `https://xubio.com/API/1.1/TokenEndpoint`

* **Headers:**
  | Nombre | Valor | Descripción |
  |-------|-------|-------------|
  | `Authorization` | `Basic {base64(clientId:secretId)}` | Credenciales codificadas en Base64 |
  | `Content-Type` | `application/x-www-form-urlencoded` | Tipo de contenido del payload |
  | `Accept` | `application/json` | Formato de respuesta esperado |

* **Payload (form-urlencoded):**
  ```
  grant_type=client_credentials
  ```

* **Respuesta (JSON):**
  ```json
  {
    "access_token": "string",  // o "token" en algunas versiones
    "expires_in": 3600,         // Tiempo de expiración en segundos (típicamente 3600 = 1 hora)
    "token_type": "Bearer"
  }
  ```

* **Ejemplo de implementación:**
  ```javascript
  const clientId = 'tu_client_id';
  const secretId = 'tu_secret_id';
  const basic = Utilities.base64Encode(clientId + ':' + secretId);
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + basic,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    payload: 'grant_type=client_credentials'
  };
  
  const response = UrlFetchApp.fetch('https://xubio.com/API/1.1/TokenEndpoint', options);
  const json = JSON.parse(response.getContentText());
  const token = json.access_token || json.token;
  ```

### Uso del Token en Peticiones

Una vez obtenido el token, debe incluirse en todas las peticiones a la API mediante el header `Authorization`:

* **Header requerido:**
  | Nombre | Valor |
  |-------|-------|
  | `Authorization` | `Bearer {token}` |

* **Headers adicionales recomendados:**
  | Nombre | Valor |
  |-------|-------|
  | `Accept` | `application/json` |
  | `Content-Type` | `application/json` (para POST/PUT) |

### Gestión del Token

* **Expiración:** Los tokens típicamente expiran después de 3600 segundos (1 hora). Se recomienda implementar cache del token y renovarlo automáticamente antes de su expiración.

* **Manejo de errores 401:** Si una petición devuelve código 401 (Unauthorized), el token probablemente ha expirado. Se debe obtener un nuevo token y reintentar la petición.

* **Ejemplo de cache:**
  ```javascript
  // Guardar token con expiración (con margen de seguridad de 300 segundos)
  const expiresIn = parseInt(json.expires_in || "3600", 10);
  const expiration = Math.floor(Date.now() / 1000) + expiresIn;
  // Usar token si no ha expirado (con margen de 300s)
  if (now < (expiration - 300)) {
    return savedToken;
  }
  ```

---

## Recursos principales de negocio

### Clientes (`clienteBean`)

#### GET `/clienteBean` – Obtener todos los clientes
* **Descripción:** Devuelve un array de clientes con parámetros opcionales. Si no se envían parámetros se devuelven todos los clientes.
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `activo` (entero) | Filtra clientes activos (1) o inactivos (0). |
  | `esCliente` (entero) | Indica si es cliente. |
  | `nombre` (string) | Filtra por nombre. |
  | `tipoIdentificacion` (string) | Tipo de identificación. |
  | `dummyexample` (entero) | Campo de ejemplo sin funcionalidad. |
  | `esclienteextranjero` (entero) | Marca si es cliente extranjero. |
  | `numeroIdentificacion` (string) | Número de identificación. |
  | `email` (string) | Dirección de correo. |
* **Respuesta:** Cada objeto cliente incluye campos como `cliente_id`, `nombre`, `primerApellido`, `otrosNombres`, `razonSocial`, `nombreComercial` y objetos anidados para `identificacionTributaria`, `categoriaFiscal`, `provincia`, etc. El ejemplo de respuesta muestra estos campos.

#### POST `/clienteBean` – Crear un cliente
* **Descripción:** Crea un nuevo cliente. Se debe enviar un objeto cliente en el cuerpo.
* **Parámetros del cuerpo:** Objeto `Cliente` con todos los campos de un cliente: identificación, nombres, razón social, datos fiscales, dirección, etc. El ejemplo de cuerpo incluye `cliente_id`, `nombre`, `razonSocial`, `identificacionTributaria`, `categoriaFiscal` y demás.
* **Respuesta:** Devuelve el objeto cliente guardado.

#### GET `/clienteBean/{id}` – Obtener cliente por ID
* **Descripción:** Devuelve un cliente específico.
* **Parámetros de ruta:** `id` (entero int64, requerido) – Identificador del cliente.
* **Respuesta:** Objeto cliente igual que en el GET general.

#### PUT `/clienteBean/{id}` – Actualizar un cliente
* **Descripción:** Actualiza un cliente existente.
* **Parámetros de ruta:** `id` (int64, requerido) – ID del cliente a actualizar.
* **Cuerpo:** Objeto cliente con los campos a actualizar. El formato es igual al de creación.

#### DELETE `/clienteBean/{id}` – Eliminar cliente
* **Descripción:** Elimina el cliente con el id indicado.
* **Parámetros de ruta:** `id` (int64, requerido) – Identificador del cliente.
* **Respuesta:** Operación exitosa sin contenido.

---

### Presupuestos (`presupuestoBean`)

#### GET `/presupuestoBean` – Obtener listado de presupuestos
* **Descripción:** Devuelve un listado de presupuestos de venta. No requiere parámetros.
* **Respuesta:** Cada presupuesto contiene campos como `circuitoContable` (objeto con ID y nombre del circuito), `comprobante` (código del comprobante), `comprobanteAsociado`, `transaccionId`, `externalId`, datos del `cliente`, nombre del presupuesto (`nombre`), fechas (`fecha`, `fechaVto`), `puntoVenta`, etc.

#### POST `/presupuestoBean` – Crear un presupuesto
* **Descripción:** Crea un nuevo presupuesto de venta.
* **Cuerpo:** Objeto `PresupuestoBean` con campos requeridos:
  - `cliente` (objeto, requerido) - Cliente asociado
  - `condicionDePago` (int32, requerido) - 1 = Cuenta Corriente, 2 = Contado
  - `cotizacion` (number, requerido)
  - `cotizacionListaDePrecio` (number, requerido)
  - `deposito` (objeto, requerido)
  - `descripcion` (string, requerido)
  - `externalId` (string, requerido)
  - `facturaNoExportacion` (boolean, requerido)
  - `fecha` (date, requerido)
  - `fechaVto` (date, requerido)
  - `listaDePrecio` (objeto, requerido)
  - `nombre` (string, requerido)
  - `numeroDocumento` (string, requerido)
  - `porcentajeComision` (number, requerido)
  - `probabilidad` (int32, requerido)
  - `provincia` (objeto, requerido)
  - `puntoVenta` (objeto, requerido)
  - `transaccionProductoItems` (array, requerido) - Items de productos (precio con IVA incluido)
  - `vendedor` (objeto, requerido)
* **Campos opcionales:**
  - `circuitoContable` (objeto)
  - `comprobante` (int64)
  - `comprobanteAsociado` (int64)
  - `transaccionId` (int64)

#### GET `/presupuestoBean/{id}` – Obtener presupuesto determinado
* **Descripción:** Devuelve un presupuesto por su id.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Objeto presupuesto con todos los campos (igual que la respuesta del POST).

#### PUT `/presupuestoBean/{id}` – Actualizar un presupuesto
* **Descripción:** Actualiza un presupuesto existente.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Cuerpo:** Objeto presupuesto con campos a actualizar (mismo formato que en el POST).
* **Respuesta:** Devuelve el presupuesto actualizado.

#### DELETE `/presupuestoBean/{id}` – Eliminar un presupuesto
* **Descripción:** Elimina el presupuesto determinado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Operación exitosa sin contenido.

#### PUT `/presupuestoBean/{id}/estado` – Actualizar estado del presupuesto
* **Descripción:** Cambia el estado de un presupuesto.
* **Estados disponibles:**
  - `-3` = Pendiente de Aprobar
  - `-2` = Aprobado
  - `-7` = Rechazado
  - `-5` = Facturado
  - `-4` = Remitido
* **Parámetros de ruta:** `id` (int64, requerido) – ID de la transacción a mover de estado.
* **Cuerpo:** Objeto `EstadoBean` que representa el nuevo estado; incluye `ID`, `nombre`, `codigo` e `id`.
* **Respuesta:** Operación exitosa.

---

### Comprobante de Venta (`comprobanteVentaBean`)

#### GET `/comprobanteVentaBean` – Obtener comprobantes de venta
* **Descripción:** Retorna una lista de comprobantes (facturas/Notas de crédito) emitidos. Se pueden filtrar por fecha y paginar.
* **Tipos de comprobante:** 
  - `1` = Factura
  - `2` = Nota de Débito
  - `3` = Nota de Crédito
  - `4` = Recibo
  - `5` = Informe Diario de Cierre
* **Condición de Pago:**
  - `1` = Cuenta Corriente
  - `2` = Contado
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `fechaDesde` (date-time, opcional) | Fecha inicial. |
  | `fechaHasta` (date-time, opcional) | Fecha final. |
* **Encabezados opcionales (Headers):**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `minimalVersion` | boolean | Si se envía `true` devuelve versión resumida del endpoint. |
  | `lastTransactionID` | int64 | Último ID de la página utilizado para filtrar la siguiente página (solo disponible en `minimalVersion`). |
  | `limit` | int | Límite de registros a devolver (solo disponible en `minimalVersion`). |
* **Respuesta:** Cada comprobante contiene datos del circuito contable, tipo de comprobante, comprobantes asociados, período de servicios (`fechaDesdeServicios` y `fechaHastaServicios`), CAE, `transaccionId`, `externalId`, cliente, detalle de líneas (`transaccionProductoItems`), moneda, cotización, total, etc.

#### POST `/comprobanteVentaBean` – Crear comprobante de venta
* **Descripción:** Crea una factura o nota de crédito/débito de venta.
* **Tipos de comprobante:**
  - `1` = Factura
  - `2` = Nota de Débito
  - `3` = Nota de Crédito
  - `4` = Recibo
  - `5` = Informe Diario de Cierre
* **Condición de Pago:**
  - `1` = Cuenta Corriente
  - `2` = Contado
* **Cuerpo:** Objeto comprobante de venta con muchos campos:
  - `circuitoContable`, `comprobante` y `comprobanteAsociado`
  - Fechas de servicio (`fechaDesdeServicios`, `fechaHastaServicios`), CAE
  - `transaccionId`, `externalId`
  - `cliente`
  - **Items de productos (`transaccionProductoItems`)**: lista de ítems con cantidad, precio, IVA, etc. ⚠️ **NOTA:** El campo correcto es `transaccionProductoItems`, NO `detalleComprobantes`. Ver sección "Hallazgos del Swagger JSON" para estructura completa.
  - Moneda (`moneda`), cotización, total, etc.

> ⚠️ **ADVERTENCIA sobre campo `observacion`:**
> El campo `observacion` **NO está documentado oficialmente** en el swagger.json para `ComprobanteVentaBean`. Sin embargo, la aplicación lo envía y Xubio podría aceptarlo aunque no esté documentado.
> 
> **Campos disponibles para texto en facturas:**
> | Campo | Nivel | ¿Documentado? | Uso |
> |-------|-------|---------------|-----|
> | `descripcion` | Factura general | ✅ Sí | Descripción general del comprobante |
> | `observacion` | Factura general | ❌ No | Observaciones adicionales (CBU, datos bancarios) |
> | `transaccionProductoItems[].descripcion` | Cada ítem/producto | ✅ Sí | Descripción de cada línea |
> 
> **Implementación actual:** La aplicación envía AMBOS campos:
> - `descripcion`: Campo documentado para descripción general
> - `observacion`: Campo no documentado para observaciones adicionales
> - `transaccionProductoItems[].descripcion`: Descripción personalizable por ítem
> 
> **Nota:** El campo `observacion` SÍ está documentado en otros recursos como `CobranzaBean`, `PagoBean` y `RemitoVentaBean`.

* **Respuesta:** Devuelve el comprobante creado.

#### GET `/comprobanteVentaBean/{id}` – Obtener comprobante de venta
* **Descripción:** Devuelve un comprobante específico por id.
* **Tipos de comprobante:** 1- Factura, 2- Nota de Débito, 3- Nota de Crédito, 4- Recibo, 5- Informe Diario de Cierre.
* **Condición de Pago:** 1- Cuenta Corriente, 2- Contado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Objeto comprobante con los mismos campos que en el POST.

#### PUT `/comprobanteVentaBean/{id}` – Actualizar comprobante
* **Descripción:** Actualiza un comprobante existente.
* **Tipos de comprobante:** 1- Factura, 2- Nota de Débito, 3- Nota de Crédito, 4- Recibo, 5- Informe Diario de Cierre.
* **Condición de Pago:** 1- Cuenta Corriente, 2- Contado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Cuerpo:** Objeto comprobante de venta (formato igual al de creación).
* **Respuesta:** Comprobante actualizado.

#### DELETE `/comprobanteVentaBean/{id}` – Eliminar comprobante
* **Descripción:** Elimina el comprobante indicado.
* **Tipos de comprobante:** 1- Factura, 2- Nota de Débito, 3- Nota de Crédito, 4- Recibo, 5- Informe Diario de Cierre.
* **Condición de Pago:** 1- Cuenta Corriente, 2- Contado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Operación exitosa.

---

### Cobranza (`cobranzaBean`)

#### GET `/cobranzaBean` – Obtener cobranzas
* **Descripción:** Obtiene un listado de cobranzas (recibos). Se pueden filtrar por fecha.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `fechaDesde` (date-time, opcional) | string | Fecha inicial del filtro. |
  | `fechaHasta` (date-time, opcional) | string | Fecha final del filtro. |
* **Respuesta:** Una lista de objetos `CobranzaBean`. Cada cobranza contiene:
  - `circuitoContable` (objeto)
  - `cliente` (objeto)
  - `fecha` (date-time)
  - `numeroRecibo` (string)
  - `monedaCtaCte` (objeto MonedaBean)
  - `cotizacion` (number)
  - `utilizaMonedaExtranjera` (int64)
  - `observacion` (string)
  - `transaccionInstrumentoDeCobro` (array) - Instrumentos de cobro (cheques, efectivo, etc.)
  - `transaccionRetencionItem` (array) - Items de retención
  - `transaccionid` (int64)

#### POST `/cobranzaBean` – Crear cobranza
* **Descripción:** Crea una nueva cobranza.
* **Cuerpo:** Objeto `CobranzaBean` con campos:
  - `circuitoContable` (objeto)
  - `cliente` (objeto)
  - `fecha` (date-time)
  - `numeroRecibo` (string)
  - `monedaCtaCte` (objeto MonedaBean)
  - `cotizacion` (number)
  - `utilizaMonedaExtranjera` (int64)
  - `observacion` (string)
  - `transaccionInstrumentoDeCobro` (array) - Instrumentos de cobro con:
    - `cuentaTipo` (int64)
    - `cuenta` (objeto CuentaCodigoBean)
    - `moneda` (objeto MonedaBean)
    - `cotizacion` (number)
    - `importe` (number)
    - `numCheque` (string) - Número de cheque (si aplica)
    - `vtoCheque` (date-time) - Vencimiento del cheque (si aplica)
    - `banco` (objeto BancoBean) - Banco del cheque (si aplica)
    - `descripcion` (string)
  - `transaccionRetencionItem` (array) - Items de retención con:
    - `tipoRetencion` (string)
    - `conceptoRetencion` (objeto)
    - `descripcion` (string)
    - `numeroComprobante` (string)
    - `moneda` (objeto MonedaBean)
    - `cotizacion` (number)
    - `importeISAR` (number)
    - `importeRetenido` (number)
    - `importeMonPpal` (number)
    - `fechaComprobante` (date-time)
* **Respuesta:** Devuelve la cobranza creada.

#### PUT `/cobranzaBean` – Actualizar cobranza
* **Descripción:** Actualiza una cobranza existente.
* **Cuerpo:** Objeto `CobranzaBean` completo con todos los campos necesarios para guardar.
* **Respuesta:** Devuelve la cobranza actualizada.

#### DELETE `/cobranzaBean/{id}` – Eliminar cobranza
* **Descripción:** Elimina la cobranza con el ID indicado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Operación exitosa.

---

### Orden de Pago (`OrdenDePago`)

Este recurso engloba operaciones para consultar y crear órdenes de pago.

#### GET `/pagoBean` – Listado de pagos/órdenes de pago
* **Descripción:** Devuelve un listado de órdenes de pago dentro de un rango de fechas.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `fechaDesde` (string, opcional) | string | Fecha de inicio. Soporta formatos `DD/MM/AAAA`, `DD-MM-AAAA` o `AAAA-MM-DD`. |
  | `fechaHasta` (string, opcional) | string | Fecha límite, con los mismos formatos. |
* **Respuesta:** Array de objetos `PagoBean` con campos:
  - `transaccionid` (int64) - Identificador de la transacción
  - `circuitoContable` (objeto) - Objeto con `ID`, `nombre` y `codigo`
  - `proveedor` (objeto) - Objeto con datos del proveedor (`ID`, `nombre`, `codigo` y `id`)
  - `fecha` (date) - Fecha del pago
  - `numeroRecibo` (string) - Número de recibo
  - `cotizacion` (number) - Cotización de moneda
  - `utilizaMonedaExtranjera` (int32) - Si usa moneda extranjera
  - `observacion` (string) - Observaciones
  - `moneda` (objeto MonedaBean) - Moneda del pago
  - `transaccionInstrumentoDePago` (array) - Instrumentos de pago con:
    - `tipoCuenta` (int32)
    - `cuenta` (objeto CuentaBean)
    - `moneda` (objeto MonedaBean)
    - `cotizacion` (number)
    - `importe` (number)
    - `chequeTerceros` (int64) - Si es cheque de terceros
    - `chequePropio` (string) - Número de cheque propio
    - `vencimientoCheque` (date-time) - Vencimiento del cheque
    - `banco` (objeto BancoBean) - Banco del cheque
    - `descripcion` (string)
  - `transaccionRetencionItems` (array) - Items de retención

#### POST `/pagoBean` – Crear nueva orden de pago
* **Descripción:** Crea una orden de pago.
* **Cuerpo:** Objeto `PagoBean` con estructura similar a la respuesta del GET:
  - `circuitoContable` (objeto, requerido)
  - `proveedor` (objeto, requerido)
  - `fecha` (date, requerido)
  - `numeroRecibo` (string, requerido)
  - `cotizacion` (number, requerido)
  - `utilizaMonedaExtranjera` (int32, requerido)
  - `observacion` (string, opcional)
  - `moneda` (objeto MonedaBean, opcional)
  - `transaccionInstrumentoDePago` (array, requerido) - Lista de instrumentos de pago con los mismos campos que en el GET
  - `transaccionRetencionItems` (array, opcional) - Items de retención
* **Respuesta:** Devuelve la orden de pago creada.

---

### Facturar (`facturar`)

#### POST `/facturar` – Generar factura
* **Descripción:** Genera una factura de venta. Es similar a la operación POST de `comprobanteVentaBean` pero orientada específicamente a la acción de facturar.
* **Tipos de comprobante soportados:**
  - `1` = Factura
  - `2` = Nota de Débito
  - `3` = Nota de Crédito
  - `4` = Informe Diario de Cierre
  - `6` = Recibo
* **Condición de Pago:**
  - `1` = Cuenta Corriente
  - `2` = Contado
* **Cuerpo:** Objeto `ComprobanteVentaBean` completo con todos los campos requeridos. ⚠️ **NOTA:** El campo correcto para items es `transaccionProductoItems`, NO `detalleComprobantes`. Ver sección "Hallazgos del Swagger JSON" para estructura completa.

> ⚠️ **ADVERTENCIA sobre campo `observacion`:** Ver nota en la sección `/comprobanteVentaBean`. El campo `observacion` no está oficialmente documentado para facturas.

* **Respuesta:** Devuelve el comprobante facturado (objeto `ComprobanteVentaBean`).

---

### Comprobantes Asociados (`comprobantesAsociados`)

#### GET `/comprobantesAsociados` – Obtener comprobantes asociados
* **Descripción:** Permite obtener documentos asociados a un cliente para aplicar cobranzas o notas de crédito.
* **Parámetros de consulta (obligatorios):**
  | Nombre | Descripción |
  |-------|-------------|
  | `clienteId` (int32) | ID del cliente. |
  | `tipoComprobante` (int32) | Tipo de comprobante. Los códigos son: 1 Factura, 2 Nota de Débito, 3 Nota de Crédito, 6 Recibo, 10 Factura de Crédito MiPyME, 11 Nota de Débito MiPyME y 12 Nota de Crédito MiPyME. |
* **Respuesta:** Lista de objetos con `idComprobante`, `tipoComprobante` y `numeroComprobante`.

---

## Recursos de configuración y maestros

### Banco

#### GET `/banco` – Obtener bancos
* **Descripción:** Devuelve un array de bancos. El parámetro opcional `activo` filtra activos/inactivos (1 = true, 0 = false).
* **Parámetros:**
  | Nombre | Descripción |
  |-------|-------------|
  | `activo` (int, opcional) | Filtra bancos activos. |
* **Respuesta:** Cada banco tiene campos `ID`, `nombre`, `codigo` e `id`.

---

### Categoría Fiscal (`categoriaFiscal`)

#### GET `/categoriaFiscal` – Obtener categorías fiscales
* **Descripción:** Devuelve las categorías fiscales disponibles.
* **Parámetros:** `activo` (int, opcional) – 1 = activo, 0 = inactivo; si no se envía se devuelven ambas.
* **Respuesta:** Objetos con `ID`, `nombre`, `codigo` e `id`.

---

### Categorías de cuentas (`categoriaCuenta`)

#### GET `/categoriaCuenta` – Obtener todas las categorías de cuentas
* **Descripción:** Devuelve un array de categorías de cuentas.
* **Parámetros de consulta:** Ninguno.
* **Respuesta (ejemplo):** Objeto con claves `codigo`, `nombre`, `id` e `ID` (identificador duplicado).

---

### Circuito Contable (`circuitoContableBean`)

#### GET `/circuitoContableBean` – Obtener circuitos contables
* **Descripción:** Lista los circuitos contables. Permite filtrar por estado activo.
* **Parámetros:** `activo` (entero, opcional) – 1 = activo, 0 = inactivo; al omitirlo se devuelven todos.
* **Respuesta:** Cada circuito contable contiene `circuitoContable_id`, `codigo` y `nombre`.

---

### Centros de costo (`centroDeCosto`)

#### GET `/centroDeCostoBean` – Listar centros de costo
* **Descripción:** Permite filtrar centros de costo por estado. El parámetro opcional `activo` acepta `1` para activos y `0` para inactivos; si se omite se devuelven ambos.
* **Parámetros de consulta:**
  * `activo` (integer, *query*): Indica si se buscan centros activos (`1`) o inactivos (`0`).
* **Respuesta (ejemplo):** Objeto con campos `ID`, `nombre`, `codigo` e `id`.

---

### Cuenta (`cuenta`)

#### GET `/cuenta/{id}` – Obtener cuenta específica
* **Descripción:** Devuelve una cuenta por su id.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Objeto cuenta con `ID`, `nombre`, `codigo` e `id`.

#### GET `/cuenta` – Listar cuentas
* **Descripción:** Lista cuentas contables; permite filtrar por estado o categoría.
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `activo` (int, opcional) | Filtra cuentas activas (1) o inactivas (0). |
  | `categoriaid` (int, opcional) | ID de la categoría de cuenta. |
* **Respuesta:** Lista de objetos cuenta (igual que GET por id).

#### POST `/cuenta` – Crear cuenta
* **Descripción:** Crea una nueva cuenta contable.
* **Cuerpo:** Objeto cuenta con campos `ID`, `nombre`, `codigo` e `id`.
* **Respuesta:** Devuelve la cuenta creada.

---

### Depósitos (`depósito`)

#### GET `/depositos` – Obtener depósitos
* **Descripción:** Devuelve un array de depósitos. El parámetro opcional `activo` permite filtrar (`1` = true, `0` = false).
* **Parámetros de consulta:**
  * `activo` (integer, *query*): Filtra por depósitos activos o inactivos.
* **Respuesta (ejemplo):** Objeto con `ID`, `nombre`, `codigo` e `id`.

---

### Identificación tributaria (`identificacionTributaria`)

#### GET `/identificacionTributaria` – Tipos de identificaciones tributarias
* **Descripción:** Devuelve un array de tipos de identificación tributaria. El parámetro opcional `activo` acepta `1 = true` o `0 = false`.
* **Parámetro de consulta:**
  * `activo` (integer, *query*): Filtra por identificaciones activas/inactivas.
* **Respuesta (ejemplo):** Objeto con campos `ID`, `nombre`, `codigo` e `id`.

---

### Localidades (`localidad`)

#### GET `/localidadBean` – Listar localidades
* **Descripción:** Devuelve una lista de localidades. Admite un parámetro opcional `provincia_id` para filtrar por provincia.
* **Parámetro de consulta:**
  * `provincia_id` (integer, *query*): ID de la provincia para filtrar.
* **Respuesta (ejemplo):** Objeto con claves `ID`, `nombre`, `codigo` e `id`.

---

### Monedas (`moneda`)

#### GET `/monedaBean` – Obtener monedas
* **Descripción:** Lista las monedas. Permite filtrar por estado (`activo`) y también por `id` de moneda.
* **Parámetros de consulta:**
  * `activo` (integer, *query*): `1` muestra solo activos, `0` solo inactivos; si se omite se devuelven todas.
  * `id` (integer, *query*): ID de la moneda para búsqueda puntual.
* **Respuesta (ejemplo):** Objeto con campos `ID`, `nombre` (ejemplo "Pesos Argentinos"), `codigo` e `id`.

---

## Utilidades

### Imprimir PDF (`imprimirPDF`)

#### GET `/imprimirPDF` – Obtener URL de PDF
* **Descripción:** Devuelve la URL para descargar el PDF de un comprobante.
* **⚠️ IMPORTANTE:** Según el Swagger, **ambos parámetros son obligatorios** (aunque aparezcan como opcionales en la definición técnica).
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `idtransaccion` (int64, **requerido**) | integer | ID de la transacción cuyo PDF se desea descargar. |
  | `tipoimpresion` (int32, **requerido**) | integer | Tipo de impresión. Los valores específicos no están documentados públicamente, pero típicamente se usa `1` para impresión estándar. |
* **Respuesta:** Objeto `ImprimirPDFBean` con:
  - `nombrexml` (string) - Nombre del XML asociado
  - `datasource` (string) - Fuente de datos
  - `urlPdf` (string) - URL para descargar el archivo PDF

---

## Otros recursos importantes

### Vendedor (`vendedorBean`)

#### GET `/vendedorBean` – Obtener vendedores
* **Descripción:** Obtiene un array de vendedores. Permite filtrar por estado activo.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `activo` (int32, opcional) | integer | `1` = activo, `0` = inactivo |
* **Respuesta:** Array de objetos `VendedorBean` con campos `ID`, `nombre`, `codigo`, `id`, `activo`, etc.

---

### Punto de Venta (`puntoVentaBean`)

#### GET `/puntoVentaBean` – Obtener puntos de venta
* **Descripción:** Obtiene una lista de Puntos de Ventas. Permite filtrar por modo de numeración y estado activo.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `modonumeracion` (string, opcional) | string | Modo de numeración: `automatico` o `editablesugerido` |
  | `activo` (int64, opcional) | integer | `0` = No Activo, `1` = Activo |
* **Respuesta:** Array de objetos `PuntoVentaBean` con campos `ID`, `nombre`, `codigo`, `id`, `activo`, etc.

---

## Recursos adicionales de negocio

### Mi Empresa (`miempresa`)

#### GET `/miempresa` – Obtener datos de la empresa
* **Descripción:** Obtiene los datos de la empresa configurada en Xubio.
* **Parámetros:** Ninguno.
* **Respuesta:** Objeto `EmpresaBean` con campos como:
  - `nombreEmpresa` (string)
  - `categoriaFiscal` (int64)
  - `tipoDeCuenta` (int64)
  - `ingresosBrutos` (string)
  - `fechaInicioActividad` (date-time)
  - `direccion` (string)
  - `pais` (int64)
  - `provincia` (int64)
  - `localidad` (int64)
  - `telefono` (string)
  - `email` (string)
  - `facturam` (int64)
  - `cuit` (string)

---

### Comprobante de Compra (`comprobanteCompraBean`)

#### GET `/comprobanteCompraBean` – Obtener listado de facturas de compra
* **Descripción:** Retorna una lista de comprobantes de compra (facturas/Notas de crédito/débito de compra) emitidos.
* **Tipos de comprobante:**
  - `1` = Factura
  - `2` = Nota de Débito
  - `3` = Nota de Crédito
  - `6` = Recibo
  - `99` = Otros Comprobantes
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `fechaDesde` (date-time, opcional) | string | Fecha inicial del filtro. |
  | `fechaHasta` (date-time, opcional) | string | Fecha final del filtro. |
* **Respuesta:** Array de objetos `ComprobanteCompraBean` con estructura similar a `ComprobanteVentaBean` pero orientada a compras.

#### POST `/comprobanteCompraBean` – Crear factura de compra
* **Descripción:** Crea una nueva factura de compra.
* **Tipos de comprobante:** 1- Factura, 2- Nota de Débito, 3- Nota de Crédito, 6- Recibo, 99- Otros Comprobantes.
* **Cuerpo:** Objeto `ComprobanteCompraBean` con campos requeridos:
  - `condicionDePago` (int32, requerido) - 1 = Cuenta Corriente, 2 = Contado
  - `cotizacion` (number, requerido)
  - `cotizacionListaDePrecio` (number, requerido)
  - `deposito` (objeto, requerido)
  - `descripcion` (string, requerido)
  - `externalId` (string, requerido)
  - `fecha` (date, requerido)
  - `fechaComprobante` (date, requerido)
  - `fechaVto` (date, requerido)
  - `importeMonPrincipal` (number, requerido)
  - `listaDePrecio` (objeto, requerido)
  - `nombre` (string, requerido)
  - `numeroDocumento` (string, requerido)
  - `proveedor` (objeto, requerido)
  - `provincia` (objeto, requerido)
  - `tipo` (int32, requerido)
  - `transaccionOrdenPagoItems` (array, requerido) - Items de orden de pago
  - `transaccionPercepcionItems` (array, requerido)
  - `transaccionProductoItems` (array, requerido)

#### GET `/comprobanteCompraBean/{id}` – Obtener factura de compra
* **Descripción:** Devuelve un comprobante de compra específico por id.
* **Parámetros de ruta:** `id` (int64, requerido).

#### PUT `/comprobanteCompraBean/{id}` – Actualizar factura de compra
* **Descripción:** Actualiza un comprobante de compra existente.
* **Parámetros de ruta:** `id` (int64, requerido).

#### DELETE `/comprobanteCompraBean/{id}` – Eliminar factura de compra
* **Descripción:** Elimina el comprobante de compra indicado.
* **Parámetros de ruta:** `id` (int64, requerido).

---

### Orden de Compra (`ordenCompraBean`)

#### GET `/ordenCompraBean` – Obtener listado de órdenes de compra
* **Descripción:** Devuelve un listado de órdenes de compra.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `OrdenCompraBean`.

#### POST `/ordenCompraBean` – Crear orden de compra
* **Descripción:** Crea una nueva orden de compra.
* **Cuerpo:** Objeto `OrdenCompraBean` con campos requeridos:
  - `condicionDePago` (int32, requerido)
  - `cotizacion` (number, requerido)
  - `cotizacionListaDePrecio` (number, requerido)
  - `deposito` (objeto, requerido)
  - `descripcion` (string, requerido)
  - `externalId` (string, requerido)
  - `fecha` (date, requerido)
  - `fechaComprobante` (date, requerido)
  - `fechaVto` (date, requerido)
  - `listaDePrecio` (objeto, requerido)
  - `nombre` (string, requerido)
  - `numeroDocumento` (string, requerido)
  - `probabilidad` (int32, requerido)
  - `proveedor` (objeto, requerido)
  - `provincia` (objeto, requerido)
  - `transaccionProductoItems` (array, requerido)

#### GET `/ordenCompraBean/{id}` – Obtener orden de compra
* **Descripción:** Devuelve una orden de compra específica.
* **Parámetros de ruta:** `id` (int64, requerido).

#### PUT `/ordenCompraBean/{id}` – Actualizar orden de compra
* **Descripción:** Actualiza una orden de compra existente.
* **Parámetros de ruta:** `id` (int64, requerido).

#### DELETE `/ordenCompraBean/{id}` – Eliminar orden de compra
* **Descripción:** Elimina la orden de compra indicada.
* **Parámetros de ruta:** `id` (int64, requerido).

---

### Remito de Venta (`remitoVentaBean`)

#### GET `/remitoVentaBean` – Obtener remitos de venta
* **Descripción:** Obtiene una lista de remitos de venta. Permite filtrar por fecha o ID de transacción.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `transaccionid` (int64, opcional) | integer | ID de la transacción específica. |
  | `fechaDesde` (date-time, opcional) | string | Fecha inicial del filtro. |
  | `fechaHasta` (date-time, opcional) | string | Fecha final del filtro. |
* **Respuesta:** Array de objetos `RemitoVentaBean` con campos:
  - `transaccionId` (int64)
  - `clienteId` (int64)
  - `numeroRemito` (string)
  - `fecha` (date)
  - `vendedorId` (int64)
  - `comisionVendedor` (number)
  - `sucursalClienteId` (int64)
  - `depositoId` (int64)
  - `transporteId` (int64)
  - `listaPrecioId` (int64)
  - `observacion` (string)
  - `circuitoContableId` (int64)
  - `transaccionProductoItem` (array)

#### POST `/remitoVentaBean` – Crear remito de venta
* **Descripción:** Crea un nuevo remito de venta.
* **Cuerpo:** Objeto `RemitoVentaBean` completo.

#### PUT `/remitoVentaBean` – Actualizar remito de venta
* **Descripción:** Actualiza un remito de venta existente.
* **Cuerpo:** Objeto `RemitoVentaBean` completo.

#### DELETE `/remitoVentaBean/{id}` – Eliminar remito de venta
* **Descripción:** Elimina el remito de venta indicado.
* **Parámetros de ruta:** `id` (int32, requerido).

---

### Ajuste de Stock (`ajusteStockBean`)

#### GET `/ajusteStockBean` – Obtener listado de ajustes de stock
* **Descripción:** Obtiene un listado de ajustes de stock.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `AjusteStockBean`.

#### POST `/ajusteStockBean` – Crear ajuste de stock
* **Descripción:** Crea un nuevo ajuste de stock.
* **Cuerpo:** Objeto `AjusteStockBean` con campos requeridos:
  - `descripcion` (string, requerido)
  - `externalId` (string, requerido)
  - `fecha` (date, requerido)
  - `nombre` (string, requerido)
  - `numeroDocumento` (string, requerido)
  - `ajusteStockItem` (array) - Items del ajuste con producto, cantidad, depósito

#### GET `/ajusteStockBean/{id}` – Obtener ajuste de stock
* **Descripción:** Devuelve un ajuste de stock específico.
* **Parámetros de ruta:** `id` (int64, requerido).

#### PUT `/ajusteStockBean/{id}` – Actualizar ajuste de stock
* **Descripción:** Actualiza un ajuste de stock existente.
* **Parámetros de ruta:** `id` (int64, requerido).

#### DELETE `/ajusteStockBean/{id}` – Eliminar ajuste de stock
* **Descripción:** Elimina el ajuste de stock indicado.
* **Parámetros de ruta:** `id` (int64, requerido).

---

### Asiento Contable Manual (`asientoContableManualBean`)

#### GET `/asientoContableManualBean` – Obtener listado de asientos contables manuales
* **Descripción:** Obtiene un listado de asientos contables manuales.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `AsientoContableManualBean`.

#### POST `/asientoContableManualBean` – Crear asiento contable manual
* **Descripción:** Crea un nuevo asiento contable manual.
* **Cuerpo:** Objeto `AsientoContableManualBean` con campos requeridos:
  - `descripcion` (string, requerido)
  - `externalId` (string, requerido)
  - `fecha` (date, requerido)
  - `nombre` (string, requerido)
  - `numeroDocumento` (string, requerido)
  - `tipoAsiento` (int64)
  - `asientoContableManualItem` (array) - Items con cuenta, debeHaber (1 = DEBE, -1 = HABER), importe

#### GET `/asientoContableManualBean/{id}` – Obtener asiento contable manual
* **Descripción:** Devuelve un asiento contable manual específico.
* **Parámetros de ruta:** `id` (int64, requerido).

#### PUT `/asientoContableManualBean/{id}` – Actualizar asiento contable manual
* **Descripción:** Actualiza un asiento contable manual existente.
* **Parámetros de ruta:** `id` (int64, requerido).

#### DELETE `/asientoContableManualBean/{id}` – Eliminar asiento contable manual
* **Descripción:** Elimina el asiento contable manual indicado.
* **Parámetros de ruta:** `id` (int64, requerido).

---

## Recursos adicionales de configuración

### Proveedor (`ProveedorBean`)

#### GET `/ProveedorBean` – Obtener proveedores
* **Descripción:** Obtiene un array de proveedores.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `numeroIdentificacion` (string, opcional) | string | Filtra por número de identificación. |
* **Respuesta:** Array de objetos `ProveedorBean` con campos similares a `ClienteBean`:
  - `proveedorid` (int64)
  - `nombre`, `primerApellido`, `segundoApellido`, `primerNombre`, `otrosNombres`
  - `razonSocial`, `nombreComercial`
  - `cuit`, `identificacionTributaria`, `categoriaFiscal`
  - `provincia`, `direccion`, `email`, `telefono`
  - `listaPrecioCompra` (objeto)
  - `esResidente` (boolean)
  - `esCliente` (int64)

#### POST `/ProveedorBean` – Crear proveedor
* **Descripción:** Crea un nuevo proveedor.
* **Cuerpo:** Objeto `ProveedorBean` completo.

#### GET `/ProveedorBean/{id}` – Obtener proveedor
* **Descripción:** Devuelve un proveedor específico.
* **Parámetros de ruta:** `id` (int64, requerido).

#### PUT `/ProveedorBean/{id}` – Actualizar proveedor
* **Descripción:** Actualiza un proveedor existente.
* **Parámetros de ruta:** `id` (int64, requerido).

#### DELETE `/ProveedorBean/{id}` – Eliminar proveedor
* **Descripción:** Elimina el proveedor indicado.
* **Parámetros de ruta:** `id` (int64, requerido).

---

### Producto de Compra (`ProductoCompraBean`)

#### GET `/ProductoCompraBean` – Obtener productos de compra
* **Descripción:** Obtiene un array de productos de compra.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `ProductoCompraBean` con campos:
  - `productoid` (int64)
  - `nombre` (string)
  - `codigo` (string)
  - `usrcode` (string)

---

### País (`paisBean`)

#### GET `/paisBean` – Obtener países
* **Descripción:** Obtiene un listado de todos los países.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `PaisBean` con campos `ID`, `nombre`, `codigo`, `id`.

---

### Provincia (`provinciaBean`)

#### GET `/provinciaBean` – Obtener provincias
* **Descripción:** Obtiene un listado de todas las provincias.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `ProvinciaBean` con campos:
  - `provincia_id` (int64)
  - `codigo` (string)
  - `nombre` (string)
  - `pais` (string)

---

### Percepción (`percepcionBean`)

#### GET `/percepcionBean` – Obtener percepciones
* **Descripción:** Obtiene una lista de percepciones.
* **Categorías disponibles:**
  - `10` = Ingresos Brutos
  - `3` = IVA
  - `8` = Impuestos Internos
  - `13` = Otros
  - `14` = Ganancias
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `categoriaId` (int32, opcional) | integer | ID de la categoría de percepción. |
  | `id` (int32, opcional) | integer | ID específico de la percepción. |
* **Respuesta:** Array de objetos `PercepcionBean` con campos:
  - `percepcionId` (int64)
  - `nombre` (string)
  - `descripcion` (string)
  - `categoria` (int64)
  - `jurisdiccion` (int64)
  - `cuentaVentas` (int64)
  - `cuentaCompras` (int64)

---

### Retención (`retencionBean`)

#### GET `/retencionBean` – Obtener retenciones
* **Descripción:** Obtiene una lista de retenciones.
* **Categorías disponibles:**
  - `4` = Ganancias
  - `5` = Ingresos Brutos
  - `9` = Retenciones Bancarias
  - `6` = IVA
  - `7` = Seguridad Social
  - `12` = Otros
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `categoriaid` (int32, opcional) | integer | ID de la categoría de retención. |
  | `retencionid` (int32, opcional) | integer | ID específico de la retención. |
* **Respuesta:** Array de objetos `RetencionBean` con campos:
  - `retencionId` (int64)
  - `nombre` (string)
  - `descripcion` (string)
  - `categoria` (int32)
  - `cuentaidventa` (int32)
  - `cuentaidcompra` (int32)
  - `codigoRegimen` (string)
  - `codigoImpuesto` (string)
  - `porcentaje` (number)
  - `importefijo` (number)
  - `importedesde` (number)
  - `importehasta` (number)

---

### Tasa Impositiva (`tasaImpositiva`)

#### GET `/tasaImpositiva` – Obtener tasas impositivas
* **Descripción:** Obtiene todos los tipos de tasas impositivas.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `tasaDefault` (int32, opcional) | integer | `0` = todas menos la default; `1` = solo la default; vacío = todas las tasas. |
* **Respuesta:** Array de objetos `TasaImpositivaBean` con campos:
  - `ID` (int64)
  - `codigo` (string)
  - `nombre` (string)
  - `tasaDefault` (int32)
  - `porcentaje` (number)

---

### Unidad de Medida (`unidadMedida`)

#### GET `/unidadMedida` – Obtener unidades de medida
* **Descripción:** Obtiene un array de unidades de medida.
* **Parámetros:** Ninguno.
* **Respuesta:** Array de objetos `UnidadMedidaBean` con campos:
  - `ID` (int64)
  - `codigo` (string)
  - `nombre` (string)

---

### Transporte (`transporteBean`)

#### GET `/transporteBean` – Obtener transportes
* **Descripción:** Obtiene una lista de transportes.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `transporteid` (int64, opcional) | integer | ID específico del transporte. |
  | `activo` (int32, opcional) | integer | `1` = activo, `0` = inactivo. |
* **Respuesta:** Array de objetos `TransporteBean` con campos:
  - `transporteId` (int64)
  - `nombre` (string)
  - `responsable` (string)
  - `cuit` (string)
  - `direccion` (string)
  - `observaciones` (string)
  - `activo` (int32)

#### POST `/transporteBean` – Crear transporte
* **Descripción:** Crea un nuevo transporte.
* **Cuerpo:** Objeto `TransporteBean` completo.

#### PUT `/transporteBean` – Actualizar transporte
* **Descripción:** Actualiza un transporte existente.
* **Cuerpo:** Objeto `TransporteBean` completo.

#### DELETE `/transporteBean/{id}` – Eliminar transporte
* **Descripción:** Elimina el transporte indicado.
* **Parámetros de ruta:** `id` (int32, requerido).

---

### Sucursal de Cliente (`sucursalClienteBean`)

#### GET `/sucursalClienteBean` – Obtener sucursales
* **Descripción:** Obtiene una lista de sucursales de clientes.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `clienteid` (int64, opcional) | integer | ID del cliente para filtrar. |
  | `sucursalid` (int64, opcional) | integer | ID específico de la sucursal. |
* **Respuesta:** Array de objetos `SucursalBean` con campos:
  - `sucursalId` (int64)
  - `clienteId` (int64)
  - `nombre` (string)
  - `domicilio` (string)
  - `descripcion` (string)
  - `provinciaId` (int64)
  - `localidadId` (int64)

#### POST `/sucursalClienteBean` – Crear sucursal
* **Descripción:** Crea una nueva sucursal de cliente.
* **Cuerpo:** Objeto `SucursalBean` completo.

#### PUT `/sucursalClienteBean` – Actualizar sucursal
* **Descripción:** Actualiza una sucursal existente.
* **Cuerpo:** Objeto `SucursalBean` completo.

#### DELETE `/sucursalClienteBean/{id}` – Eliminar sucursal
* **Descripción:** Elimina la sucursal indicada.
* **Parámetros de ruta:** `id` (int32, requerido).

---

### Talonario (`talonario`)

#### GET `/talonario` – Obtener talonarios
* **Descripción:** Obtiene una lista de talonarios.
* **Parámetros de consulta (requeridos):**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `puntoDeVenta` (string, **requerido**) | string | Punto de venta (ej: "0001", "0002"). |
  | `letraComprobante` (string, opcional) | string | Letra del comprobante (A, B, C, etc.). |
  | `tipoComprobante` (string, opcional) | string | Tipo de comprobante (ej: "Facturas de Venta A", "Facturas de Venta B"). |
* **Respuesta:** Array de objetos `TalonarioBean` con campos:
  - `tipoComprobante` (string)
  - `letraComprobante` (string)
  - `ultimoUtilizado` (string)

---

### Talonario de Cobranza (`talonarioCobranza`)

#### GET `/talonarioCobranza` – Obtener talonarios de cobranza
* **Descripción:** Obtiene una lista de los últimos números del talonario utilizado en las cobranzas.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `letraComprobante` (string, opcional) | string | Letra del comprobante (A, B, C, etc.). |
  | `puntoDeVenta` (string, opcional) | string | Punto de venta (ej: "0001", "0002"). |
  | `ultimoSugeridoUtilizado` (int32, opcional) | integer | `0` o `1` (default: 0). |
* **Respuesta:** Array de objetos `TalonarioBean`.

---

### Relación Factura Nota de Crédito (`relacionFacturaNotaDeCredito`)

#### GET `/relacionFacturaNotaDeCredito` – Obtener relaciones
* **Descripción:** Obtiene un listado de todas las relaciones entre facturas y notas de crédito.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `clienteId` (int64, **requerido**) | integer | ID del cliente. |
  | `factura` (int64, opcional) | integer | ID de la factura específica. |
  | `notadecredito` (int64, opcional) | integer | ID de la nota de crédito específica. |
* **Respuesta:** Array de objetos `RelacionFacturaNotaDeCreditoBean` con campos:
  - `idFactura` (int64)
  - `fechaFactura` (string)
  - `numeroFactura` (string)
  - `idNotaDeCredito` (int64)
  - `fechaNotaDeCredito` (string)
  - `numeroNotaDeCredito` (string)

---

## Utilidades adicionales

### Enviar Transacción por Mail (`enviarTransaccionPorMail`)

#### POST `/enviarTransaccionPorMail` – Enviar transacción por correo
* **Descripción:** Envía una transacción (factura, comprobante, etc.) por correo electrónico.
* **Cuerpo:** Objeto `EnviarTransaccionPorMailBean` con campos:
  - `transaccionId` (int64) - ID de la transacción a enviar
  - `destinatarios` (string) - Direcciones de correo destinatarias (separadas por coma)
  - `copiaCon` (string) - Direcciones en copia
  - `copiaConOtro` (string) - Direcciones en copia oculta
  - `asunto` (string) - Asunto del correo
  - `cuerpo` (string) - Cuerpo del mensaje
* **Respuesta:** Objeto `EnviarTransaccionPorMailBean` con los datos enviados.

---

### Solicitar CAE (`solicitarCAE`)

#### POST `/solicitarCAE` – Solicitar CAE para factura
* **Descripción:** Solicita el CAE (Código de Autorización Electrónico) para una factura de venta.
* **Cuerpo:** Objeto `SolicitarCAEBean` con campos:
  - `externalId` (string) - ID externo de la transacción
  - `transaccionId` (int64) - ID de la transacción
  - `CAE` (string) - Código de autorización electrónico (se completa en la respuesta)
  - `CAEFechaVto` (date-time) - Fecha de vencimiento del CAE (se completa en la respuesta)
  - `detalle` (string) - Detalle de la respuesta
  - `cae` (string) - Alias del campo CAE
  - `caefechaVto` (date-time) - Alias del campo CAEFechaVto
* **Respuesta:** Objeto `SolicitarCAEBean` con el CAE asignado y fecha de vencimiento.

---

## Completar información de recursos existentes

### Vendedor (`vendedorBean`) - Información completa

#### POST `/vendedorBean` – Crear vendedor
* **Descripción:** Crea un nuevo vendedor.
* **Cuerpo:** Objeto `VendedorBean` completo con campos:
  - `vendedorId` (int64)
  - `nombre` (string)
  - `apellido` (string)
  - `esVendedor` (int32)
  - `activo` (int32)

#### PUT `/vendedorBean` – Actualizar vendedor
* **Descripción:** Actualiza un vendedor existente.
* **Cuerpo:** Objeto `VendedorBean` completo.

#### DELETE `/vendedorBean/{id}` – Eliminar vendedor
* **Descripción:** Elimina el vendedor indicado.
* **Parámetros de ruta:** `id` (int32, requerido).

**Nota:** El GET `/vendedorBean` también acepta parámetros adicionales:
  - `vendedorid` (int64, opcional) - ID específico del vendedor
  - `nombre` (string, opcional) - Filtro por nombre
  - `apellido` (string, opcional) - Filtro por apellido
  - `activo` (int32, opcional) - Filtro por estado activo

---

### Punto de Venta (`puntoVentaBean`) - Información completa

**Estructura completa del objeto `PuntoVentaBean`:**
- `puntoVentaId` (int64)
- `nombre` (string)
- `codigo` (string)
- `puntoVenta` (string) - Código del punto de venta (ej: "0001")
- `modoNumeracion` (string) - "automatico" o "editablesugerido"
- `circuitoContable` (objeto CircuitoContableBeanSelect)
- `activo` (int64) - 0 = No Activo, 1 = Activo
- `factElectronicaConXB` (int64) - Si factura electrónica con Xubio

---

## Otros recursos

La API incluye muchos más recursos que siguen patrones similares:

* **GET** sin parámetros o con filtros simples (`activo`, `id`, `fechaDesde`, `fechaHasta`, etc.) para obtener listados.
* **GET** con `/{id}` para recuperar un elemento específico.
* **POST** para crear un nuevo registro, donde el cuerpo de la solicitud reproduce el objeto devuelto por el GET (con campos como `ID`, `nombre`, `codigo`, etc.).
* **PUT** para modificar un elemento existente (requiere el `id` en la ruta y un cuerpo con la entidad a actualizar).
* **PATCH** para actualizaciones parciales (solo actualiza los campos enviados) - disponible en algunos recursos como `ProductoVentaBean` y `listaPrecioBean`.
* **DELETE** para eliminar un elemento.

Esta documentación cubre los recursos principales y más utilizados de la API. Para detalles específicos de modelos o recursos no documentados aquí, consulte la documentación oficial en `https://xubio.com/API/documentation/index.html` o el swagger.json en `https://xubio.com/API/1.1/swagger.json`.

---

## 🔍 Hallazgos del Swagger JSON (Actualización)

**Fuente**: `https://xubio.com/API/1.1/swagger.json` (documentación técnica oficial)

### Productos de Venta (`ProductoVentaBean`)

#### GET `/ProductoVentaBean` – Obtener productos de venta
* **Descripción:** Obtiene un array de productos de venta. El parámetro opcional `activo` acepta `1 = true` y `0 = false`.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `id` (int64, opcional) | ID del producto específico |
  | `nombre` (string, opcional) | Filtro por nombre |
  | `usrcode` (string, opcional) | Código de usuario |
  | `categoriaProducto` (int32, opcional) | ID de categoría |
  | `tasaIVAProducto` (int32, opcional) | ID de tasa IVA |
  | `activo` (int32, opcional) | `1` = activo, `0` = inactivo |
* **Headers opcionales:**
  | Nombre | Descripción |
  |-------|-------------|
  | `minimalVersion` (boolean) | Versión minimalista del endpoint |
* **Respuesta:** Array de objetos `ProductoVentaBean` con campos como `productoid`, `nombre`, `codigo`, `usrcode`, `codigoBarra`, `unidadMedida`, `categoria`, `tasaIva`, `activo`, etc.

**⚠️ IMPORTANTE - Precios de Productos:**
- Los productos **NO incluyen precios** en su respuesta directa.
- Los precios se obtienen desde las **listas de precios** (`listaPrecioBean`).
- Para obtener el precio de un producto, se debe:
  1. Obtener la lista de precios deseada: `GET /listaPrecioBean/{id}`
  2. Buscar el producto en el array `listaPrecioItem` de la lista de precios
  3. El campo `productoid` del producto debe coincidir con `producto.id` o `producto.ID` en `listaPrecioItem`
- **Campo ID del producto:** Según Swagger, el campo correcto es `productoid` (no `id` directamente, aunque puede venir como `id` o `ID` también).

#### POST `/ProductoVentaBean` – Crear producto de venta
* **Descripción:** Crea un nuevo producto de venta.
* **Cuerpo:** Objeto `ProductoVentaBean` completo.

#### PUT `/ProductoVentaBean/{id}` – Actualizar producto (todos los campos)
* **Descripción:** Actualiza un producto existente. Exige todos los campos.

#### PATCH `/ProductoVentaBean/{id}` – Actualizar producto (parcial)
* **Descripción:** Actualiza un producto existente. Solo actualiza los campos enviados.

#### DELETE `/ProductoVentaBean/{id}` – Eliminar producto
* **Descripción:** Elimina un producto de venta.

---

### Lista de Precios (`listaPrecioBean`)

#### GET `/listaPrecioBean` – Obtener listas de precios
* **Descripción:** Obtiene un array de listas de precios.
* **Parámetros de consulta:**
  | Nombre | Tipo | Descripción |
  |-------|------|-------------|
  | `tipo` (int64, opcional) | `1` = Venta, `2` = Compra |
  | `activo` (int64, opcional) | `1` = Activo, `0` = Inactivo |
* **Respuesta:** Array de objetos `ListaPrecioBean` con:
  - `listaPrecioID` (int64)
  - `nombre` (string)
  - `descripcion` (string)
  - `activo` (boolean)
  - `esDefault` (boolean)
  - `moneda` (objeto MonedaBean)
  - `tipo` (int32) - 1 = Venta, 2 = Compra
  - `iva` (number)
  - `listaPrecioItem` (array) - Array de items con precios

#### GET `/listaPrecioBean/{id}` – Obtener lista de precios específica
* **Descripción:** Devuelve una lista de precios con todos sus items (productos y precios). **Este es el endpoint necesario para obtener precios de productos.**
* **Parámetros de ruta:** `id` (int64, requerido)
* **Respuesta:** Objeto `ListaPrecioBean` completo con `listaPrecioItem` que contiene:
  ```json
  {
    "listaPrecioItem": [
      {
        "listaPrecioID": 123,
        "producto": { "ID": 456, "id": 456, "productoid": 456, "nombre": "...", "codigo": "..." },
        "precio": 100.50,
        "codigo": "COD001",
        "referencia": 1
      }
    ]
  }
  ```

**💡 Flujo recomendado para obtener productos con precios:**
1. Obtener productos: `GET /ProductoVentaBean?activo=1`
2. Obtener lista de precios: `GET /listaPrecioBean` (buscar la lista deseada, ej: "AGDP")
3. Obtener detalles de la lista: `GET /listaPrecioBean/{id}` (obtiene `listaPrecioItem` con precios)
4. Enriquecer productos: Para cada producto, buscar su precio en `listaPrecioItem` comparando `producto.productoid` con `listaPrecioItem[].producto.id` (o `producto.ID` o `producto.productoid`)

**Nota sobre IDs:** El campo `productoid` del `ProductoVentaBean` debe coincidir con `producto.id`, `producto.ID` o `producto.productoid` dentro de `listaPrecioItem`.

#### POST `/listaPrecioBean` – Crear lista de precios
* **Descripción:** Crea una nueva lista de precios.

#### PUT `/listaPrecioBean/{id}` – Actualizar lista (todos los campos)
* **Descripción:** Actualiza una lista de precios. Exige todos los campos.

#### PATCH `/listaPrecioBean/{id}` – Actualizar lista (parcial)
* **Descripción:** Actualiza una lista de precios. Solo actualiza los campos enviados.

#### DELETE `/listaPrecioBean/{id}` – Eliminar lista de precios
* **Descripción:** Elimina una lista de precios.

---

### Estructura de `ComprobanteVentaBean` - Campos Requeridos

#### Campo: `transaccionProductoItems` (NO `detalleComprobantes`)

**⚠️ IMPORTANTE:** El campo correcto es `transaccionProductoItems`, NO `detalleComprobantes`.

**Estructura completa según Swagger:**

```json
{
  "transaccionProductoItems": [
    {
      "transaccionCVItemId": 0,  // Opcional (int64)
      "transaccionId": 0,         // Opcional (int64)
      "producto": {               // REQUERIDO
        "ID": 123,
        "id": 123,
        "nombre": "Producto ejemplo",
        "codigo": "PROD001"
      },
      "centroDeCosto": {          // REQUERIDO
        "ID": 1,
        "id": 1,
        "nombre": "Centro de Costo",
        "codigo": "CC001"
      },
      "deposito": {               // Opcional
        "ID": 1,
        "id": 1,
        "nombre": "Depósito",
        "codigo": "DEP001"
      },
      "descripcion": "Descripción del producto",  // REQUERIDO (string)
      "cantidad": 10.0,           // REQUERIDO (number)
      "precio": 333.33,           // REQUERIDO (number) - Precio con IVA incluido
      "iva": 57.78,               // REQUERIDO (number)
      "importe": 3333.30,         // REQUERIDO (number) - cantidad * precio
      "total": 3333.30,           // REQUERIDO (number)
      "montoExento": 0,          // REQUERIDO (number)
      "porcentajeDescuento": 0,  // REQUERIDO (number)
      "precioconivaincluido": 333.33  // Opcional (number)
    }
  ]
}
```

**Campos Requeridos:**
- ✅ `producto` (objeto) - Producto asociado
- ✅ `centroDeCosto` (objeto) - Centro de costo (requerido)
- ✅ `descripcion` (string) - Descripción del item
- ✅ `cantidad` (number) - Cantidad del producto
- ✅ `precio` (number) - Precio unitario (con IVA incluido según documentación)
- ✅ `iva` (number) - Monto de IVA
- ✅ `importe` (number) - Importe total (cantidad × precio)
- ✅ `total` (number) - Total del item
- ✅ `montoExento` (number) - Monto exento de impuestos
- ✅ `porcentajeDescuento` (number) - Porcentaje de descuento

**Campos Opcionales:**
- `deposito` (objeto) - Depósito asociado
- `transaccionCVItemId` (int64) - ID del item de transacción
- `transaccionId` (int64) - ID de la transacción
- `precioconivaincluido` (number) - Precio con IVA incluido

**Notas importantes:**
- El precio debe indicarse **con IVA incluido** según la documentación del Swagger.
- El campo `centroDeCosto` es **REQUERIDO** y debe tener al menos `ID` e `id`.
- Todos los campos numéricos deben ser números válidos (no strings).
- El cálculo de IVA puede variar según si el precio incluye o no IVA.

---

### Otros campos requeridos en `ComprobanteVentaBean`

Según el Swagger, los siguientes campos son **REQUERIDOS** al crear un comprobante de venta:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cantComprobantesCancelados`` | int64 | Cantidad de comprobantes cancelados |
| `cantComprobantesEmitidos` | int64 | Cantidad de comprobantes emitidos |
| `cbuinformada` | boolean | Si se informó CBU |
| `cliente` | objeto | Cliente (requerido) |
| `condicionDePago` | int32 | 1 = Cuenta Corriente, 2 = Contado |
| `cotizacion` | number | Cotización de moneda |
| `cotizacionListaDePrecio` | number | Cotización de lista de precios |
| `deposito` | objeto | Depósito |
| `descripcion` | string | Descripción |
| `externalId` | string | ID externo |
| `facturaNoExportacion` | boolean | Si es factura de no exportación |
| `fecha` | date | Fecha del comprobante |
| `fechaVto` | date | Fecha de vencimiento |
| `listaDePrecio` | objeto | Lista de precios |
| `mailEstado` | string | Estado del mail |
| `nombre` | string | Nombre del comprobante |
| `numeroDocumento` | string | Número de documento |
| `porcentajeComision` | number | Porcentaje de comisión |
| `provincia` | objeto | Provincia |
| `puntoVenta` | objeto | Punto de venta |
| `tipo` | int32 | 1 = Factura, 2 = Nota de Débito, 3 = Nota de Crédito, 4 = Informe Z, 6 = Recibo |
| `transaccionCobranzaItems` | array | Items de cobranza |
| `transaccionPercepcionItems` | array | Items de percepción |
| `transaccionProductoItems` | array | Items de productos (requerido) |
| `vendedor` | objeto | Vendedor |

**Campos opcionales importantes:**
- `moneda` (objeto) - Moneda (requerido si `utilizaMonedaExtranjera = 1`)
- `utilizaMonedaExtranjera` (int) - 1 = usa moneda extranjera
- `circuitoContable` (objeto) - Circuito contable
- `comprobante` (int64) - ID del comprobante
- `comprobanteAsociado` (int64) - ID del comprobante asociado
- `fechaDesde` (date-time) - Fecha desde del período de servicios
- `fechaHasta` (date-time) - Fecha hasta del período de servicios
- `tienePeriodoServicio` (boolean) - Si tiene período de servicio
- `fechaFacturacionServicioDesde` (date-time) - Fecha desde de facturación de servicios
- `fechaFacturacionServicioHasta` (date-time) - Fecha hasta de facturación de servicios
- `CAE` (string) - Código de Autorización Electrónico
- `primerTktA`, `ultimoTktA`, `primerTktBC`, `ultimoTktBC` (string) - Campos para Informe Z (no necesarios para facturas/notas)

> ⚠️ **IMPORTANTE - Campo `observacion` en ComprobanteVentaBean:**
> 
> El campo `observacion` **NO está documentado** en el swagger.json oficial de Xubio para `ComprobanteVentaBean`. 
> Esto fue verificado consultando directamente `https://xubio.com/API/1.1/swagger.json` (fecha: Diciembre 2024).
> 
> **Comparativa con otros recursos:**
> | Recurso | ¿Tiene `observacion`? |
> |---------|----------------------|
> | `ComprobanteVentaBean` | ❌ No documentado |
> | `CobranzaBean` | ✅ Sí documentado |
> | `PagoBean` | ✅ Sí documentado |
> | `RemitoVentaBean` | ✅ Sí documentado |
> 
> **Alternativa recomendada:** Usar el campo `descripcion` (string) que SÍ está oficialmente documentado.
> 
> **Nota:** La aplicación actual envía `observacion` y Xubio podría aceptarlo aunque no esté documentado. 
> Se recomienda verificar empíricamente si las observaciones aparecen en el PDF generado.

---

## Notas finales

### Fuentes de información

Esta documentación ha sido completada y actualizada con información detallada extraída de:
- **Documentación interactiva oficial**: `https://xubio.com/API/documentation/index.html`
- **Swagger JSON oficial**: `https://xubio.com/API/1.1/swagger.json`

### Recursos documentados

La documentación ahora incluye información completa de más de **40 recursos** de la API, incluyendo:
- Recursos principales de negocio (clientes, comprobantes, presupuestos, cobranzas, pagos, etc.)
- Recursos de compra (comprobantes de compra, órdenes de compra, productos de compra)
- Recursos de configuración y maestros (bancos, categorías, circuitos, cuentas, etc.)
- Recursos adicionales (remitos, ajustes de stock, asientos contables, transportes, etc.)
- Utilidades (imprimir PDF, enviar por mail, solicitar CAE, etc.)

### Convenciones importantes

1. **Campos requeridos**: Los campos marcados como "requerido" son obligatorios según el swagger.json. Si falta alguno, la API devolverá un error.

2. **Tipos de datos**: 
   - `int32` / `int64` = números enteros
   - `number` = números decimales
   - `string` = cadenas de texto
   - `date` / `date-time` = fechas (formato ISO 8601 recomendado)

3. **Objetos anidados**: Muchos recursos requieren objetos anidados (ej: `cliente`, `producto`, `centroDeCosto`). Estos objetos deben tener al menos los campos `ID` e `id` (y opcionalmente `nombre` y `codigo`).

4. **Paginación**: Algunos endpoints soportan paginación mediante headers `minimalVersion`, `lastTransactionID` y `limit`.

5. **Actualizaciones parciales**: Algunos recursos soportan `PATCH` para actualizaciones parciales (solo actualiza los campos enviados), mientras que `PUT` requiere todos los campos.

### Mantenimiento

Esta documentación debe actualizarse periódicamente consultando el swagger.json oficial para asegurar que refleja los cambios más recientes de la API de Xubio.