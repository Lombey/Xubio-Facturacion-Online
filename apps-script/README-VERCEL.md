# Xubio Facturación vía Vercel - Guía Completa

Sistema de facturación automática usando Vercel Serverless Functions con Playwright.

---

## 🏗️ Arquitectura

```
AppSheet/Sheets
    ↓ (POST /exec)
Apps Script (Webhook)
    ↓ (POST /api/crear-factura)
Vercel Serverless Function
    ↓ (Playwright)
Login a Xubio con Browser
    ↓ (Cookies de sesión)
POST XML a /NXV/DF_submit
    ↓
Factura creada en Xubio ✅
```

**Ventajas vs OAuth directo:**
- ✅ Usa login real del navegador (más robusto)
- ✅ Obtiene cookies de sesión (mismo método que el navegador)
- ✅ Usa endpoint XML Legacy (el que funciona en producción)
- ✅ No depende de OAuth API (que puede tener limitaciones)
- ✅ Playwright maneja redirects y autenticación compleja

---

## 📋 Setup Completo

### **Paso 1: Configurar Vercel** ✅ (Ya hecho)

Tu proyecto ya está deployado en Vercel. Solo verificá:

1. **Variables de entorno en Vercel Dashboard:**
   - Andá a: https://vercel.com/tu-proyecto/settings/environment-variables
   - Verificá que tengas:
     - `XUBIO_USERNAME` = tu email de Xubio
     - `XUBIO_PASSWORD` = tu contraseña de Xubio

2. **Endpoints disponibles:**
   ```
   https://tu-proyecto.vercel.app/api/test-login      (POST)
   https://tu-proyecto.vercel.app/api/crear-factura   (POST)
   ```

### **Paso 2: Apps Script**

1. **Abrir Apps Script:**
   - Andá a: https://script.google.com
   - Click en **"Nuevo proyecto"**
   - Nombralo: `Xubio Facturación Vercel`

2. **Copiar código:**
   - Borrá el código por defecto
   - Copiá TODO el contenido de `XubioFacturacionVercel.js`
   - Pegalo en el editor
   - **IMPORTANTE:** Cambiá la línea 22:
     ```javascript
     const VERCEL_BASE_URL = 'https://tu-proyecto.vercel.app';
     ```
     Por tu URL real de Vercel

3. **Guardar:**
   - Ctrl+S o File → Save

### **Paso 3: Probar**

#### Test 1: Login (verificar credenciales)

1. En Apps Script, seleccioná función: `testLogin`
2. Click ▶️ **Ejecutar**
3. Autorizá permisos si te pide
4. Mirá el **Log** (Ctrl+Enter)

**Esperado:**
```
🧪 Iniciando test de login...
📥 Response Code: 200
📥 Response: {"success":true,"data":{"cookiesCount":5,"cookiesValid":true}}
✅ Login exitoso!
Cookies obtenidas: 5
Cookies válidas: true
```

**Si falla:**
- ❌ Error 500: Credenciales incorrectas en Vercel → Verificar variables de entorno
- ❌ Error 404: URL de Vercel incorrecta → Verificar VERCEL_BASE_URL

#### Test 2: Crear factura de prueba

1. **Editá la función `testCrearFactura()`** con datos reales:
   ```javascript
   const resultado = crearFacturaVercel({
     clienteId: 123456,           // ← CAMBIAR por ID real
     clienteNombre: 'Cliente Test',
     provinciaId: 1,               // 1 = Buenos Aires
     provinciaNombre: 'Buenos Aires',
     localidadId: 147,             // 147 = Saladillo
     localidadNombre: 'Saladillo',
     cantidad: 1
   });
   ```

2. Seleccioná función: `testCrearFactura`
3. Click ▶️ **Ejecutar**
4. Mirá el Log

**Esperado:**
```
🧪 Iniciando test de creación de factura...
📋 Iniciando creación de factura vía Vercel...
📤 Enviando a Vercel endpoint...
📥 Response Code: 200
✅ Factura creada exitosamente
TransaccionID: 67750488
Número: A-00004-00001680
Total: USD $592.9
PDF URL: https://xubio.com/NXV/transaccion/ver/67750488

✅ ¡TEST EXITOSO!
```

---

## 🔌 Integración con AppSheet

### **Paso 1: Publicar Apps Script como Web App**

1. En Apps Script, click **"Implementar"** → **"Nueva implementación"**
2. Tipo: **Aplicación web**
3. Configuración:
   - **Ejecutar como:** Yo (tu usuario)
   - **Quién tiene acceso:** Cualquier persona
4. Click **Implementar**
5. **Copiá la URL** que te da (ej: `https://script.google.com/macros/s/ABC123.../exec`)

### **Paso 2: Crear Webhook en AppSheet**

1. Abrí tu app en AppSheet
2. Andá a **"Automation"** → **"Bots"**
3. Click **"New Bot"**
4. Configuración:
   - **Name:** `Crear Factura Xubio`
   - **Event:** Data change (cuando se modifica/agrega fila)
   - **Table:** Tu tabla de clientes
   - **Condition:** `[Facturar] = TRUE` (o condición que prefieras)

5. **Add Task:** Call a webhook
   - **URL:** Pegá la URL del Apps Script Web App (del Paso 1)
   - **HTTP Method:** POST
   - **Body:**
     ```json
     {
       "clienteId": <<[Cliente ID]>>,
       "clienteNombre": <<[Nombre Cliente]>>,
       "provinciaId": <<[Provincia ID]>>,
       "provinciaNombre": <<[Provincia]>>,
       "localidadId": <<[Localidad ID]>>,
       "localidadNombre": <<[Localidad]>>,
       "cantidad": <<[Cantidad Tolvas]>>
     }
     ```

