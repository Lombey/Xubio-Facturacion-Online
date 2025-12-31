# Template de Factura AGDP - Datos Reales de Producción

> **Capturado del Network Tab:** 31 Diciembre 2025
> **Uso:** Template base para Google Apps Script
> **Estado:** ✅ Validado en producción

---

## 📦 PRODUCTO PRINCIPAL (El más facturado)

### **CONECTIVIDAD ANUAL POR TOLVA**

```xml
<ProductoID type="C" id="2751338" value="CONECTIVIDAD ANUAL POR TOLVA"/>
<Descripcion value="Incluye Licencia para uso de un equipo por un año  - Incluye Licencia usuario y acceso a la plataforma web de AGDP - Incluye servicio soporte post venta REMOTO - Incluye mesa de ayuda"/>
<Cantidad value="1"/>
<Precio value="490"/>  <!-- USD -->
<ImporteImpuesto value="102.9000"/>  <!-- IVA 21% -->
<ImporteTotal value="592.9000"/>  <!-- Total con IVA -->
<porcentajetasaimpositiva value="21.00"/>
```

**Datos del Producto:**
- **ID:** `2751338`
- **Nombre:** CONECTIVIDAD ANUAL POR TOLVA
- **Precio:** USD 490
- **IVA:** 21% (USD 102.90)
- **Total:** USD 592.90

**Descripción completa:**
```
Incluye Licencia para uso de un equipo por un año
Incluye Licencia usuario y acceso a la plataforma web de AGDP
Incluye servicio soporte post venta REMOTO
Incluye mesa de ayuda
```

---

## 🏢 CONFIGURACIÓN EMPRESA (FIJA - Siempre igual)

```xml
<EmpresaID type="C" id="234054" value="corvusweb srl"/>
<PuntoVentaID type="C" id="212819" value="corvusweb srl"/>
<TalonarioID type="C" id="11290129" value="selector no implementado"/>
<M_LetraComprobante value="A"/>
```

**Valores fijos:**
- Empresa ID: `234054` (corvusweb srl)
- Punto Venta ID: `212819`
- Talonario ID: `11290129`
- Letra: `A`

---

## 💰 CONFIGURACIÓN MONEDA (FIJA excepto cotización)

```xml
<MonedaID type="C" id="-3" value="Dólares"/>
<Cotizacion value="1455" type="DEC"/>  <!-- VARIABLE - Consultar API BCRA -->
<ListaPrecioID type="C" id="15386" value="AGDP (Dólares)"/>
<CotizacionLista value="1" type="DEC"/>
```

**Valores:**
- Moneda: `-3` (Dólares)
- Lista Precios: `15386` (AGDP)
- **Cotización:** `1455` ⚠️ **VARIABLE** - Actualizar diariamente desde API BCRA

---

## 📋 CONFIGURACIÓN FACTURA (FIJA)

```xml
<Tipo type="CB" id="1" value="Factura"/>
<CondicionDePago type="CB" id="7" value="Otra"/>
<ModoCalculoImpuesto type="CB" id="0" value="Impuesto Discriminado"/>
<CircuitoContableID type="C" id="-2" value="default"/>
<DepositoID type="C" id="-2" value="Depósito Universal"/>
<ObservacionPredeterminadaID type="C" id="2590" value="DATOS SUPERVIELLE"/>
```

**Valores fijos:**
- Tipo: `1` (Factura)
- Condición Pago: `7` (Otra)
- Modo Cálculo Impuesto: `0` (Discriminado)
- Circuito Contable: `-2` (default)
- Depósito: `-2` (Universal)
- Observación Predeterminada: `2590` (DATOS SUPERVIELLE)

---

## 📝 DESCRIPCIÓN DE FACTURA (FIJA - Datos bancarios)

```xml
<Descripcion type="cdata"><![CDATA[CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5]]></Descripcion>
```

**Texto literal para todas las facturas:**
```
CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5
```

---

## 🔄 DATOS VARIABLES (Cambiar en cada factura)

### **1. Cliente (OrganizacionID + Ubicación)**
```xml
<OrganizacionID type="C" id="8157173" value="2MCAMPO"/>
<ProvinciaID type="C" id="1" value="Buenos Aires"/>
<LocalidadID type="C" id="147" value="Saladillo"/>
```
⚠️ **VARIABLE:** Obtener de Google Sheets o base de datos de clientes

**Importante:** Provincia y Localidad son del **domicilio fiscal del cliente**, no de la empresa.
Esto afecta el cálculo de percepciones de IIBB y otros impuestos provinciales.

### **2. Tipo de Cambio (Cotización)**
```xml
<Cotizacion value="1455" type="DEC"/>
<FechaCotizacion type="date" value="2025-12-31 00:00"/>
```
⚠️ **VARIABLE:** Consultar API BCRA diariamente

