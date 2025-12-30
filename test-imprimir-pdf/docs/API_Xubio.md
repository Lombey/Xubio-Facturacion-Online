# Documentación de la API Xubio

A continuación se resume la información obtenida de la documentación oficial de la API de Xubio (sitio `https://xubio.com/API/documentation/index.html`). Para cada recurso se indican las operaciones disponibles, la ruta del servicio, el método HTTP, los parámetros (nombre y descripción) y un resumen del objeto de respuesta/solicitud. **No se incluye información de sitios externos; todo se extrajo de la página de documentación**.

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
* **Cuerpo:** Objeto presupuesto. Contiene los campos de un presupuesto de venta:
  - `circuitoContable` (objeto con `ID`, `nombre`, `codigo`)
  - `comprobante` y `comprobanteAsociado` (enteros)
  - `transaccionId`, `externalId`
  - `cliente` (objeto con `ID`, `nombre`, `codigo`)
  - `nombre`, `fecha`, `fechaVto`
  - `puntoVenta` (objeto) y demás campos.
  El ejemplo de cuerpo muestra estos campos.

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
* **Descripción:** Cambia el estado de un presupuesto. La documentación lista valores de estado (por ejemplo, -3: Pendiente de aprobar, -2: Aprobado, -7: Rechazado, -5: Facturado, -4: Remitido).
* **Parámetros de ruta:** `id` (int64, requerido) – ID de la transacción a mover de estado.
* **Cuerpo:** Objeto que representa el nuevo estado; incluye `ID`, `nombre`, `codigo` e `id`.
* **Respuesta:** Operación exitosa.

---

### Comprobante de Venta (`comprobanteVentaBean`)

#### GET `/comprobanteVentaBean` – Obtener comprobantes de venta
* **Descripción:** Retorna una lista de comprobantes (facturas/Notas de crédito) emitidos. Se pueden filtrar por fecha y paginar.
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `fechaDesde` (date-time, opcional) | Fecha inicial. |
  | `fechaHasta` (date-time, opcional) | Fecha final. |
* **Encabezados opcionales:**
  | Nombre | Descripción |
  |-------|-------------|
  | `minimalVersion` (boolean) | Si se envía `true` devuelve versión resumida. |
  | `lastTransactionID` (int64) | Utilizado para paginar registros. |
  | `limit` (int) | Número máximo de registros a devolver. |
* **Respuesta:** Cada comprobante contiene datos del circuito contable, tipo de comprobante, comprobantes asociados, período de servicios (`fechaDesdeServicios` y `fechaHastaServicios`), CAE, `transaccionId`, `externalId`, cliente, detalle de líneas (`detalleComprobantes`), moneda, cotización, total, etc.

#### POST `/comprobanteVentaBean` – Crear comprobante de venta
* **Descripción:** Crea una factura o nota de crédito/débito de venta.
* **Cuerpo:** Objeto comprobante de venta con muchos campos:
  - `circuitoContable`, `comprobante` y `comprobanteAsociado`
  - Fechas de servicio (`fechaDesdeServicios`, `fechaHastaServicios`), CAE
  - `transaccionId`, `externalId`
  - `cliente`
  - Detalle de comprobantes (`detalleComprobantes`): lista de ítems con cantidad, precio, IVA, etc.
  - Moneda (`moneda`), cotización, total, etc.
* **Respuesta:** Devuelve el comprobante creado.

#### GET `/comprobanteVentaBean/{id}` – Obtener comprobante de venta
* **Descripción:** Devuelve un comprobante específico por id.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Objeto comprobante con los mismos campos que en el POST.

#### PUT `/comprobanteVentaBean/{id}` – Actualizar comprobante
* **Descripción:** Actualiza un comprobante existente.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Cuerpo:** Objeto comprobante de venta (formato igual al de creación).
* **Respuesta:** Comprobante actualizado.

#### DELETE `/comprobanteVentaBean/{id}` – Eliminar comprobante
* **Descripción:** Elimina el comprobante indicado.
* **Parámetros de ruta:** `id` (int64, requerido).
* **Respuesta:** Operación exitosa.

---

### Cobranza (`cobranzaBean`)

#### GET `/cobranzaBean` – Obtener cobranzas
* **Descripción:** Obtiene un listado de cobranzas (recibos). Se pueden filtrar por fecha.
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `fechaDesde` (date-time) | Fecha inicial del filtro. |
  | `fechaHasta` (date-time) | Fecha final del filtro. |
