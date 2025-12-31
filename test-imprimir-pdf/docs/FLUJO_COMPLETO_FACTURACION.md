# Flujo Completo de Facturación con Xubio - DESCUBIERTO ✅

> **Estado**: ✅ VALIDADO Y FUNCIONANDO
> **Fecha**: 31 de Diciembre 2025
> **Método**: Ingeniería Inversa + Pruebas en Consola

---

## 🎯 Objetivo Cumplido

Descubrir y documentar el flujo exacto para crear facturas electrónicas en Xubio de forma programática, con el fin de replicar esta lógica en **Google Apps Script** para automatización desde **AppSheet**.

---

## 🔬 Hallazgo Principal: API REST vs Endpoint XML Legacy

### ❌ API REST (`/api/argentina/comprobanteVentaBean`) - NO FUNCIONA

**Problemas encontrados:**
- Requiere campo `comprobante` con ID existente
- Rechaza puntos de venta electrónicos con error: *"Este recurso sólo admite la creación de facturas con punto de venta editable-sugerido"*
- No hay garantía de que funcione para facturas electrónicas
- Documentación inexistente

### ✅ Endpoint XML Legacy (`/NXV/DF_submit`) - FUNCIONA PERFECTAMENTE

**Por qué funciona:**
- Es el mismo endpoint que usa la UI oficial de Xubio
- Acepta punto de venta electrónico (corvusweb srl - ID: 212819)
- Crea facturas que se envían automáticamente a AFIP
- Responde con status 200 OK (aunque el XML tenga errores de formato)

---

## 📋 Flujo Completo Descubierto

### **Paso 1: Crear Factura con Endpoint XML**

**Endpoint:**
```
POST https://xubio.com/NXV/DF_submit
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
```

**Autenticación:**
- Cookie-based (JSESSIONID, SessionId)
- NO usa Bearer token como la API REST

**Payload:**
- Formato XML embebido en body URL-encoded
- Ver `test-imprimir-pdf/sdk/xubioLegacyXml.js` líneas 116-117 para estructura completa

**Estructura del XML (simplificada):**
```xml
df>
  <config>
    <!-- Configuración de formulario y clase Java -->
  </config>
  <dataset>
    <data>
      <!-- Datos de la factura -->
      <EmpresaID type="C" id="234054" value="corvusweb srl"/>
      <OrganizacionID type="C" id="8157173" value="2MCAMPO"/>
      <PuntoVentaID type="C" id="212819" value="00004"/>
      <Fecha type="date" value="2025-12-31 00:00"/>
      <MonedaID type="C" id="-2" value="Pesos Argentinos"/>

      <!-- Items de productos -->
      <TransaccionCVItems type="D" count="1">
        <row>
          <ProductoID type="C" id="2851980" value="PRODUCTO"/>
          <Cantidad value="1"/>
          <Precio value="100"/>
          <Importe value="100.00"/>
          <ImporteImpuesto value="21.00"/>
          <ImporteTotal value="121.00"/>
          <porcentajetasaimpositiva value="21.00"/>
        </row>
      </TransaccionCVItems>

      <!-- Totales -->
      <M_ImporteGravado value="100" type="DEC"/>
      <M_ImporteImpuestos value="21.00" type="DEC"/>
      <M_ImporteTotal value="121.00" type="DEC"/>
    </data>
  </dataset>
</df>
```

**Campos Críticos Descubiertos:**

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `puntoVentaId` | `212819` | Punto de venta "corvusweb srl" (electrónico) |
| `puntoVentaNumero` | `"00004"` | Número del punto de venta |
| `empresaId` | `234054` | ID de la empresa |
| `factElectronicaConXB` | `1` | Indica factura electrónica |
| `modoNumeracion` | `"1"` | Modo de numeración del punto de venta |
| `condicionPago` | `1` = Cuenta Corriente, `2` = Contado | Forma de pago |

**Respuesta:**
```xml
<?xml version = '1.0' encoding = 'ISO-8859-1'?>
<error>
  <![CDATA[
    <b>Content is not allowed in prolog.</b><br/>
    <div id="button_acept">...</div>
  ]]>
</error>
```