### **3. Fechas**
```xml
<Fecha type="date" value="2025-12-31 00:00"/>
<FechaVencimiento type="date" value="2025-12-31 00:00"/>
<FechaEmision type="date" value="2025-12-31 00:00"/>
<FechaCotizacion type="date" value="2025-12-31 00:00"/>
```
⚠️ **VARIABLE:** Usar fecha actual

### **4. Cantidad de productos (opcional)**
```xml
<Cantidad value="1"/>
```
⚠️ **VARIABLE:** Según la venta (generalmente 1)

---

## 🎯 TEMPLATE LISTO PARA GOOGLE APPS SCRIPT

### **Función JavaScript sugerida:**

```javascript
function crearFacturaAGDP(cliente, cantidad = 1, cotizacionUSD = 1455) {
  // cliente = { id, nombre, provinciaId, provinciaNombre, localidadId, localidadNombre }
  const fecha = new Date().toISOString().split('T')[0] + ' 00:00';

  // Producto fijo: CONECTIVIDAD ANUAL POR TOLVA
  const producto = {
    id: 2751338,
    nombre: 'CONECTIVIDAD ANUAL POR TOLVA',
    descripcion: 'Incluye Licencia para uso de un equipo por un año  - Incluye Licencia usuario y acceso a la plataforma web de AGDP - Incluye servicio soporte post venta REMOTO - Incluye mesa de ayuda',
    precio: 490,  // USD
    cantidad: cantidad,
    iva: 21
  };

  // Calcular totales
  const subtotal = producto.precio * cantidad;
  const importeIVA = subtotal * 0.21;
  const total = subtotal + importeIVA;

  // Construir XML
  const xml = `<df>
    <config>
      <javaClass value="app.nexiviaAR.ui.transaccion.form.FacturaVentaNXVARForm"/>
      <lightMode value="0"/>
      <userDataValues>
        <userDataValue name="auditID"><![CDATA[0]]></userDataValue>
        <userDataValue name="isTransaction"><![CDATA[true]]></userDataValue>
        <userDataValue name="v_PuntoVenta_Electronico"><![CDATA[true]]></userDataValue>
        <userDataValue name="standardXml"><![CDATA[claseVO=FacturaVentaARNXVVO|docID=220|adhocXmlFile=facturaVentaARNXV]]></userDataValue>
        <userDataValue name="TransaccionCategoriaID"><![CDATA[-8]]></userDataValue>
        <userDataValue name="titulo"><![CDATA[Nuevo - Comprobante de Venta]]></userDataValue>
        <userDataValue name="v_Talonario_Modo"><![CDATA[1]]></userDataValue>
        <userDataValue name="v_Factura_Aplicada"><![CDATA[false]]></userDataValue>
        <userDataValue name="auditClass"><![CDATA[app.nexivia.transacciones.compraVenta.ventas.facturaVenta.model.FacturaVentaNXVVO]]></userDataValue>
        <userDataValue name="v_ListaPrecio_MonedaID"><![CDATA[-3]]></userDataValue>
        <userDataValue name="v_Categoria_Fiscal"><![CDATA[1]]></userDataValue>
        <userDataValue name="v_Transaccion_Conciliada"><![CDATA[false]]></userDataValue>
        <userDataValue name="TransaccionSubTipoID"><![CDATA[220]]></userDataValue>
        <userDataValue name="vo"><![CDATA[FacturaVentaARNXVVO]]></userDataValue>
        <userDataValue name="action"><![CDATA[save]]></userDataValue>
      </userDataValues>
    </config>
    <dataset>
      <data>
        <pk value="0"/>
        <EmpresaID type="C" id="234054" value="corvusweb srl"/>
        <OrganizacionID type="C" id="${cliente.id}" value="${cliente.nombre}"/>
        <PuntoVentaID type="C" id="212819" value="corvusweb srl"/>
        <M_LetraComprobante value="A"/>
        <TalonarioID type="C" id="11290129" value="selector no implementado"/>
        <Fecha type="date" value="${fecha}"/>
        <CondicionDePago type="CB" id="7" value="Otra"/>
        <FechaVencimiento type="date" value="${fecha}"/>
        <FechaEmision type="date" value="${fecha}"/>
        <MonedaID type="C" id="-3" value="Dólares"/>
        <Cotizacion value="${cotizacionUSD}" type="DEC"/>
        <FechaCotizacion type="date" value="${fecha}"/>
        <ProvinciaID type="C" id="${cliente.provinciaId}" value="${cliente.provinciaNombre}"/>
        <LocalidadID type="C" id="${cliente.localidadId}" value="${cliente.localidadNombre}"/>
        <ListaPrecioID type="C" id="15386" value="AGDP (Dólares)"/>
        <ObservacionPredeterminadaID type="C" id="2590" value="DATOS SUPERVIELLE"/>
        <Descripcion type="cdata"><![CDATA[CC ARS 261-6044134-3 // CBU 0270261410060441340032 //
ALIAS corvus.super// Razón Social CORVUSWEB SRL
CUIT 30-71241712-5]]></Descripcion>

        <TransaccionCVItems type="D" count="1">
          <row>
            <pk value="0"/>
            <ProductoID type="C" id="${producto.id}" value="${producto.nombre}"/>
            <Descripcion value="${producto.descripcion}"/>
            <Cantidad value="${cantidad}"/>
            <Precio value="${producto.precio}"/>
            <Importe value="${subtotal.toFixed(2)}"/>
            <ImporteImpuesto value="${importeIVA.toFixed(4)}"/>
            <ImporteTotal value="${total.toFixed(4)}"/>
            <porcentajetasaimpositiva value="${producto.iva}.00"/>
            <Tipo value="1"/>
          </row>
        </TransaccionCVItems>

        <M_ImporteGravado value="${subtotal}" type="DEC"/>
        <M_ImporteImpuestos value="${importeIVA.toFixed(2)}" type="DEC"/>
        <M_ImporteTotal value="${total.toFixed(2)}" type="DEC"/>
      </data>
    </dataset>
  </df>`;

  return xml;
}
```

