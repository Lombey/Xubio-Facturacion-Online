# Guía: Integración de Logger para Testing de APIs

**Objetivo**: Ver claramente qué se envía y qué se recibe en cada llamada a la API de Xubio.

---

## 🎯 Por Qué Esto Ayuda

Cuando estás mapeando endpoints de una API, necesitas ver:
- ✅ **Qué se envía**: Payload exacto, headers, query params
- ✅ **Qué se recibe**: Response completo, status codes, estructura de datos
- ✅ **Errores claros**: Qué falló y por qué

El sistema de logging estructurado te permite ver todo esto de forma clara y organizada.

---

## 📦 Módulos Disponibles

### 1. `utils/logger.js` - Logger General
Para logging general de la aplicación.

### 2. `utils/api-logger.js` - Logger Especializado para APIs ⭐
Para logging específico de llamadas a API (recomendado para tu caso).

---

## 🚀 Ejemplos Prácticos

### Ejemplo 1: Llamada Simple a API

**ANTES** (difícil de ver qué se envía/recibe):
```javascript
async obtenerPDF(transaccionId, tipoimpresion) {
  try {
    const resultado = await this.requestXubio('/imprimirPDF', 'GET', null, {
      idtransaccion: transId,
      tipoimpresion: tipo
    });
    
    console.log('Resultado:', resultado); // ❌ Poco claro
  } catch (error) {
    console.error('Error:', error); // ❌ Sin contexto
  }
}
```

**DESPUÉS** (claro y estructurado):
```javascript
import { apiLogger } from './utils/api-logger.js';

async obtenerPDF(transaccionId, tipoimpresion) {
  const queryParams = {
    idtransaccion: transId,
    tipoimpresion: tipo
  };
  
  try {
    // Log del request
    apiLogger.request('GET', '/imprimirPDF', null, {}, queryParams);
    
    const resultado = await this.requestXubio('/imprimirPDF', 'GET', null, queryParams);
    
    // Log del response
    const status = resultado.response?.status || 200;
    apiLogger.response('GET', '/imprimirPDF', resultado.data, status);
    
    return resultado;
  } catch (error) {
    // Log del error
    apiLogger.error('GET', '/imprimirPDF', error, null, error.response?.status);
    throw error;
  }
}
```

**Resultado en consola**:
```
📤 API Request: GET /imprimirPDF
  [DEBUG] Method: { method: 'GET' }
  [DEBUG] Endpoint: { endpoint: '/imprimirPDF' }
  [DEBUG] Query Params: { idtransaccion: 123, tipoimpresion: 1 }
  
📥 API Response: GET /imprimirPDF
  [INFO] Status: 200 ✅
  [DEBUG] Response Body: { urlPdf: '...', nombrexml: '...' }
  [TABLE] Response Summary:
    urlPdf    | https://...
    nombrexml | factura_123.xml
```

---

### Ejemplo 2: Crear Factura (POST con Payload)

**ANTES**:
```javascript
async crearFactura(facturaData) {
  try {
    const response = await this.requestXubio('/ComprobanteVenta', 'POST', facturaData);
    console.log('Factura creada:', response); // ❌ No se ve el payload enviado
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**DESPUÉS**:
```javascript
import { apiLogger } from './utils/api-logger.js';

async crearFactura(facturaData) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.accessToken}`
  };
  
  try {
    // Log del request con payload completo
    apiLogger.request('POST', '/ComprobanteVenta', facturaData, headers);
    
    const response = await this.requestXubio('/ComprobanteVenta', 'POST', facturaData);
    
    // Log del response
    const status = response.response?.status || 200;
    apiLogger.response('POST', '/ComprobanteVenta', response.data, status);
    
    return response;
  } catch (error) {
    // Log del error con el payload que falló
    apiLogger.error('POST', '/ComprobanteVenta', error, facturaData, error.response?.status);
    throw error;
  }
}
```