* **Respuesta:** Una lista de objetos cobranza. Cada cobranza contiene `cuentaTipo`, `cuenta`, `moneda`, `cliente`, `fecha`, `numeroRecibo`, `cotizacion`, `detalleCobranzas` (líneas con montos y comprobantes), etc.

#### POST `/cobranzaBean` – Crear cobranza
* **Descripción:** Crea una nueva cobranza.
* **Cuerpo:** Objeto cobranza con campos:
  - `circuitoContable` (objeto)
  - `cliente` (objeto)
  - `fecha`, `numeroRecibo`
  - `monedaCtaCte` y `cotizacion`
  - `utilizaMonedaExtranjera`
  - `mediosDePago` (lista de medios)
  - `detalleCobranzas` (lista con comprobantes asociados y montos).
* **Respuesta:** Devuelve la cobranza creada.

#### PUT `/cobranzaBean` – Actualizar cobranza
* **Descripción:** Actualiza una cobranza. El cuerpo es el mismo objeto Cobranza que en la creación.

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
  * `fechaDesde` (string, *query*): Fecha de inicio. Soporta formatos `DD/MM/AAAA`, `DD-MM-AAAA` o `AAAA-MM-DD`.
  * `fechaHasta` (string, *query*): Fecha límite, con los mismos formatos.
* **Respuesta (ejemplo):** La respuesta es un objeto con numerosos campos:
  * `transaccionid`: Identificador de la transacción.
  * `circuitoContable`: Objeto con `ID`, `nombre` y `codigo`.
  * `proveedor`: Objeto con datos del proveedor (`ID`, `nombre`, `codigo` y `id`).
  * `fecha`, `numeroRecibo`, `cotizacion`, `utilizaMonedaExtranjera` y `observacion`.
  * `transaccionInstrumentoDePago`: Arreglo con instrumentos de pago asociados.

#### POST `/pagoBean` – Crear nueva orden de pago
* **Descripción:** Crea una orden de pago. La documentación señala un cuerpo (body) con estructura similar a la de la respuesta del GET: incluye `circuitoContable`, `proveedor`, `fecha`, `numeroRecibo`, `cotizacion`, `utilizaMonedaExtranjera`, `observacion` y una lista de `transaccionInstrumentoDePago` con detalles del medio de pago. (La UI no desplegó completamente el ejemplo, pero se deduce a partir del modelo de respuesta).

---

### Facturar (`facturar`)

#### POST `/facturar` – Generar factura
* **Descripción:** Genera una factura de venta. Es similar a la operación POST de `comprobanteVentaBean` pero orientada a la acción de facturar.
* **Cuerpo:** Objeto comprobante de venta con campos `circuitoContable`, `comprobante`, `comprobanteAsociado`, fechas de servicios, CAE, `transaccionId`, `externalId`, `cliente`, `detalleComprobantes`, moneda, cotización, total, etc.
* **Respuesta:** Devuelve el comprobante facturado.

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
* **Parámetros de consulta:**
  | Nombre | Descripción |
  |-------|-------------|
  | `idtransaccion` (int64, requerido) | ID de la transacción cuyo PDF se desea descargar. |
  | `tipoimpresion` (int32, requerido) | Tipo de impresión, no detallado en la documentación. |
* **Respuesta:** Objeto con `nombrexml`, `datasource` y `urlPdf` (URL para descargar el archivo).

---

## Otros recursos

La API incluye muchos más recursos (por ejemplo `listaPrecio`, `pais`, `percepcion`, `productoCompra`, `productoVenta`, `proveedor`, `provincia`, `puntoDeVenta`, etc.). Cada uno de estos recursos sigue patrones similares:

* **GET** sin parámetros o con filtros simples (`activo`, `id`, `fechaDesde`, `fechaHasta`, etc.) para obtener listados.
* **GET** con `/{id}` para recuperar un elemento específico.
* **POST** para crear un nuevo registro, donde el cuerpo de la solicitud reproduce el objeto devuelto por el GET (con campos como `ID`, `nombre`, `codigo`, etc.).
* **PUT** para modificar un elemento existente (requiere el `id` en la ruta y un cuerpo con la entidad a actualizar).
* **DELETE** para eliminar un elemento.

Dado que la documentación completa es extensa y repetitiva, este archivo se centra en los recursos explorados directamente. Consulte la documentación oficial para más detalles sobre cada modelo o recurso específico.