**⚠️ IMPORTANTE:**
- Aunque la respuesta XML tiene errores de formato, la factura **SÍ se crea exitosamente**
- El status HTTP es 200 OK
- El TransaccionID **NO está en la respuesta XML**

---

### **Paso 2: Obtener TransaccionID**

Como la respuesta XML no contiene el TransaccionID, hay dos opciones:

#### **Opción A: Parsear la respuesta XML (NO FUNCIONA)**
```javascript
const match = responseXml.match(/TransaccionID[^>]*>(\d+)</i);
// ❌ No encuentra nada porque el XML está malformado
```

#### **Opción B: Buscar en el DOM de la página (FUNCIONA) ✅**

**Técnica:**
1. Esperar 3 segundos a que Xubio actualice la UI
2. Buscar en `document.body.innerHTML` el patrón:

```javascript
const matches = [...document.body.innerHTML.matchAll(
  /WebReportGridLayoutOnPreviewTransaccion\((\d+),\s*220,\s*'Factura de Venta N° (A-\d+-\d+)'/g
)];

// La última es la más reciente
const ultima = matches[matches.length - 1];
const transaccionId = parseInt(ultima[1], 10);      // Ej: 67750266
const numeroComprobante = ultima[2];                 // Ej: "A-00004-00001679"
```

**Ejemplo de match:**
```javascript
{
  transaccionId: 67750266,
  numeroComprobante: "A-00004-00001679"
}
```

---

### **Paso 3: Obtener Configuración de Reportes**

**Función de Xubio (disponible en el DOM):**
```javascript
const reportes = DINAMICFORM_ImprimirReportesGetReportes(220, false);
// Devuelve: "FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|,Ticket.jrxml|..."
```

**Parseo:**
```javascript
const lineas = reportes.split(',')[0];  // Primera configuración (Factura estándar)
const xml = reportes.split('|')[0];     // "FacturaVenta.jrxml"
const datasource = reportes.split('|')[1]; // "F_NXV_OP_0010"
```

**Resultado:**
```javascript
{
  xml: "FacturaVenta.jrxml",
  datasource: "F_NXV_OP_0010",
  lineas: "FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|"
}
```

---

### **Paso 4: Generar URL del PDF**

**Endpoint:**
```
GET https://xubio.com/NXV/general/includes/sr2.jsp
```

**Parámetros (Query String):**
```javascript
const params = new URLSearchParams({
  XMLFILE: "FacturaVenta.jrxml",
  DATASOURCE: "F_NXV_OP_0010",
  primaryKey: "0",
  masiveReportsParams: "FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|",
  listaIDs: "67750266"  // TransaccionID
});

const pdfUrl = `https://xubio.com/NXV/general/includes/sr2.jsp?${params}`;
```

**URL Completa:**
```
https://xubio.com/NXV/general/includes/sr2.jsp?XMLFILE=FacturaVenta.jrxml&DATASOURCE=F_NXV_OP_0010&primaryKey=0&masiveReportsParams=FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|&listaIDs=67750266
```

---

### **Paso 5: Abrir/Descargar PDF**

**En navegador:**
```javascript
window.open(pdfUrl, '_blank');
```

**En Google Apps Script:**
```javascript
const response = UrlFetchApp.fetch(pdfUrl, {
  headers: {
    'Cookie': `SessionId=${sessionId}; JSESSIONID=${jsessionId}`
  }
});