**Resultado en consola**:
```
📤 API Request: POST /ComprobanteVenta
  [DEBUG] Method: { method: 'POST' }
  [DEBUG] Endpoint: { endpoint: '/ComprobanteVenta' }
  [DEBUG] Headers: { Authorization: 'Bearer eyJhbGc...' }
  [DEBUG] Payload: { clienteId: '123', productos: [...], ... }
  [TABLE] Payload Structure:
    clienteId  | 123
    productos  | Array[2]
    moneda      | USD
    
📥 API Response: POST /ComprobanteVenta
  [INFO] Status: 201 ✅
  [DEBUG] Response Body: { transaccionId: 456, ... }
  [TABLE] Response Summary:
    transaccionId | 456
    status        | created
```

---

### Ejemplo 3: Usar `apiLogger.wrap()` (Más Simple)

Para llamadas simples, puedes usar el método `wrap()` que hace todo automáticamente:

```javascript
import { apiLogger } from './utils/api-logger.js';

async obtenerPDF(transaccionId, tipoimpresion) {
  const queryParams = {
    idtransaccion: transId,
    tipoimpresion: tipo
  };
  
  // wrap() loggea automáticamente request, response y errores
  return await apiLogger.wrap(
    'GET',
    '/imprimirPDF',
    () => this.requestXubio('/imprimirPDF', 'GET', null, queryParams),
    null, // payload (null en este caso)
    {} // headers
  );
}
```

---

## 🔧 Integración en app.js

### Paso 1: Importar el logger

Al inicio de `app.js`, después de los otros imports:

```javascript
// Importar logger para APIs
import { apiLogger } from './utils/api-logger.js';
```

### Paso 2: Agregar logging en métodos clave

**Métodos prioritarios para agregar logging**:

1. `obtenerToken()` - Ver autenticación
2. `requestXubio()` - Ver todas las llamadas
3. `obtenerPDF()` - Ver obtención de PDFs
4. `flujoCompletoFactura()` - Ver creación de facturas
5. `flujoCompletoCobranza()` - Ver creación de cobranzas
6. `listarFacturasUltimoMes()` - Ver listados

### Paso 3: Ejemplo de integración en `obtenerPDF()`

```javascript
async obtenerPDF(transaccionId = null, tipoimpresion = null, seccion = 'pdf') {
  // ... validaciones existentes ...
  
  const queryParams = {
    idtransaccion: transId,
    tipoimpresion: tipo
  };
  
  try {
    // Log del request
    apiLogger.request('GET', '/imprimirPDF', null, {}, queryParams);
    
    let response, data;
    if (this.apiClient) {
      const resultado = await this.apiClient.obtenerPDF(transId.toString(), tipo.toString());
      response = resultado.response;
      data = resultado.data;
    } else {
      const resultado = await this.requestXubio('/imprimirPDF', 'GET', null, queryParams);
      response = resultado.response;
      data = resultado.data;
    }
    
    // Log del response
    apiLogger.response('GET', '/imprimirPDF', data, response?.status || 200);
    
    // ... resto del código existente ...
  } catch (error) {
    apiLogger.error('GET', '/imprimirPDF', error, null, error.response?.status);
    this.handleError(error, 'Obtención de PDF', resultKey);
  }
}
```

---

## 📊 Beneficios para Mapeo de Endpoints

Con este sistema de logging podrás:

1. **Documentar endpoints automáticamente**:
   - Ver exactamente qué estructura de payload acepta cada endpoint
   - Ver qué estructura de respuesta devuelve
   - Comparar diferentes llamadas fácilmente

2. **Debuggear problemas rápido**:
   - Ver si el problema está en el request o en el response
   - Ver qué campos faltan o están mal formateados
   - Ver errores de la API con contexto completo

3. **Compartir con la IA**:
   - Los logs estructurados son fáciles de analizar
   - La IA puede entender qué se envía/recibe
   - Facilita el mapeo automático de endpoints

---

## 🎯 Próximos Pasos

1. **Integrar logger en `requestXubio()`** (método central):
   - Todas las llamadas quedarán loggeadas automáticamente
   - Un solo lugar para modificar

2. **Agregar logging específico en métodos críticos**:
   - `obtenerToken()`
   - `flujoCompletoFactura()`
   - `flujoCompletoCobranza()`

3. **Probar un endpoint**:
   - Ver los logs en la consola
   - Verificar que se ve claramente request/response

---

**¿Quieres que integre el logger en algún método específico ahora?** 🚀
