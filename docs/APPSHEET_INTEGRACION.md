# Integración AppSheet - Facturación Automática Xubio

## Paso 1: Desplegar Web App en Google Apps Script

### 1.1 Abrir el Editor de Apps Script
1. Ir a Google Sheets: `Base de Datos Tolvas`
2. Menú: **Extensiones** → **Apps Script**
3. Verificar que el archivo `XubioDiscovery.js` esté actualizado con el código más reciente

### 1.2 Desplegar como Web App
1. En el editor de Apps Script, hacer clic en **Implementar** → **Nueva implementación**
2. Configurar:
   - **Tipo**: Seleccionar "Aplicación web"
   - **Descripción**: "Webhook Facturación Xubio"
   - **Ejecutar como**: **Yo** (tu cuenta de Google)
   - **Quién tiene acceso**: **Cualquier persona** (para que AppSheet pueda llamarlo)
3. Hacer clic en **Implementar**
4. **IMPORTANTE**: Copiar y guardar la **URL de la aplicación web**
   - Formato: `https://script.google.com/macros/s/AKfycby.../exec`
   - Esta URL es la que usarás en AppSheet

### 1.3 Test del Webhook (Opcional)
Desde Apps Script, ejecutar la función `testWebhook()` para verificar que todo funciona:
- Menú: **Ejecutar** → Seleccionar `testWebhook`
- Revisar logs: **Ver** → **Registros de ejecución**
- Debe mostrar: ✅ TEST EXITOSO con datos de factura creada

---

## Paso 2: Configurar AppSheet Action

### 2.1 Crear Columna Virtual para el Action (Opcional)
Si querés un botón visible en AppSheet:
1. En AppSheet, ir a **Data** → Seleccionar tabla "CONECTIVIDADES RPG0503"
2. Agregar columna virtual tipo "Action"
3. Nombre: "Facturar"

### 2.2 Crear el Action
1. En AppSheet, ir a **Behavior** → **Actions**
2. Hacer clic en **+ New Action**
3. Configurar:
   - **Name**: `Facturar en Xubio`
   - **For a record of this table**: `CONECTIVIDADES RPG0503`
   - **Do this**: Seleccionar "Execute a Webhook"
   - **Prominence**: `Display prominently` (para que aparezca como botón)

### 2.3 Configurar el Webhook
En la configuración del Action:

**URL:**
```
https://script.google.com/macros/s/AKfycby.../exec
```
(Usar la URL que copiaste en el Paso 1.2)

**HTTP Method:**
```
POST
```

**Body:**
```json
{
  "cuit": <<[CUIT]>>,
  "cantidad": <<[Equipos]>>,
  "idRef": <<[ID REF]>>
}
```

**Importante**: Usar los nombres exactos de las columnas de tu sheet:
- `[CUIT]` = Columna 4 de la sheet
- `[Equipos]` = Columna 8 de la sheet (cantidad)
- `[ID REF]` = Columna 20 de la sheet (identificador único)

**Content Type:**
```
application/json
```

### 2.4 Configurar Comportamiento del Action
- **Confirmation message**: `¿Crear factura para este cliente en Xubio?`
- **Success message**: `Factura creada exitosamente`
- **Failure message**: `Error al crear factura. Revisar logs.`

### 2.5 Guardar y Probar
1. Hacer clic en **Save**
2. Probar desde AppSheet:
   - Seleccionar un registro con CUIT válido
   - Hacer clic en el botón "Facturar en Xubio"
   - Debe crear la factura y actualizar automáticamente la columna "FACTURA 2026"

---

## Paso 3: Validaciones Previas

### 3.1 Verificar CUITs en Xubio
Antes de usar el Action, asegurar que:
- Todos los clientes de la sheet existen en Xubio (creados manualmente desde UI web)
- Los CUITs en la columna 4 coinciden exactamente con los de Xubio
- Formato esperado: `20-21767208-3` o `30-71614098-4`

### 3.2 Probar con Registro de Test
Recomendación: Probar primero con un registro que:
- Tenga CUIT válido existente en Xubio
- Tenga cantidad pequeña (ej: 1 o 2 equipos)
- No tenga factura generada previamente en columna FACTURA 2026

---

## Flujo Completo

```
Usuario en AppSheet
    ↓
Selecciona registro + clic "Facturar en Xubio"
    ↓
AppSheet envía POST a Apps Script Web App
    {
      "cuit": "30-71614098-4",
      "cantidad": 15,
      "idRef": "3"
    }
    ↓
Apps Script (XubioDiscovery.js - función doPost)
    ↓
1. Valida datos
2. Busca cliente por CUIT en Xubio
3. Llama a Vercel /api/crear-factura
    ↓
Vercel (api/crear-factura.js)
    ↓
1. Obtiene token OAuth de Xubio
2. Obtiene cotización USD de DolarAPI
3. Construye payload completo
4. Llama a Xubio REST API /facturar
    ↓
Xubio crea factura
    ↓
Retorna: { transaccionId, numeroDocumento, pdfUrl }
    ↓
Apps Script actualiza Google Sheets
    - Columna 13 (FACTURA 2026) = numeroDocumento
    ↓
AppSheet muestra mensaje de éxito
```

---

## Troubleshooting

### Error: "Cliente NO existe en Xubio"
- **Solución**: Crear cliente manualmente desde UI web de Xubio primero
- Xubio requiere que clientes pre-existan (no se crean on-the-fly)

### Error: "No se encontró registro con ID REF"
- **Solución**: Verificar que la columna "ID REF" tenga valores únicos
- Verificar que el ID REF enviado desde AppSheet coincide con la sheet

### Error HTTP 401 desde Xubio
- **Solución**: Token OAuth expirado
- Vercel auto-renueva tokens, pero verificar que CLIENT_ID y CLIENT_SECRET sean correctos

### Webhook no responde
- **Verificar**: URL de web app es correcta
- **Verificar**: Permisos de "Cualquier persona" en el deploy
- **Logs**: Revisar logs de Apps Script (Ver → Registros de ejecución)

---

## Campos del Payload

### Request a Apps Script (desde AppSheet)
```json
{
  "cuit": "30-71614098-4",      // Columna 4 - CUIT
  "cantidad": 15,                // Columna 8 - Equipos
  "idRef": "3"                   // Columna 20 - ID REF
}
```

### Response de Apps Script (a AppSheet)
```json
{
  "success": true,
  "data": {
    "transaccionId": 67768786,
    "numeroDocumento": "A-00004-00001682",
    "pdfUrl": "https://xubio.com/NXV/transaccion/ver/67768786"
  }
}
```

### Response de Error
```json
{
  "success": false,
  "error": "Cliente con CUIT 20-99999999-9 NO existe en Xubio"
}
```

---

## Notas Importantes

1. **Precio USD**: Hardcodeado en $50 por conectividad (línea 417 de XubioDiscovery.js)
2. **Cotización**: Se obtiene automáticamente de DolarAPI (valor vendedor oficial)
3. **Idempotencia**: El campo `externalId` (ID REF) previene facturas duplicadas
4. **Estado**: La columna ESTADO se cambia manualmente (no la toca el script)
5. **IDs Hardcodeados**: Producto, Punto de Venta, Centro de Costo, Lista de Precios (ver XUBIO_RECURSOS_ID.md)

---

## Próximos Pasos

Una vez funcionando:
- [ ] Sincronizar CUITs de la sheet con Xubio
- [ ] Validar que todos los clientes existen antes de facturar
- [ ] Considerar batch processing para facturar múltiples registros
- [ ] Agregar validación para evitar re-facturar (verificar columna FACTURA 2026 vacía)
