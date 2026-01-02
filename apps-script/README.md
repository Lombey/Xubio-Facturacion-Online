# Xubio Facturación - Apps Script

Sistema de facturación automática para integrar con AppSheet usando OAuth.

---

## 📋 Instalación

### **Paso 1: Crear nuevo proyecto Apps Script**

1. Abrí: https://script.google.com
2. Click en **"Nuevo proyecto"**
3. Nombralo: `Xubio Facturación`

### **Paso 2: Copiar el código**

1. Borrá todo el código por defecto
2. Copiá TODO el contenido de `XubioFacturacion.js`
3. Pegalo en el editor
4. Guardá (Ctrl+S)

### **Paso 3: Configurar credenciales OAuth de Xubio**

**IMPORTANTE:** Este script usa OAuth en lugar de cookies de sesión, lo que lo hace más estable y seguro.

Las credenciales ya están configuradas en el código:
- `XUBIO_CLIENT_ID`: Cliente ID de tu cuenta Xubio
- `XUBIO_CLIENT_SECRET`: Secret de autenticación

**Si necesitás cambiar las credenciales:**
1. En el Apps Script, buscá las líneas:
   ```javascript
   const XUBIO_CLIENT_ID = '...';
   const XUBIO_CLIENT_SECRET = '...';
   ```
2. Reemplazá con tus credenciales de Xubio
3. Guardá (Ctrl+S)

---

## 🧪 Test Simple

### **Ejecutar test:**

1. En el Apps Script, seleccioná la función: **`testCrearFactura`**
2. Click en ▶️ **Ejecutar**
3. Autorizá permisos si te lo pide
4. Mirá el **Log** (Ctrl+Enter)

**Si funciona verás:**
```
🧪 Iniciando test de creación de factura...
🔑 Obteniendo nuevo token OAuth de Xubio...
✅ Token OAuth obtenido y cacheado
💱 Cotización USD: $1455
📤 Enviando factura a Xubio REST API...
🔍 DEBUG - Payload:
{
  "circuitoContable": { "ID": 1 },
  "comprobante": 1,
  "tipo": 1,
  ...
}
📥 Response Code: 200
📥 Response: { "transaccionId": "67750488", ... }
✅ Factura creada exitosamente

✅ ¡TEST EXITOSO!
================
TransaccionID: 67750488
Número: A-00004-00001680
Total: USD $592.9
Cotización: $1455
```

**Si falla:**
- ❌ Error 401: Credenciales OAuth inválidas → Verificar CLIENT_ID y CLIENT_SECRET
- ❌ Error 400/500: Problema con payload JSON → Revisar logs del payload
- ❌ No se encuentra TransaccionID: Revisar response JSON en logs

---

## 🔌 Integración con AppSheet

### **Paso 1: Publicar como Web App**

1. En Apps Script, click en **"Implementar"** → **"Nueva implementación"**
2. Tipo: **Aplicación web**
3. Configuración:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona** (si querés usar desde AppSheet)
4. Click en **Implementar**
5. **Copiá la URL** del Web App

### **Paso 2: Crear Webhook en AppSheet**

1. Abrí tu app en AppSheet
2. Andá a **"Automation"** → **"Bots"**
3. Creá nuevo Bot:
   - Name: `Crear Factura Xubio`
   - Event: **Data change** (cuando agregás/modificás cliente)
   - Condition: Cuando el campo "Facturar" = TRUE (por ejemplo)
4. Action: **Call a webhook**
   - URL: Pegá la URL del Web App de Apps Script
   - HTTP Method: **POST**
   - Body:
     ```json
     {
       "clienteId": <<[Cliente ID]>>,
       "clienteNombre": <<[Nombre]>>,
       "provinciaId": <<[Provincia ID]>>,
       "provinciaNombre": <<[Provincia]>>,
       "localidadId": <<[Localidad ID]>>,
       "localidadNombre": <<[Localidad]>>,
       "cantidad": 1
     }
     ```

### **Paso 3: Agregar campos a tu planilla**

En tu Sheet de clientes, agregá estas columnas si no las tenés:
- `Provincia ID` (número: 1 = Buenos Aires, etc.)
- `Provincia` (texto: Buenos Aires)
- `Localidad ID` (número: 147 = Saladillo, etc.)
- `Localidad` (texto: Saladillo)
- `Facturar` (checkbox: TRUE/FALSE)

---

## 📊 Variables del Template

### **Datos FIJOS (ya configurados):**
- ✅ Empresa: corvusweb srl (ID: 234054)
- ✅ Punto Venta: 212819
- ✅ Talonario: 11290129 (modo Editable-Sugerido)
- ✅ Producto: CONECTIVIDAD ANUAL POR TOLVA (ID: 2751338)
- ✅ Precio: USD 490
- ✅ IVA: 21%
- ✅ Moneda: Dólares
- ✅ Descripción bancaria
- ✅ Endpoint: `/API/1.1/comprobanteVentaBean` (REST API con JSON)
- ✅ Condición de pago: Contado (ID: 2)

### **Datos VARIABLES (desde AppSheet/Sheets):**
- Cliente ID, Nombre
- Provincia ID, Nombre
- Localidad ID, Nombre
- Cantidad (default: 1)
- Cotización USD (se obtiene automáticamente de BCRA)