6. **Save** el Bot

### **Paso 3: Agregar columnas a tu planilla**

En tu Google Sheet de clientes, asegurate de tener:
- `Cliente ID` (número) → ID del cliente en Xubio
- `Nombre Cliente` (texto)
- `Provincia ID` (número) → 1 = Buenos Aires, 2 = CABA, etc.
- `Provincia` (texto)
- `Localidad ID` (número) → 147 = Saladillo, etc.
- `Localidad` (texto)
- `Cantidad Tolvas` (número, default: 1)
- `Facturar` (checkbox TRUE/FALSE) → trigger del webhook

---

## 🎯 Flujo Completo

1. **Usuario marca checkbox "Facturar" en AppSheet**
   ↓
2. **AppSheet webhook dispara el Bot**
   ↓
3. **Bot hace POST a Apps Script Web App** con datos del cliente
   ↓
4. **Apps Script hace POST a Vercel** (`/api/crear-factura`)
   ↓
5. **Vercel ejecuta Playwright:**
   - Abre Chromium headless
   - Navega a xubio.com
   - Hace login con credenciales
   - Obtiene cookies de sesión
   ↓
6. **Vercel construye XML de factura** con datos del cliente
   ↓
7. **Vercel hace POST a Xubio** (`/NXV/DF_submit`) con cookies
   ↓
8. **Xubio crea la factura y retorna TransaccionID**
   ↓
9. **Vercel retorna a Apps Script** JSON con datos de factura
   ↓
10. **Apps Script retorna a AppSheet** resultado
    ↓
11. **AppSheet puede guardar el resultado** en otra tabla (opcional)

---

## 📊 Datos de Factura

### **Datos FIJOS (configurados en Vercel):**
- ✅ Empresa: corvusweb srl
- ✅ Punto Venta: 212819
- ✅ Producto: CONECTIVIDAD ANUAL POR TOLVA
- ✅ Precio: USD $490
- ✅ IVA: 21%
- ✅ Moneda: Dólares
- ✅ Descripción bancaria: (CBU, alias, CUIT)

### **Datos VARIABLES (desde AppSheet):**
- Cliente ID, Nombre
- Provincia ID, Nombre
- Localidad ID, Nombre
- Cantidad (default: 1)

### **Datos AUTO-OBTENIDOS:**
- Cotización USD → Se obtiene automáticamente de API BCRA en tiempo real

---

## 🔍 Monitoreo y Debug

### **Ver logs de Vercel:**
1. Andá a: https://vercel.com/tu-proyecto/logs
2. Seleccioná función: `api/crear-factura.js`
3. Vas a ver:
   ```
   🔐 [FACTURA] Paso 1: Login con Playwright...
   💱 [FACTURA] Paso 2: Obtener cotización USD...
   🏗️ [FACTURA] Paso 3: Construir payload XML...
   📤 [FACTURA] Paso 4: Enviar a Xubio...
   📊 [FACTURA] Paso 5: Parsear respuesta...
   ✅ [FACTURA] Factura creada exitosamente
   ```

### **Ver logs de Apps Script:**
1. En Apps Script, presioná Ctrl+Enter
2. O andá a: View → Logs

---

## 🐛 Troubleshooting

**Error: "Missing credentials - XUBIO_USERNAME no configuradas"**
→ Falta configurar variables de entorno en Vercel Dashboard

**Error: "Login falló - No se redirigió a xubio.com"**
→ Credenciales incorrectas en Vercel

**Error: "Cannot read the array length because <local5> is null"**
→ Problema con el XML enviado a Xubio. Verificar datos de cliente/provincia/localidad

**Error: "No se encontró TransaccionID en respuesta"**
→ Xubio rechazó la factura. Ver logs de Vercel para más detalles

**Apps Script: "ReferenceError: VERCEL_BASE_URL is not defined"**
→ No copiaste todo el código. Copiá completo el archivo `XubioFacturacionVercel.js`

**AppSheet webhook timeout**
→ El proceso puede tardar 10-15 segundos (Playwright + login). Aumentar timeout del webhook a 30 segundos

---

## 🆚 Comparación: OAuth vs Vercel

| Feature | OAuth Directo (actual) | Vercel + Playwright (nuevo) |
|---------|------------------------|------------------------------|
| **Setup** | ✅ Simple | ⚠️ Requiere Vercel + Apps Script |
| **Autenticación** | OAuth tokens | Login real del navegador |
| **Endpoint Xubio** | REST API JSON | XML Legacy |
| **Robustez** | ⚠️ Puede fallar | ✅ Mismo método que navegador |
| **Mantenimiento** | ⚠️ Depende de OAuth API | ✅ Usa endpoint estable |
| **Latencia** | ✅ ~2 segundos | ⚠️ ~10-15 segundos (Playwright) |
| **Costo** | ✅ Gratis (Apps Script) | ✅ Gratis (Vercel Hobby) |

**Recomendación:**
- Si OAuth funciona bien → Mantenelo
- Si OAuth falla o tiene limitaciones → Usá Vercel

---

## 📞 Próximos Pasos

1. ✅ Vercel deployado
2. ⏳ Configurar variables de entorno en Vercel
3. ⏳ Probar `testLogin()` en Apps Script
4. ⏳ Probar `testCrearFactura()` con datos reales
5. ⏳ Publicar Apps Script como Web App
6. ⏳ Configurar webhook en AppSheet
7. ⏳ Probar flujo completo desde AppSheet

---

*Última actualización: 1/1/2026*