---

## 📊 EJEMPLO DE USO

```javascript
// Obtener cotización del día desde API BCRA
const cotizacion = obtenerCotizacionBCRA();  // Ej: 1455

// Datos del cliente (desde Google Sheets)
const cliente = {
  id: 8157173,
  nombre: '2MCAMPO',
  provinciaId: 1,
  provinciaNombre: 'Buenos Aires',
  localidadId: 147,
  localidadNombre: 'Saladillo'
};

// Crear factura
const xmlFactura = crearFacturaAGDP(
  cliente,      // Objeto con datos del cliente
  1,            // Cantidad (default: 1)
  cotizacion    // Cotización USD (default: 1455)
);

// Enviar a Xubio
const response = UrlFetchApp.fetch('https://xubio.com/NXV/DF_submit', {
  method: 'POST',
  contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
  payload: { body: xmlFactura },
  headers: {
    'Cookie': obtenerCookiesXubio()  // Session cookies
  }
});
```

---

## 🎯 CHECKLIST IMPLEMENTACIÓN

### **Datos Fijos (hardcodear):**
- ✅ Empresa ID: `234054`
- ✅ Punto Venta: `212819`
- ✅ Talonario: `11290129`
- ✅ Producto ID: `2751338` (CONECTIVIDAD ANUAL POR TOLVA)
- ✅ Precio: USD `490`
- ✅ IVA: `21%`
- ✅ Moneda: `-3` (Dólares)
- ✅ Lista Precios: `15386`
- ✅ Descripción bancaria (CDATA)
- ✅ Observación: `2590` (DATOS SUPERVIELLE)

### **Datos Variables (obtener dinámicamente):**
- ⚠️ **Cliente:** ID + Nombre + Provincia + Localidad (desde Google Sheets)
- ⚠️ **Cotización USD** (API BCRA)
- ⚠️ **Fecha actual** (Date.now())
- ⚠️ **Cantidad** (opcional, default: 1)

### **Integraciones necesarias:**
1. **API BCRA** → Cotización diaria USD oficial
2. **Google Sheets** → Base de datos de clientes (ID, Nombre, Provincia, Localidad)
3. **Xubio Cookies** → Autenticación (manual o programática)

### **Estructura de Google Sheets sugerida:**

| Cliente ID | Nombre | Provincia ID | Provincia | Localidad ID | Localidad |
|-----------|--------|--------------|-----------|--------------|-----------|
| 8157173 | 2MCAMPO | 1 | Buenos Aires | 147 | Saladillo |
| ... | ... | ... | ... | ... | ... |

---

## 💡 NOTAS IMPORTANTES

### **Sobre el Tipo de Cambio:**
- La cotización `1455` es un ejemplo del 31/12/2025
- **DEBE actualizarse diariamente** desde la API del BCRA
- API recomendada: `https://api.estadisticasbcra.com/usd_of`

### **Sobre los Clientes:**
- El cliente `8157173` (2MCAMPO) es solo un ejemplo
- Cada factura tendrá un cliente diferente
- **Mantener base de datos** en Google Sheets con:
  - Cliente ID
  - Nombre
  - Provincia ID + Nombre (domicilio fiscal)
  - Localidad ID + Nombre (domicilio fiscal)
  - CUIT (opcional para validaciones)

### **Sobre las Cantidades:**
- Generalmente será `1` (una licencia anual por tolva)
- Si facturás múltiples tolvas al mismo cliente, usar cantidad > 1

---

*Template validado el 31/12/2025 con factura real de producción*
*Producto: CONECTIVIDAD ANUAL POR TOLVA (ID: 2751338)*