---

## 🔐 Autenticación OAuth (Automática)

**Ventajas del nuevo sistema OAuth:**
- ✅ **Tokens cacheados**: El token se guarda por 1 hora, evitando requests innecesarios
- ✅ **Auto-renovación**: Si el token expira, se renueva automáticamente
- ✅ **Sin intervención manual**: No necesitás renovar cookies del navegador
- ✅ **Más estable**: No depende de la sesión del navegador

**¿Cómo funciona?**
1. Primera llamada: Script solicita token OAuth usando CLIENT_ID + CLIENT_SECRET
2. Token se cachea en PropertiesService (válido por 1 hora)
3. Próximas llamadas: Se reutiliza el token cacheado
4. Si token expira (error 401): Se invalida cache y obtiene token nuevo automáticamente

**No necesitás hacer nada**, el script maneja todo automáticamente.

---

## 📝 Próximos Pasos

1. ✅ Test simple funciona con OAuth
2. ⏳ Obtener IDs de Provincia/Localidad de tus clientes
3. ⏳ Agregar columnas a tu planilla de clientes
4. ⏳ Configurar webhook en AppSheet
5. ⏳ Crear Sheet de "Facturas" para guardar histórico

---

## 🐛 Troubleshooting

**Error: "ReferenceError: CONFIG_EMPRESA is not defined"**
→ Copiaste mal el código. Copiá TODO el archivo completo.

**Error: "Error de autenticación OAuth: 401"**
→ Credenciales OAuth inválidas. Verificar `XUBIO_CLIENT_ID` y `XUBIO_CLIENT_SECRET`.

**Error: "No se encontró TransaccionID"**
→ La factura no se creó en Xubio. Revisar payload JSON en logs.

**Error: "Error HTTP 400: Bad Request"**
→ Payload incorrecto. Posibles causas:
  - cliente.id, provinciaId, localidadId inválidos
  - Campos required faltantes (revisar swagger schema)
  - Valores fuera de rango (ej: condicionDePago debe ser 1 o 2)

**Error: "Error HTTP 401: Este recurso sólo admite..."**
→ Problema con punto de venta o talonario. Verificar:
  - Campo `talonario.ID` debe estar presente
  - Punto de venta debe ser "Editable-Sugerido"

**Error: "Error HTTP 500: Internal Server Error"**
→ Error en servidor de Xubio. Revisar logs completos del request/response.

**No aparece nada en el Log**
→ Ejecutá `View` → `Logs` o presiona Ctrl+Enter

---

## 🔍 Debug y Logs

El script incluye logging detallado para facilitar debugging:

```javascript
Logger.log('🔑 Obteniendo nuevo token OAuth de Xubio...');
Logger.log('📤 Enviando factura a Xubio REST API...');
Logger.log('🔍 DEBUG - Payload:');
Logger.log(JSON.stringify(payload, null, 2));
Logger.log('📥 Response Code: ' + responseCode);
Logger.log('📥 Response: ' + responseText);
```

**Para ver logs detallados:**
1. En Apps Script, ejecutá la función
2. Presiona Ctrl+Enter o andá a `View` → `Logs`
3. Vas a ver el payload JSON completo y la respuesta de Xubio

---

## 📞 Soporte

Si tenés problemas:
1. Revisá el **Log** completo (Ctrl+Enter)
2. Verificá que las credenciales OAuth estén correctas
3. Probá primero `testCrearFactura()` antes de integrar con AppSheet
4. Revisá que los IDs de cliente, provincia y localidad sean válidos en Xubio

---

## 🆕 Changelog

### Versión 2.1.0-swagger (31/12/2025)
- ✅ Endpoint cambiado a `/API/1.1/comprobanteVentaBean` (más robusto)
- ✅ Payload completo validado contra swagger.json (ComprobanteVentaBean schema)
- ✅ Agregados TODOS los campos required del schema:
  - `cantComprobantesCancelados`, `cantComprobantesEmitidos`
  - `cbuinformada`, `cotizacionListaDePrecio`
  - `externalId`, `facturaNoExportacion`, `mailEstado`
  - `nombre`, `numeroDocumento`, `porcentajeComision`
  - `transaccionCobranzaItems`, `transaccionPercepcionItems`
- ✅ Corrección: `observacion` → `descripcion` (campo correcto)
- ✅ Corrección: `condicionDePago: 7` → `condicionDePago: 2` (Contado, valor válido)
- ✅ Agregado campo `talonario` para punto de venta Editable-Sugerido

### Versión 2.0.0-oauth (31/12/2025)
- ✅ Migración completa a OAuth (elimina dependencia de cookies de sesión)
- ✅ Usa endpoint REST API con JSON (en lugar de XML Legacy)
- ✅ Token OAuth cacheado con auto-renovación
- ✅ Manejo automático de errores 401 con retry
- ✅ Logs detallados del request/response JSON
- ✅ Payload simplificado y validado contra documentación oficial

### Versión 1.0.0 (31/12/2025)
- ❌ Versión legacy con cookies y XML (descartada)

---

*Última actualización: 31/12/2025*