const pdfBlob = response.getBlob();
```

---

## 🔑 Datos de Configuración Validados

### **Punto de Venta (corvusweb srl - Electrónico)**
```javascript
{
  puntoVentaId: 212819,
  nombre: "corvusweb srl",
  puntoVentaNumero: "00004",
  modoNumeracion: "1",
  factElectronicaConXB: 1
}
```

### **Empresa**
```javascript
{
  empresaId: 234054,
  empresaNombre: "corvusweb srl"
}
```

### **Cliente de Prueba**
```javascript
{
  clienteId: 8157173,
  clienteNombre: "2MCAMPO"
}
```

### **Producto de Prueba**
```javascript
{
  id: 2851980,
  nombre: "ADICIONAL POR SERVICIO DE CONECTIVIDAD",
  precio: 1.00
}
```

### **IVA**
```javascript
{
  porcentaje: 21,
  calculo: precio * cantidad * 0.21
}
```

---

## 📦 Implementación Validada

### **Archivo: `test-imprimir-pdf/sdk/xubioLegacyXml.js`**

**Funciones Principales:**

#### 1. `crearFacturaXubio(params)`
Crea una factura usando el endpoint XML legacy.

**Parámetros:**
```javascript
{
  clienteId: number,           // Requerido
  clienteNombre: string,       // Requerido
  productos: Array<{           // Requerido
    id: number,
    nombre: string,
    cantidad: number,
    precio: number
  }>,
  puntoVentaId: number,        // Opcional (default: 212819)
  puntoVentaNumero: string,    // Opcional (default: "00004")
  empresaId: number,           // Opcional (default: 234054)
  empresaNombre: string,       // Opcional (default: "corvusweb srl")
  descripcion: string,         // Opcional
  condicionPago: number,       // Opcional (1=Cuenta Corriente, 2=Contado)
  fecha: string                // Opcional (YYYY-MM-DD, default: hoy)
}
```

**Retorna:**
```javascript
{
  success: boolean,
  response: string  // XML de respuesta
}
```

#### 2. `extraerTransaccionIDDelDOM()`
Busca el TransaccionID de la última factura en el HTML.

**Retorna:**
```javascript
{
  transaccionId: number,        // Ej: 67750266
  numeroComprobante: string     // Ej: "A-00004-00001679"
}
```

#### 3. `obtenerPdfUrl(transaccionId, subtipoId = 220)`
Genera la URL del PDF para una factura.

**Retorna:**
```javascript
string  // URL completa del PDF
```

#### 4. `crearFacturaConPDF(params)` ⭐ RECOMENDADA
Flujo completo automático: crea factura + obtiene PDF.

**Parámetros:**
```javascript
{
  ...params de crearFacturaXubio,
  abrirPdf: boolean,           // Opcional (default: true)
  esperarMs: number            // Opcional (default: 3000)
}
```

**Retorna:**
```javascript
{
  success: boolean,
  response: string,
  transaccionId: number,
  pdfUrl: string,
  numeroComprobante: string,
  mensaje: string
}
```

---

## 🚀 Uso desde Consola de Xubio (Validado)

### **Configuración Inicial:**
1. Abrir https://xubio.com
2. Iniciar sesión
3. Abrir DevTools (F12) → Consola
4. Copiar y pegar `test-imprimir-pdf/sdk/xubioLegacyXml.js`

### **Crear Factura con PDF Automático:**
```javascript
const resultado = await crearFacturaConPDF({
  clienteId: 8157173,
  clienteNombre: '2MCAMPO',
  productos: [
    {
      id: 2851980,
      nombre: 'ADICIONAL POR SERVICIO DE CONECTIVIDAD',
      cantidad: 1,
      precio: 100
    }
  ],
  descripcion: 'Factura de prueba'
});

