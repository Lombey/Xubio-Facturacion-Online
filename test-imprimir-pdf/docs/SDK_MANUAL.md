# Manual de Integración SDK Xubio (AppSheet / Apps Script)

Este documento describe cómo utilizar el SDK JavaScript puro generado en este laboratorio para integrar Xubio con **Google AppSheet** (vía Google Apps Script) o cualquier entorno **Node.js**.

---

## 📦 Estructura del SDK

El SDK se compone de 4 archivos esenciales ubicados en `/sdk`. Estos archivos son **JavaScript Puro (ES6)** y no dependen de ninguna librería externa (ni Vue, ni NPM), por lo que son portables.

| Archivo | Responsabilidad |
|---------|-----------------|
| `xubioClient.js` | Maneja la autenticación (Token), Peticiones HTTP y Errores. |
| `facturaService.js` | Construye el JSON complejo requerido para crear Facturas. |
| `cobranzaService.js` | Construye el JSON complejo para crear Cobranzas. |
| `mapperService.js` | Utilidades para limpiar CUITs, buscar clientes y validar datos. |

---

## 🚀 Migración a Google Apps Script (.gs)

Google Apps Script utiliza JavaScript, pero con algunas diferencias en cómo se realizan las peticiones HTTP (`UrlFetchApp` en lugar de `fetch`).

### Paso 1: Adaptar `xubioClient.js`

Al copiar `xubioClient.js` a un archivo `.gs`, debes reemplazar la función `fetch` por `UrlFetchApp.fetch`.

**Ejemplo de Adaptación:**

```javascript
// En Apps Script (código .gs)

function requestXubio(endpoint, method, payload, token) {
  var url = BASE_URL + endpoint;
  
  var options = {
    'method': method,
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + token
    },
    'muteHttpExceptions': true
  };
  
  if (payload) {
    options.payload = JSON.stringify(payload);
  }
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() >= 400) {
    throw new Error('Error Xubio: ' + (json.message || json.error));
  }
  
  return json;
}
```

### Paso 2: Copiar Lógica de Negocio (`facturaService.js`)

Los archivos `FacturaService` y `CobranzaService` contienen lógica pura de transformación de objetos. Puedes copiar su contenido casi textualmente, eliminando las palabras clave `export class` y convirtiéndolos en funciones globales si lo prefieres.

**Ejemplo de uso en Apps Script:**

```javascript
function crearFacturaDesdeAppSheet(clienteId, items, puntoVentaId) {
  // 1. Obtener Token (Implementar caché con PropertiesService)
  var token = obtenerTokenXubio(); 
  
  // 2. Construir Payload usando la lógica de FacturaService
  // (Aquí copias la lógica de buildPayload)
  var payload = {
    cliente: { cliente_id: clienteId },
    puntoVenta: { ID: puntoVentaId, editable: true, sugerido: true },
    transaccionProductoItems: items.map(function(item) {
       return {
         // ... mapeo igual al SDK ...
       };
    })
    // ... resto del payload ...
  };
  
  // 3. Enviar
  var respuesta = requestXubio('/comprobanteVentaBean', 'POST', payload, token);
  
  return respuesta.transaccionId;
}
```

---

## 🛠️ Ejemplos de Flujos

### A. Crear una Factura

```javascript
// 1. Inicializar Cliente
const client = new XubioClient({ clientId: '...', secretId: '...' });

// 2. Preparar Datos (Inputs de AppSheet)
const datosFactura = {
    clienteId: 12345,
    puntoVenta: { ID: 1, editable: true, sugerido: true }, // Obtenido de configuración
    items: [
        { cantidad: 2, precio: 1500, producto: { ID: 99, nombre: 'Servicio' } }
    ],
    condicionPago: 1 // Cuenta Corriente
};

// 3. Construir Payload (La magia del SDK)
const payload = FacturaService.buildPayload(datosFactura);

// 4. Enviar
const resultado = await client.request('/comprobanteVentaBean', 'POST', payload);
console.log('Factura creada:', resultado.transaccionId);
```

### B. Crear una Cobranza

```javascript
// 1. Obtener factura original para heredar datos
const factura = await client.request('/comprobanteVentaBean/1001', 'GET');

// 2. Construir Payload
const payloadCobranza = CobranzaService.buildPayload({
    clienteId: factura.cliente.id,
    facturaRef: factura,
    importe: 3000
});

// 3. Enviar
const resultado = await client.request('/cobranzaBean', 'POST', payloadCobranza);
```

---

## 🚨 Puntos Críticos (Pinpoints)

El laboratorio ha revelado los siguientes requisitos estrictos de la API:

1.  **Punto de Venta**: Debe tener `editable: true` y `sugerido: true`. Si envías solo el ID, fallará silenciosamente o con error genérico.
2.  **Moneda**: Si es Dólares, debes enviar el objeto moneda completo Y el flag `utilizaMonedaExtranjera: 1`.
3.  **Provincia**: El cliente DEBE tener una provincia asignada, o la factura fallará.
4.  **Fechas**: Formato estricto `YYYY-MM-DD`.

---

## 📥 Próximos Pasos

1.  Copia el contenido de `/sdk/*.js` a tu proyecto de Apps Script.
2.  Adapta `xubioClient.js` para usar `UrlFetchApp` y `PropertiesService` (para guardar el token).
3.  Usa `FacturaService.js` tal cual está para generar tus JSONs.
