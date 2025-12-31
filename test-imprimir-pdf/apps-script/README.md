# Xubio Facturación - Apps Script

Sistema de facturación automática para integrar con AppSheet.

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

### **Paso 3: Configurar cookies de Xubio**

1. Abrí https://xubio.com en tu navegador
2. Iniciá sesión normalmente
3. Abrí DevTools (F12) → **Console**
4. Ejecutá:
   ```javascript
   copy(document.cookie)
   ```
5. En el Apps Script, buscá la sección `XUBIO_COOKIES`
6. Pegá las cookies entre las comillas
7. Guardá

**Ejemplo:**
```javascript
const XUBIO_COOKIES = `
SessionId=MARTIN.LOMBARDI@GMAIL.COM1767215834397786563446#TNT_142596;
AWSALB=V1ilkZGiw1MJBI70veQ+IVVF1/A1d8fKIx7fPNgEMDeKNg4W3KDkwpMdMniy3JiGcV5ycdXyWidtOfltF15CiPzG+w8uWvdTswyvxlBNxje5OYWLQjX83nuCKE6R27GMmmoWhbT/YYDD6hwIP3nAkFr8gUll2NqxugVBCPdRX5OIJ+Ktyml9dVVdPKF4wA==;
AWSALBCORS=V1ilkZGiw1MJBI70veQ+IVVF1/A1d8fKIx7fPNgEMDeKNg4W3KDkwpMdMniy3JiGcV5ycdXyWidtOfltF15CiPzG+w8uWvdTswyvxlBNxje5OYWLQjX83nuCKE6R27GMmmoWhbT/YYDD6hwIP3nAkFr8gUll2NqxugVBCPdRX5OIJ+Ktyml9dVVdPKF4wA==
`.trim();
```

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
📤 Enviando factura a Xubio...
💱 Cotización USD: $1455
📥 Response Code: 200
✅ Factura creada exitosamente

✅ ¡TEST EXITOSO!
================
TransaccionID: 67750488
Número: A-00004-00001680
Total: USD $592.9
Cotización: $1455
```

**Si falla:**
- ❌ Error 401: Cookies expiradas → Renovar cookies
- ❌ Error 500: Problema con XML → Revisar logs
- ❌ No se encuentra TransaccionID: Revisar response XML

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
- ✅ Producto: CONECTIVIDAD ANUAL POR TOLVA (ID: 2751338)
- ✅ Precio: USD 490
- ✅ IVA: 21%
- ✅ Moneda: Dólares
- ✅ Descripción bancaria

### **Datos VARIABLES (desde AppSheet/Sheets):**
- Cliente ID, Nombre
- Provincia ID, Nombre
- Localidad ID, Nombre
- Cantidad (default: 1)
- Cotización USD (se obtiene automáticamente de BCRA)

---

## 🔄 Renovar Cookies

Las cookies de sesión expiran. Cuando el script empiece a dar error 401:

1. Volvé a iniciar sesión en xubio.com
2. Obtené nuevas cookies con `copy(document.cookie)`
3. Actualizá `XUBIO_COOKIES` en el Apps Script
4. Guardá

**Frecuencia recomendada:** Renovar cada vez que cierres el navegador o cada 24hs.

---

## 📝 Próximos Pasos

1. ✅ Test simple funciona
2. ⏳ Obtener IDs de Provincia/Localidad de tus clientes
3. ⏳ Agregar columnas a tu planilla de clientes
4. ⏳ Configurar webhook en AppSheet
5. ⏳ Crear Sheet de "Facturas" para guardar histórico

---

## 🐛 Troubleshooting

**Error: "ReferenceError: CONFIG_EMPRESA is not defined"**
→ Copiaste mal el código. Copiá TODO el archivo completo.

**Error: "Unauthorized (401)"**
→ Cookies expiradas. Renovar.

**Error: "No se encontró TransaccionID"**
→ La factura no se creó en Xubio. Revisar XML en logs.

**No aparece nada en el Log**
→ Ejecutá `View` → `Logs` o presiona Ctrl+Enter

---

## 📞 Soporte

Si tenés problemas:
1. Revisá el **Log** completo (Ctrl+Enter)
2. Verificá que las cookies estén actualizadas
3. Probá primero `testCrearFactura()` antes de integrar con AppSheet

---

*Última actualización: 31/12/2025*