console.log(resultado);
// {
//   success: true,
//   transaccionId: 67750266,
//   numeroComprobante: "A-00004-00001679",
//   pdfUrl: "https://xubio.com/NXV/general/includes/sr2.jsp?...",
//   mensaje: "✅ Factura A-00004-00001679 creada exitosamente"
// }
```

**El PDF se abre automáticamente en nueva pestaña.**

---

## 🔄 Adaptación para Google Apps Script

### **Desafíos:**

1. **Autenticación Cookie-based:**
   - Google Apps Script no maneja cookies automáticamente
   - Soluciones:
     - a) Obtener cookies de sesión manualmente (JSESSIONID, SessionId)
     - b) Implementar login programático
     - c) Usar cookies de una sesión activa (menos seguro)

2. **Función `DINAMICFORM_ImprimirReportesGetReportes()` no disponible:**
   - Solución: Hardcodear la configuración de reportes
   ```javascript
   const reportConfig = {
     xml: "FacturaVenta.jrxml",
     datasource: "F_NXV_OP_0010",
     lineas: "FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|"
   };
   ```

3. **Acceso al DOM no disponible:**
   - Solución: Implementar endpoint adicional para obtener última factura creada
   - O usar timestamp + polling para buscar factura reciente

### **Pseudocódigo para Google Apps Script:**

```javascript
function crearFacturaEnXubio(clienteId, clienteNombre, productos) {
  // 1. Obtener cookies de sesión (manual o de Properties)
  const sessionId = PropertiesService.getScriptProperties().getProperty('XUBIO_SESSION_ID');
  const jsessionId = PropertiesService.getScriptProperties().getProperty('XUBIO_JSESSION_ID');

  // 2. Construir XML
  const xml = construirXmlFactura({
    clienteId,
    clienteNombre,
    productos,
    puntoVentaId: 212819,
    empresaId: 234054
  });

  // 3. Enviar request
  const response = UrlFetchApp.fetch('https://xubio.com/NXV/DF_submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Cookie': `SessionId=${sessionId}; JSESSIONID=${jsessionId}`
    },
    payload: xml,
    muteHttpExceptions: true
  });

  // 4. Verificar status 200
  if (response.getResponseCode() === 200) {
    Logger.log('✅ Factura creada');

    // 5. Esperar y obtener última factura (implementar endpoint)
    Utilities.sleep(3000);
    const ultimaFactura = obtenerUltimaFactura();

    // 6. Generar PDF
    const pdfUrl = `https://xubio.com/NXV/general/includes/sr2.jsp?XMLFILE=FacturaVenta.jrxml&DATASOURCE=F_NXV_OP_0010&primaryKey=0&masiveReportsParams=FacturaVenta.jrxml|F_NXV_OP_0010|Factura|1|1|&listaIDs=${ultimaFactura.id}`;

    // 7. Descargar PDF
    const pdfResponse = UrlFetchApp.fetch(pdfUrl, {
      headers: { 'Cookie': `SessionId=${sessionId}; JSESSIONID=${jsessionId}` }
    });

    return {
      success: true,
      transaccionId: ultimaFactura.id,
      numeroComprobante: ultimaFactura.numero,
      pdfBlob: pdfResponse.getBlob()
    };
  }

  return { success: false };
}
```

---

## ✅ Validaciones Realizadas

- [x] Crear factura con endpoint XML → **FUNCIONA**
- [x] Factura se envía a AFIP automáticamente → **CONFIRMADO**
- [x] Extraer TransaccionID del DOM → **FUNCIONA**
- [x] Generar URL de PDF → **FUNCIONA**
- [x] Abrir/descargar PDF → **FUNCIONA**
- [x] Flujo completo automático → **FUNCIONA**
- [x] Múltiples facturas consecutivas → **FUNCIONA**

---

## 📊 Facturas de Prueba Creadas

Durante la validación se crearon las siguientes facturas exitosamente:

| Comprobante | TransaccionID | Precio | Estado |
|-------------|---------------|--------|--------|
| A-00004-00001679 | 67750266 | $1.00 | ✅ Creada + PDF |
| A-00004-00001680 | (varios) | $2.00 | ✅ Creada + PDF |
| A-00004-00001681 | (varios) | $3.00 | ✅ Creada + PDF |
| A-00004-00001682 | (varios) | $4.00 | ✅ Creada + PDF |
| A-00004-00001683 | (varios) | $5.00 | ✅ Creada + PDF |

**Todas las facturas se crearon exitosamente y se generaron los PDFs automáticamente.**

---

## 🎯 Conclusión

El flujo de facturación con Xubio ha sido **completamente descubierto y validado**.

**Próximos Pasos:**
1. ✅ Documentar flujo completo (este archivo)
2. ⏳ Implementar en Google Apps Script
3. ⏳ Integrar con AppSheet
4. ⏳ Probar en producción

**Archivos Clave:**
- `test-imprimir-pdf/sdk/xubioLegacyXml.js` - Implementación completa
- `test-imprimir-pdf/docs/FLUJO_COMPLETO_FACTURACION.md` - Este documento

**Listo para replicar en producción.** 🚀
