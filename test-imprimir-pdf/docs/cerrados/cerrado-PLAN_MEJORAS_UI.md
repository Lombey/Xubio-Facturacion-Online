# Plan de Mejoras UI - Aplicación Xubio

**Fecha de creación:** 2024-01-XX  
**Basado en:** Análisis de `flujos.md` y código actual  
**Objetivo:** Mejorar la experiencia de usuario identificando y resolviendo problemas de UX críticos

---

## 📋 Resumen Ejecutivo

Este plan aborda los problemas de UX identificados en el análisis de flujos, organizados por prioridad y divididos en tareas pequeñas (thin slice) para facilitar la implementación incremental.

### Problemas Principales Identificados

1. **Facturación:**
   - Selector de moneda no visible (USD/ARS)
   - Observaciones hardcodeadas, no editables
   - Campo JSON muy técnico
   - Falta preview/resumen antes de crear
   - Valores por defecto no visibles
   - Totales no calculados antes de crear

2. **Cobranza:**
   - No hay búsqueda visual de facturas pendientes
   - Información de factura no visible antes de crear
   - Instrumento de pago hardcodeado

3. **PDF:**
   - Campo "Tipo Impresión" sin explicación

---

## 🎯 Fase 1: Mejoras Críticas de Facturación (Prioridad Alta)

### 1.1. Agregar Selector de Moneda Visible

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (líneas 296-307)
- `test-imprimir-pdf/assets/app.js` (líneas 74-77, 804-815)

**Checklist:**

- [x] **Paso 1.1.1:** Agregar campo de datos en Vue para moneda seleccionada
  - [x] Agregar `facturaMoneda: 'ARS'` en `data()` de `app.js` (línea ~74)
  - [x] Agregar `monedasList: []` para almacenar monedas disponibles (línea ~123)

- [x] **Paso 1.1.2:** Crear método para cargar monedas disponibles
  - [x] Crear método `async obtenerMonedas()` en `app.js` (después de línea 1514)
  - [x] Llamar a `GET /monedaBean?activo=1` usando `requestXubio()`
  - [x] Guardar resultado en `this.monedasList`
  - [x] Llamar automáticamente después de obtener token (en `obtenerToken()` línea ~457)

- [x] **Paso 1.1.3:** Agregar selector visual en HTML
  - [x] Reemplazar campo "Cotización (USD)" en `index.html` (línea 296-307)
  - [x] Agregar `<select>` con opciones ARS y USD (y otras si existen)
  - [x] Vincular con `v-model="facturaMoneda"`
  - [x] Mostrar campo de cotización solo si moneda != ARS

- [x] **Paso 1.1.4:** Actualizar lógica de construcción de payload
  - [x] Modificar `flujoCompletoFactura()` en `app.js` (línea ~640)
  - [x] Cambiar condición de línea 805: usar `facturaMoneda === 'USD'` en lugar de solo verificar si existe monedaUSD
  - [x] Si moneda es ARS, no agregar campo `moneda` al payload

- [x] **Paso 1.1.5:** Actualizar método `obtenerMonedaUSD()`
  - [x] Renombrar a `obtenerMoneda(monedaCodigo)` (línea ~1519)
  - [x] Aceptar parámetro de código de moneda
  - [x] Buscar moneda por código en `this.monedasList` primero (cache)
  - [x] Si no está en cache, consultar API

- [ ] **Paso 1.1.6:** Probar funcionalidad
  - [ ] Verificar que selector aparece correctamente
  - [ ] Verificar que al seleccionar USD se muestra cotización
  - [ ] Verificar que al seleccionar ARS se oculta cotización
  - [ ] Verificar que payload se construye correctamente según moneda seleccionada

**Ejemplos de Código:**

**1.1.1 - Agregar campos en data() (app.js):**
```javascript
// En data(), después de línea 77, agregar:
facturaMoneda: 'ARS', // Moneda seleccionada para la factura
monedasList: [], // Lista de monedas disponibles desde la API
```

**1.1.2 - Método para obtener monedas (app.js):**
```javascript
// Agregar después de obtenerCotizacionBCRA() (línea ~1514)
/**
 * Obtiene la lista de monedas disponibles
 */
async obtenerMonedas() {
  if (!this.accessToken) {
    return;
  }

  try {
    const { response, data } = await this.requestXubio('/monedaBean', 'GET', null, {
      activo: 1
    });
    
    if (response.ok && Array.isArray(data)) {
      this.monedasList = data;
      console.log(`✅ ${data.length} monedas cargadas`);
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error obteniendo monedas:', error);
    return [];
  }
},
```

**1.1.3 - Selector en HTML (index.html):**
```html
<!-- Reemplazar líneas 296-307 con: -->
<div class="form-group">
    <label for="facturaMoneda">Moneda:</label>
    <select id="facturaMoneda" v-model="facturaMoneda" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="ARS">ARS - Pesos Argentinos</option>
        <option v-for="moneda in monedasList" :key="moneda.id || moneda.ID" :value="moneda.codigo">
            {{ moneda.codigo }} - {{ moneda.nombre }}
        </option>
    </select>
</div>
<div class="form-group" v-if="facturaMoneda !== 'ARS'">
    <label for="facturaCotizacion">Cotización ({{ facturaMoneda }}):</label>
    <div style="display: flex; gap: 10px; align-items: center;">
        <input type="number" id="facturaCotizacion" v-model.number="facturaCotizacion" step="0.01" min="0.01" placeholder="Ej: 1.00" style="flex: 1;">
        <button class="test-btn" @click="obtenerCotizacionBCRA()" :disabled="isLoading">
            💱 Actualizar
        </button>
    </div>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">
        💡 Cotización del dólar. Se actualiza automáticamente al cargar la página.
    </div>
</div>
```

**1.1.4 - Actualizar lógica de payload (app.js, línea ~805):**
```javascript
// ANTES (línea 805):
if (monedaUSD) {
  payload.moneda = {
    ID: monedaUSD.ID || monedaUSD.id,
    codigo: monedaUSD.codigo,
    nombre: monedaUSD.nombre
  };
  // ...
}

// DESPUÉS:
if (this.facturaMoneda === 'USD' || (this.facturaMoneda && this.facturaMoneda !== 'ARS')) {
  const monedaSeleccionada = this.monedasList.find(m => 
    m.codigo === this.facturaMoneda || 
    m.codigo === 'USD'
  ) || await this.obtenerMoneda(this.facturaMoneda);
  
  if (monedaSeleccionada) {
    payload.moneda = {
      ID: monedaSeleccionada.ID || monedaSeleccionada.id,
      codigo: monedaSeleccionada.codigo,
      nombre: monedaSeleccionada.nombre
    };
    const cotizacion = parseFloat(this.facturaCotizacion) || 1;
    payload.cotizacion = cotizacion > 0 ? cotizacion : 1;
    payload.utilizaMonedaExtranjera = 1;
  }
}
```

**1.1.5 - Actualizar método obtenerMoneda (app.js, línea ~1519):**
```javascript
// ANTES:
async obtenerMonedaUSD() {
  // ...
}

// DESPUÉS:
/**
 * Obtiene una moneda por su código
 * @param {string} codigoMoneda - Código de la moneda (ej: 'USD', 'ARS')
 */
async obtenerMoneda(codigoMoneda = 'USD') {
  if (!this.accessToken) {
    return null;
  }

  // Buscar primero en cache
  const monedaEnCache = this.monedasList.find(m => 
    m.codigo === codigoMoneda || 
    m.codigo?.toUpperCase() === codigoMoneda.toUpperCase()
  );
  
  if (monedaEnCache) {
    return monedaEnCache;
  }

  try {
    const { response, data } = await this.requestXubio('/monedaBean', 'GET', null, {
      activo: 1
    });
    
    if (response.ok && Array.isArray(data)) {
      const moneda = data.find(m => 
        m.codigo === codigoMoneda || 
        m.codigo?.toUpperCase() === codigoMoneda.toUpperCase() ||
        m.nombre?.toUpperCase().includes(codigoMoneda.toUpperCase())
      );
      if (moneda) {
        console.log('✅ Moneda encontrada:', moneda);
        return moneda;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo moneda:', error);
    return null;
  }
},
```

**Tiempo estimado:** 2-3 horas  
**Dependencias:** Ninguna

---

### 1.2. Agregar Campo de Observaciones Editable

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (agregar después de línea 307)
- `test-imprimir-pdf/assets/app.js` (líneas 74-77, 818)

**Checklist:**

- [x] **Paso 1.2.1:** Agregar campo de datos en Vue
  - [x] Agregar `facturaObservacion: ''` en `data()` de `app.js` (línea ~77)
  - [x] Inicializar con valor por defecto: `"CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5"`

- [x] **Paso 1.2.2:** Agregar campo visual en HTML
  - [x] Agregar `<div class="form-group">` después del campo de cotización (después de línea 307)
  - [x] Agregar `<label>`: "Observaciones (opcional)"
  - [x] Agregar `<textarea>` vinculado con `v-model="facturaObservacion"`
  - [x] Agregar texto de ayuda: "Estas observaciones aparecerán en la factura"

- [x] **Paso 1.2.3:** Actualizar lógica de construcción de payload
  - [x] Modificar `flujoCompletoFactura()` en `app.js` (línea ~818)
  - [x] Reemplazar línea 818: `payload.observacion = this.facturaObservacion || observacion;`
  - [x] Eliminar constante hardcodeada `observacion`

- [ ] **Paso 1.2.4:** Probar funcionalidad
  - [ ] Verificar que campo aparece con valor por defecto
  - [ ] Verificar que se puede editar
  - [ ] Verificar que valor editado se envía en el payload
  - [ ] Verificar que si está vacío, se envía string vacío

**Ejemplos de Código:**

**1.2.1 - Agregar campo en data() (app.js):**
```javascript
// En data(), después de línea 77, agregar:
facturaObservacion: 'CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5',
```

**1.2.2 - Campo visual en HTML (index.html):**
```html
<!-- Agregar después de línea 307 (después del campo de cotización) -->
<div class="form-group">
    <label for="facturaObservacion">Observaciones (opcional):</label>
    <textarea 
        id="facturaObservacion" 
        v-model="facturaObservacion" 
        placeholder="Estas observaciones aparecerán en la factura"
        rows="3"
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px;">
    </textarea>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">
        💡 Estas observaciones aparecerán en la factura generada
    </div>
</div>
```

**1.2.3 - Actualizar lógica de payload (app.js, línea ~818):**
```javascript
// ANTES (línea 818):
const observacion = "CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5";
payload.observacion = observacion;

// DESPUÉS:
// Agregar observaciones si están definidas
if (this.facturaObservacion && this.facturaObservacion.trim()) {
  payload.observacion = this.facturaObservacion.trim();
} else {
  payload.observacion = ''; // O simplemente no agregar el campo
}
```

**Tiempo estimado:** 1 hora  
**Dependencias:** Ninguna

---

### 1.3. Ocultar Campo JSON en Modo Avanzado

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (líneas 308-311)
- `test-imprimir-pdf/assets/app.js` (línea ~77)

**Checklist:**

- [x] **Paso 1.3.1:** Agregar campo de datos para modo avanzado
  - [x] Agregar `modoAvanzado: false` en `data()` de `app.js` (línea ~77)

- [x] **Paso 1.3.2:** Agregar toggle en HTML
  - [x] Agregar checkbox antes del campo JSON (antes de línea 308)
  - [x] Label: "Modo avanzado (JSON manual)"
  - [x] Vincular con `v-model="modoAvanzado"`

- [x] **Paso 1.3.3:** Ocultar/mostrar campo JSON condicionalmente
  - [x] Agregar `v-if="modoAvanzado"` al `<div class="form-group">` del JSON (línea 308)
  - [x] Agregar texto de ayuda cuando está oculto: "Para casos especiales, activa el modo avanzado"

- [x] **Paso 1.3.4:** Agregar tooltip/ayuda
  - [x] Agregar `<div class="info">` explicando qué es el modo avanzado
  - [x] Texto: "El modo avanzado permite sobrescribir completamente el payload de la factura. Solo para casos especiales."

- [ ] **Paso 1.3.5:** Probar funcionalidad
  - [ ] Verificar que campo JSON está oculto por defecto
  - [ ] Verificar que al activar modo avanzado aparece
  - [ ] Verificar que al desactivar se oculta
  - [ ] Verificar que funcionalidad existente sigue funcionando

**Ejemplos de Código:**

**1.3.1 - Agregar campo en data() (app.js):**
```javascript
// En data(), después de línea 77, agregar:
modoAvanzado: false, // Controla si se muestra el campo JSON manual
```

**1.3.2 y 1.3.3 - Toggle y campo condicional en HTML (index.html):**
```html
<!-- Agregar antes de línea 308 (antes del campo JSON) -->
<div class="checkbox-group" style="margin-bottom: 15px;">
    <input type="checkbox" id="modoAvanzado" v-model="modoAvanzado">
    <label for="modoAvanzado" style="font-weight: normal; margin: 0;">
        🔧 Modo avanzado (JSON manual)
    </label>
</div>

<div v-if="!modoAvanzado" class="info" style="margin-bottom: 15px;">
    💡 Para casos especiales, activa el modo avanzado para editar el JSON completo de la factura.
</div>

<div v-if="modoAvanzado" class="form-group">
    <label for="facturaJson">JSON de Factura (modo avanzado):</label>
    <textarea 
        id="facturaJson" 
        v-model="facturaJson" 
        placeholder='JSON completo del payload. Esto sobrescribirá los productos seleccionados.'
        rows="8"
        style="font-family: 'Courier New', monospace; font-size: 12px;">
    </textarea>
    <div class="info" style="margin-top: 5px;">
        ⚠️ El modo avanzado permite sobrescribir completamente el payload de la factura. 
        Solo para casos especiales. Si llenas este campo, se ignorarán los productos seleccionados.
    </div>
</div>
```

**Tiempo estimado:** 1 hora  
**Dependencias:** Ninguna

---

### 1.4. Mostrar Valores por Defecto que se Usarán

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (agregar después de línea 280)
- `test-imprimir-pdf/assets/app.js` (agregar computed properties)

**Checklist:**

- [x] **Paso 1.4.1:** Crear computed properties para valores por defecto
  - [x] Agregar `centroDeCostoSeleccionado()` computed en `app.js` (después de línea 156)
  - [x] Retornar objeto con nombre y código del centro de costo por defecto
  - [x] Repetir para: `depositoSeleccionado()`, `vendedorSeleccionado()`, `puntoVentaSeleccionado()`, `circuitoContableSeleccionado()`

- [x] **Paso 1.4.2:** Crear componente visual de "Valores por Defecto"
  - [x] Agregar `<div class="info">` después del card de productos (después de línea 280)
  - [x] Título: "⚙️ Valores por Defecto que se Usarán:"
  - [x] Mostrar lista con cada valor:
    - Centro de Costo: `{{ centroDeCostoSeleccionado.nombre || 'No disponible' }}`
    - Depósito: `{{ depositoSeleccionado.nombre || 'No disponible' }}`
    - Vendedor: `{{ vendedorSeleccionado.nombre || 'No disponible' }}`
    - Punto de Venta: `{{ puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre || 'No disponible' }}`
    - Circuito Contable: `{{ circuitoContableSeleccionado.nombre || 'No disponible' }}`

- [x] **Paso 1.4.3:** Agregar estilo para el componente
  - [x] Agregar clase CSS `.valores-default` en `styles.css`
  - [x] Estilo: fondo #f0f7ff, borde #2196F3, padding 15px

- [ ] **Paso 1.4.4:** Probar funcionalidad
  - [ ] Verificar que se muestran valores correctos
  - [ ] Verificar que si no hay valores cargados muestra "No disponible"
  - [ ] Verificar que se actualiza cuando se cargan valores

**Ejemplos de Código:**

**1.4.1 - Computed properties (app.js, después de línea 156):**
```javascript
// Agregar en la sección computed, después de totalProductosSeleccionados
centroDeCostoSeleccionado() {
  const centro = this.obtenerCentroDeCostoPorDefecto();
  return {
    id: centro.ID || centro.id,
    nombre: centro.nombre || 'No disponible',
    codigo: centro.codigo || ''
  };
},

depositoSeleccionado() {
  const deposito = this.obtenerDepositoPorDefecto();
  if (!deposito) return { nombre: 'No disponible', codigo: '' };
  return {
    id: deposito.ID || deposito.id,
    nombre: deposito.nombre || 'No disponible',
    codigo: deposito.codigo || ''
  };
},

vendedorSeleccionado() {
  const vendedor = this.obtenerVendedorPorDefecto();
  return {
    id: vendedor.ID || vendedor.id,
    nombre: vendedor.nombre || 'No disponible',
    codigo: vendedor.codigo || ''
  };
},

puntoVentaSeleccionado() {
  const puntoVenta = this.obtenerPuntoVentaPorDefecto();
  return {
    id: puntoVenta.ID || puntoVenta.id,
    nombre: puntoVenta.nombre || 'No disponible',
    codigo: puntoVenta.codigo || ''
  };
},

circuitoContableSeleccionado() {
  const circuito = this.obtenerCircuitoContablePorDefecto();
  return {
    id: circuito.ID || circuito.id,
    nombre: circuito.nombre || 'No disponible',
    codigo: circuito.codigo || ''
  };
},
```

**1.4.2 - Componente visual (index.html, después de línea 280):**
```html
<!-- Agregar después del card de productos seleccionados -->
<div class="valores-default" style="margin-bottom: 20px; padding: 15px; background: #f0f7ff; border: 1px solid #2196F3; border-radius: 8px;">
    <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #1976d2;">
        ⚙️ Valores por Defecto que se Usarán:
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px;">
        <div>
            <strong>Centro de Costo:</strong><br>
            <span style="color: #666;">{{ centroDeCostoSeleccionado.nombre || 'No disponible' }}</span>
        </div>
        <div>
            <strong>Depósito:</strong><br>
            <span style="color: #666;">{{ depositoSeleccionado.nombre || 'No disponible' }}</span>
        </div>
        <div>
            <strong>Vendedor:</strong><br>
            <span style="color: #666;">{{ vendedorSeleccionado.nombre || 'No disponible' }}</span>
        </div>
        <div>
            <strong>Punto de Venta:</strong><br>
            <span style="color: #666;">{{ puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre || 'No disponible' }}</span>
        </div>
        <div>
            <strong>Circuito Contable:</strong><br>
            <span style="color: #666;">{{ circuitoContableSeleccionado.nombre || 'No disponible' }}</span>
        </div>
    </div>
</div>
```

**1.4.3 - Estilos (styles.css):**
```css
.valores-default {
    background: #f0f7ff;
    border: 1px solid #2196F3;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}
```

**Tiempo estimado:** 1.5 horas  
**Dependencias:** Requiere que valores de configuración estén cargados (ya existe en código)

---

### 1.5. Calcular y Mostrar Totales Antes de Crear

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (modificar tabla de productos, línea 248-280)
- `test-imprimir-pdf/assets/app.js` (agregar computed properties)

**Checklist:**

- [x] **Paso 1.5.1:** Crear computed properties para cálculos
  - [x] Agregar `subtotalSinIVA()` computed en `app.js` (después de línea 156)
  - [x] Calcular: suma de `cantidad * precio / 1.21` para cada producto (asumiendo IVA 21%)
  - [x] Agregar `totalIVA()` computed: suma de IVA por producto
  - [x] Agregar `totalConIVA()` computed: `totalProductosSeleccionados` (ya existe)
  - [x] Agregar `desgloseIVA()` computed: objeto con IVA por producto

- [x] **Paso 1.5.2:** Actualizar tabla de productos para mostrar IVA
  - [x] Agregar columna "IVA" en la tabla (línea 254-260)
  - [x] Mostrar IVA calculado por producto: `{{ calcularIVA(item) }}`
  - [x] Agregar método `calcularIVA(item)` en `app.js`

- [x] **Paso 1.5.3:** Agregar sección de resumen de totales
  - [x] Agregar `<div class="resumen-totales">` después de la tabla (después de línea 280)
  - [x] Mostrar:
    - Subtotal sin IVA: `{{ formatearPrecio(subtotalSinIVA) }}`
    - IVA (21%): `{{ formatearPrecio(totalIVA) }}`
    - **Total:** `{{ formatearPrecio(totalConIVA) }}`
  - [x] Estilo destacado para el total

- [x] **Paso 1.5.4:** Agregar método para calcular IVA por producto
  - [x] Crear método `calcularIVA(item)` en `app.js`
  - [x] Lógica: `(item.cantidad * item.precio) - (item.cantidad * item.precio / 1.21)`
  - [x] Retornar valor formateado

- [x] **Paso 1.5.5:** Agregar estilos para resumen
  - [x] Agregar clase `.resumen-totales` en `styles.css`
  - [x] Estilo: fondo #f8f9fa, borde superior, padding 15px, texto alineado a la derecha

- [ ] **Paso 1.5.6:** Probar funcionalidad
  - [ ] Verificar que cálculos son correctos
  - [ ] Verificar que se actualiza al cambiar cantidad/precio
  - [ ] Verificar formato de moneda

**Ejemplos de Código:**

**1.5.1 - Computed properties para cálculos (app.js, después de línea 156):**
```javascript
// Agregar en la sección computed
subtotalSinIVA() {
  return this.productosSeleccionados.reduce((total, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const importe = cantidad * precio;
    // Asumiendo que el precio incluye IVA 21%
    const sinIVA = importe / 1.21;
    return total + sinIVA;
  }, 0);
},

totalIVA() {
  return this.productosSeleccionados.reduce((total, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const importe = cantidad * precio;
    // IVA = importe - (importe / 1.21)
    const iva = importe - (importe / 1.21);
    return total + iva;
  }, 0);
},

// totalConIVA ya existe como totalProductosSeleccionados
```

**1.5.2 - Actualizar tabla con columna IVA (index.html, línea ~254):**
```html
<!-- Modificar thead de la tabla (línea 254-260) -->
<thead>
    <tr>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>IVA (21%)</th>
        <th>Subtotal</th>
    </tr>
</thead>
<tbody>
    <tr v-for="(item, index) in productosSeleccionados" :key="index">
        <td>{{ item.producto.nombre || item.producto.codigo || 'Sin nombre' }}</td>
        <td>
            <input type="number" v-model.number="item.cantidad" min="0.01" step="0.01" style="width: 80px;">
        </td>
        <td>
            <input type="number" v-model.number="item.precio" min="0" step="0.01" style="width: 100px;">
        </td>
        <td style="text-align: right;">${{ formatearPrecio(calcularIVA(item)) }}</td>
        <td style="text-align: right;">${{ formatearPrecio(item.cantidad * item.precio) }}</td>
    </tr>
</tbody>
```

**1.5.4 - Método calcularIVA (app.js, en methods):**
```javascript
/**
 * Calcula el IVA de un item de producto
 * @param {Object} item - Item con cantidad y precio
 * @returns {number} IVA calculado
 */
calcularIVA(item) {
  const cantidad = parseFloat(item.cantidad) || 0;
  const precio = parseFloat(item.precio) || 0;
  const importe = cantidad * precio;
  // Asumiendo precio con IVA incluido al 21%
  const iva = importe - (importe / 1.21);
  return parseFloat(iva.toFixed(2));
},
```

**1.5.3 - Resumen de totales (index.html, después de línea 280):**
```html
<!-- Agregar después de la tabla de productos -->
<div class="resumen-totales" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-top: 2px solid #dee2e6; text-align: right;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 500;">Subtotal sin IVA:</span>
        <span>${{ formatearPrecio(subtotalSinIVA) }}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 500;">IVA (21%):</span>
        <span>${{ formatearPrecio(totalIVA) }}</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #dee2e6; margin-top: 10px;">
        <span style="font-weight: bold; font-size: 18px;">Total:</span>
        <span style="font-weight: bold; font-size: 18px; color: #28a745;">${{ formatearPrecio(totalProductosSeleccionados) }}</span>
    </div>
</div>
```

**1.5.5 - Estilos (styles.css):**
```css
.resumen-totales {
    background: #f8f9fa;
    border-top: 2px solid #dee2e6;
    padding: 15px;
    text-align: right;
    margin-top: 20px;
}
```

**Tiempo estimado:** 2 horas  
**Dependencias:** Ninguna

---

### 1.6. Agregar Preview/Resumen Antes de Crear

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (agregar antes de botones, línea ~312)
- `test-imprimir-pdf/assets/app.js` (agregar método)

**Checklist:**

- [x] **Paso 1.6.1:** Crear componente de preview
  - [x] Agregar `<div class="preview-factura">` antes de los botones (antes de línea 312)
  - [x] Mostrar solo si hay cliente y productos seleccionados: `v-if="clienteSeleccionadoParaFactura && productosSeleccionados.length > 0"`

- [x] **Paso 1.6.2:** Agregar contenido del preview
  - [x] Título: "📄 Resumen de Factura a Crear"
  - [x] Sección Cliente:
    - Nombre/Razón Social
    - CUIT
  - [x] Sección Configuración:
    - Moneda seleccionada
    - Cotización (si aplica)
    - Fecha y vencimiento
    - Condición de pago
  - [x] Sección Productos:
    - Lista resumida (nombre, cantidad, precio unit, subtotal)
  - [x] Sección Totales:
    - Subtotal, IVA, Total
  - [x] Sección Valores por Defecto:
    - Lista de valores que se usarán

- [x] **Paso 1.6.3:** Agregar estilos para preview
  - [x] Agregar clase `.preview-factura` en `styles.css`
  - [x] Estilo: fondo blanco, borde #2196F3, padding 20px, border-radius 8px, box-shadow

- [x] **Paso 1.6.4:** Agregar computed para fecha de vencimiento
  - [x] Agregar `fechaVencimiento()` computed en `app.js`
  - [x] Por ahora: igual a fecha actual (se puede mejorar después)

- [ ] **Paso 1.6.5:** Probar funcionalidad
  - [ ] Verificar que preview aparece cuando hay datos
  - [ ] Verificar que se oculta cuando no hay datos
  - [ ] Verificar que información es correcta
  - [ ] Verificar que se actualiza al cambiar datos

**Ejemplos de Código:**

**1.6.1 y 1.6.2 - Componente de preview (index.html, antes de línea 312):**
```html
<!-- Agregar antes de los botones de acción -->
<div v-if="clienteSeleccionadoParaFactura && productosSeleccionados.length > 0" 
     class="preview-factura" 
     style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #2196F3; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <h3 style="margin-bottom: 15px; color: #2196F3; font-size: 18px;">
        📄 Resumen de Factura a Crear
    </h3>
    
    <!-- Sección Cliente -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold; margin-bottom: 5px;">👤 Cliente:</div>
        <div>{{ clienteSeleccionadoParaFactura.razonSocial || clienteSeleccionadoParaFactura.nombre || 'Sin nombre' }}</div>
        <div style="font-size: 12px; color: #666;">
            CUIT: {{ formatearCUIT(clienteSeleccionadoParaFactura.cuit || clienteSeleccionadoParaFactura.identificacionTributaria?.numero || '') || 'N/A' }}
        </div>
    </div>
    
    <!-- Sección Configuración -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold; margin-bottom: 5px;">⚙️ Configuración:</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
            <div><strong>Moneda:</strong> {{ facturaMoneda }}</div>
            <div v-if="facturaMoneda !== 'ARS'"><strong>Cotización:</strong> ${{ formatearPrecio(facturaCotizacion) }}</div>
            <div><strong>Fecha:</strong> {{ new Date().toISOString().split('T')[0] }}</div>
            <div><strong>Vencimiento:</strong> {{ fechaVencimiento }}</div>
        </div>
    </div>
    
    <!-- Sección Productos -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold; margin-bottom: 10px;">📦 Productos ({{ productosSeleccionados.length }}):</div>
        <div style="max-height: 150px; overflow-y: auto;">
            <div v-for="(item, index) in productosSeleccionados" :key="index" 
                 style="padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0;">
                <strong>{{ item.producto.nombre || item.producto.codigo }}</strong>
                - Cant: {{ item.cantidad }} 
                - ${{ formatearPrecio(item.precio) }} c/u 
                - Subtotal: ${{ formatearPrecio(item.cantidad * item.precio) }}
            </div>
        </div>
    </div>
    
    <!-- Sección Totales -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold; margin-bottom: 10px;">💰 Totales:</div>
        <div style="text-align: right; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Subtotal sin IVA:</span>
                <span>${{ formatearPrecio(subtotalSinIVA) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>IVA (21%):</span>
                <span>${{ formatearPrecio(totalIVA) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #2196F3; margin-top: 10px; font-weight: bold; font-size: 16px;">
                <span>Total:</span>
                <span style="color: #2196F3;">${{ formatearPrecio(totalProductosSeleccionados) }} {{ facturaMoneda }}</span>
            </div>
        </div>
    </div>
    
    <!-- Sección Valores por Defecto -->
    <div style="font-size: 12px; color: #666;">
        <div style="font-weight: bold; margin-bottom: 5px; color: #333;">Valores por Defecto:</div>
        <div>Centro de Costo: {{ centroDeCostoSeleccionado.nombre }}</div>
        <div>Depósito: {{ depositoSeleccionado.nombre }}</div>
        <div>Vendedor: {{ vendedorSeleccionado.nombre }}</div>
        <div>Punto de Venta: {{ puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre }}</div>
    </div>
</div>
```

**1.6.4 - Computed para fecha vencimiento (app.js, computed):**
```javascript
fechaVencimiento() {
  // Por ahora igual a fecha actual, se puede mejorar después
  return new Date().toISOString().split('T')[0];
},
```

**1.6.3 - Estilos (styles.css):**
```css
.preview-factura {
    background: white;
    border: 2px solid #2196F3;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}
```

**Tiempo estimado:** 2.5 horas  
**Dependencias:** 1.1 (selector moneda), 1.4 (valores por defecto), 1.5 (totales)

---

## 🎯 Fase 2: Mejoras de Cobranza (Prioridad Media)

### 2.1. Integrar Búsqueda de Facturas Pendientes

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (sección cobranza, línea 320-363)
- `test-imprimir-pdf/assets/app.js` (agregar métodos)

**Checklist:**

- [x] **Paso 2.1.1:** Agregar campo de datos
  - [x] Agregar `facturasPendientes: []` en `data()` de `app.js` (línea ~100)
  - [x] Agregar `mostrarFacturasPendientes: false` en `data()`

- [x] **Paso 2.1.2:** Crear método para obtener facturas pendientes
  - [x] Crear método `async obtenerFacturasPendientes(clienteId)` en `app.js`
  - [x] Llamar a `GET /comprobantesAsociados?clienteId={id}&tipoComprobante=1`
  - [x] Guardar resultado en `this.facturasPendientes`

- [x] **Paso 2.1.3:** Agregar botón y selector en HTML
  - [x] Agregar botón "Buscar Facturas Pendientes" después de campo Cliente ID (después de línea 334)
  - [x] Agregar dropdown/selector de facturas (similar a productos/clientes)
  - [x] Mostrar: número de comprobante, fecha, monto

- [x] **Paso 2.1.4:** Agregar lógica de selección
  - [x] Al seleccionar factura, llenar `cobranzaIdComprobante` y `cobranzaImporte`
  - [x] Mostrar preview de factura seleccionada

- [ ] **Paso 2.1.5:** Probar funcionalidad
  - [ ] Verificar que se obtienen facturas pendientes
  - [ ] Verificar que selector funciona
  - [ ] Verificar que al seleccionar se llenan campos

**Ejemplos de Código:**

**2.1.1 - Agregar campos en data() (app.js):**
```javascript
// En data(), después de línea 100, agregar:
facturasPendientes: [],
mostrarFacturasPendientes: false,
```

**2.1.2 - Método para obtener facturas pendientes (app.js):**
```javascript
/**
 * Obtiene facturas pendientes de un cliente
 * @param {number} clienteId - ID del cliente
 */
async obtenerFacturasPendientes(clienteId) {
  if (!this.accessToken || !clienteId) {
    this.mostrarResultado('cobranza', 'Error: Cliente ID requerido', 'error');
    return;
  }

  this.isLoading = true;
  this.loadingContext = 'Obteniendo facturas pendientes...';

  try {
    const { response, data } = await this.requestXubio('/comprobantesAsociados', 'GET', null, {
      clienteId: parseInt(clienteId),
      tipoComprobante: 1 // 1 = Factura
    });

    if (response.ok && Array.isArray(data)) {
      this.facturasPendientes = data.filter(f => {
        // Filtrar solo facturas con saldo pendiente
        const saldo = parseFloat(f.saldo || f.saldoPendiente || f.importeTotal || 0);
        return saldo > 0;
      });
      
      this.mostrarFacturasPendientes = true;
      this.mostrarResultado('cobranza', 
        `✅ Se encontraron ${this.facturasPendientes.length} facturas pendientes`, 
        'success'
      );
      return this.facturasPendientes;
    } else {
      this.mostrarResultado('cobranza', 
        `❌ Error obteniendo facturas: ${JSON.stringify(data, null, 2)}`, 
        'error'
      );
      return [];
    }
  } catch (error) {
    this.handleError(error, 'Obtención de facturas pendientes', 'cobranza');
    return [];
  } finally {
    this.isLoading = false;
    this.loadingContext = '';
  }
},
```

**2.1.3 y 2.1.4 - Selector en HTML (index.html, después de línea 334):**
```html
<!-- Agregar después del campo Cliente ID -->
<div class="form-group">
    <button @click="obtenerFacturasPendientes(cobranzaClienteId)" 
            :disabled="isLoading || !cobranzaClienteId"
            class="test-btn">
        🔍 Buscar Facturas Pendientes
    </button>
</div>

<div v-if="mostrarFacturasPendientes && facturasPendientes.length > 0" style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Seleccionar Factura:</label>
    <div style="position: relative;">
        <select 
            @change="seleccionarFacturaPendiente($event)"
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">-- Selecciona una factura --</option>
            <option v-for="factura in facturasPendientes" 
                    :key="factura.id || factura.ID" 
                    :value="JSON.stringify(factura)">
                {{ factura.numeroComprobante || factura.numero }} - 
                {{ factura.fecha }} - 
                Saldo: ${{ formatearPrecio(factura.saldo || factura.saldoPendiente || factura.importeTotal) }}
            </option>
        </select>
    </div>
</div>
```

**Método para seleccionar factura (app.js):**
```javascript
seleccionarFacturaPendiente(event) {
  const facturaStr = event.target.value;
  if (!facturaStr) return;
  
  try {
    const factura = JSON.parse(facturaStr);
    this.cobranzaIdComprobante = (factura.id || factura.ID || factura.transaccionId).toString();
    this.cobranzaImporte = (factura.saldo || factura.saldoPendiente || factura.importeTotal).toString();
    
    this.mostrarResultado('cobranza', 
      `✅ Factura seleccionada: ${factura.numeroComprobante || factura.numero}\nSaldo: $${this.formatearPrecio(parseFloat(this.cobranzaImporte))}`, 
      'success'
    );
  } catch (error) {
    console.error('Error parseando factura:', error);
  }
},
```

**Tiempo estimado:** 2 horas  
**Dependencias:** Ninguna

---

### 2.2. Mostrar Preview de Factura Antes de Crear Cobranza

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (sección cobranza)
- `test-imprimir-pdf/assets/app.js` (agregar método)

**Checklist:**

- [x] **Paso 2.2.1:** Agregar campo de datos para factura seleccionada
  - [x] Agregar `facturaParaCobrar: null` en `data()` de `app.js`

- [x] **Paso 2.2.2:** Crear método para obtener datos de factura
  - [x] Crear método `async obtenerDatosFactura(idComprobante)` en `app.js`
  - [x] Llamar a `GET /comprobanteVentaBean/{id}`
  - [x] Guardar en `this.facturaParaCobrar`

- [x] **Paso 2.2.3:** Agregar componente de preview
  - [x] Agregar `<div class="preview-factura-cobranza">` después de campos (después de línea 352)
  - [x] Mostrar solo si `facturaParaCobrar` existe
  - [x] Mostrar: número, fecha, cliente, monto total, saldo pendiente

- [x] **Paso 2.2.4:** Agregar lógica de carga automática
  - [x] Al ingresar `cobranzaIdComprobante`, cargar datos automáticamente
  - [x] Usar `@input` o `@blur` en el campo

- [ ] **Paso 2.2.5:** Probar funcionalidad
  - [ ] Verificar que preview aparece al ingresar ID
  - [ ] Verificar que información es correcta
  - [ ] Verificar validación de importe vs saldo

**Ejemplos de Código:**

**2.2.1 - Agregar campo en data() (app.js):**
```javascript
// En data(), después de línea 100, agregar:
facturaParaCobrar: null,
```

**2.2.2 - Método para obtener datos de factura (app.js):**
```javascript
/**
 * Obtiene los datos completos de una factura
 * @param {number|string} idComprobante - ID del comprobante
 */
async obtenerDatosFactura(idComprobante) {
  if (!this.accessToken || !idComprobante) {
    return null;
  }

  try {
    const { response, data } = await this.requestXubio(`/comprobanteVentaBean/${idComprobante}`, 'GET');
    
    if (response.ok && data) {
      this.facturaParaCobrar = data;
      console.log('✅ Datos de factura obtenidos:', data);
      return data;
    } else {
      this.facturaParaCobrar = null;
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo datos de factura:', error);
    this.facturaParaCobrar = null;
    return null;
  }
},
```

**2.2.3 - Componente de preview (index.html, después de línea 352):**
```html
<!-- Agregar después de los campos de cobranza -->
<div v-if="facturaParaCobrar" 
     class="preview-factura-cobranza"
     style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;">
    
    <div style="font-weight: bold; margin-bottom: 10px; color: #856404;">
        📄 Información de la Factura a Cobrar:
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
        <div><strong>Número:</strong> {{ facturaParaCobrar.numeroComprobante || facturaParaCobrar.numero || 'N/A' }}</div>
        <div><strong>Fecha:</strong> {{ facturaParaCobrar.fecha || 'N/A' }}</div>
        <div><strong>Cliente:</strong> {{ facturaParaCobrar.cliente?.razonSocial || facturaParaCobrar.cliente?.nombre || 'N/A' }}</div>
        <div><strong>Monto Total:</strong> ${{ formatearPrecio(facturaParaCobrar.importeTotal || facturaParaCobrar.total || 0) }}</div>
        <div><strong>Saldo Pendiente:</strong> 
            <span style="color: #28a745; font-weight: bold;">
                ${{ formatearPrecio(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0) }}
            </span>
        </div>
        <div><strong>Moneda:</strong> {{ facturaParaCobrar.moneda?.codigo || 'ARS' }}</div>
    </div>
    
    <div v-if="cobranzaImporte && parseFloat(cobranzaImporte) > parseFloat(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0)"
         style="margin-top: 10px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        ⚠️ El importe a aplicar (${{ formatearPrecio(cobranzaImporte) }}) excede el saldo pendiente (${{ formatearPrecio(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0) }})
    </div>
</div>
```

**2.2.4 - Carga automática (index.html, modificar campo cobranzaIdComprobante):**
```html
<!-- Modificar el campo existente (línea ~338) -->
<input 
    type="number" 
    id="cobranzaIdComprobante" 
    v-model="cobranzaIdComprobante" 
    @blur="obtenerDatosFactura(cobranzaIdComprobante)"
    placeholder="ID de la factura a cobrar">
```

**Tiempo estimado:** 1.5 horas  
**Dependencias:** 2.1 (opcional, pero recomendado)

---

### 2.3. Agregar Selector de Forma de Pago

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (sección cobranza)
- `test-imprimir-pdf/assets/app.js` (líneas 1031-1038)

**Checklist:**

- [x] **Paso 2.3.1:** Agregar campo de datos
  - [x] Agregar `cobranzaFormaPago: 'efectivo'` en `data()` de `app.js`
  - [x] Agregar `cuentasDisponibles: []` en `data()`

- [x] **Paso 2.3.2:** Crear método para cargar cuentas
  - [x] Crear método `async obtenerCuentas()` en `app.js`
  - [x] Llamar a `GET /cuenta?activo=1`
  - [x] Filtrar cuentas de caja/banco
  - [x] Guardar en `this.cuentasDisponibles`

- [x] **Paso 2.3.3:** Agregar selector en HTML
  - [x] Agregar `<select>` para forma de pago (efectivo, cheque, transferencia)
  - [x] Agregar `<select>` para cuenta (si aplica)
  - [x] Vincular con `v-model`

- [x] **Paso 2.3.4:** Actualizar lógica de construcción de payload
  - [x] Modificar `flujoCompletoCobranza()` en `app.js` (línea ~1031)
  - [x] Construir `transaccionInstrumentoDeCobro` según forma de pago seleccionada
  - [x] Usar cuenta seleccionada en lugar de hardcodeada

- [ ] **Paso 2.3.5:** Probar funcionalidad
  - [ ] Verificar que selectores aparecen
  - [ ] Verificar que payload se construye correctamente
  - [ ] Verificar diferentes formas de pago

**Ejemplos de Código:**

**2.3.1 - Agregar campos en data() (app.js):**
```javascript
// En data(), después de línea 86, agregar:
cobranzaFormaPago: 'efectivo', // 'efectivo', 'cheque', 'transferencia'
cobranzaCuentaId: null, // ID de la cuenta seleccionada
cuentasDisponibles: [],
```

**2.3.2 - Método para cargar cuentas (app.js):**
```javascript
/**
 * Obtiene las cuentas disponibles (caja/banco)
 */
async obtenerCuentas() {
  if (!this.accessToken) {
    return [];
  }

  try {
    const { response, data } = await this.requestXubio('/cuenta', 'GET', null, {
      activo: 1
    });
    
    if (response.ok && Array.isArray(data)) {
      // Filtrar solo cuentas de caja/banco (ajustar según estructura de la API)
      this.cuentasDisponibles = data.filter(c => 
        c.tipo === 'CAJA' || 
        c.tipo === 'BANCO' || 
        c.tipoCuenta === 1 || // 1 = Caja según documentación
        c.nombre?.toUpperCase().includes('CAJA')
      );
      console.log(`✅ ${this.cuentasDisponibles.length} cuentas cargadas`);
      return this.cuentasDisponibles;
    }
    return [];
  } catch (error) {
    console.error('❌ Error obteniendo cuentas:', error);
    return [];
  }
},
```

**2.3.3 - Selectores en HTML (index.html, después de línea 343):**
```html
<!-- Agregar después del campo Importe -->
<div class="form-group">
    <label for="cobranzaFormaPago">Forma de Pago:</label>
    <select id="cobranzaFormaPago" v-model="cobranzaFormaPago" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="efectivo">Efectivo</option>
        <option value="cheque">Cheque</option>
        <option value="transferencia">Transferencia Bancaria</option>
    </select>
</div>

<div class="form-group" v-if="cobranzaFormaPago !== 'efectivo'">
    <label for="cobranzaCuentaId">Cuenta:</label>
    <select id="cobranzaCuentaId" v-model="cobranzaCuentaId" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="">-- Selecciona una cuenta --</option>
        <option v-for="cuenta in cuentasDisponibles" 
                :key="cuenta.id || cuenta.ID" 
                :value="cuenta.id || cuenta.ID">
            {{ cuenta.nombre }} ({{ cuenta.codigo || '' }})
        </option>
    </select>
    <button @click="obtenerCuentas()" :disabled="isLoading" class="test-btn" style="margin-top: 5px;">
        🔄 Cargar Cuentas
    </button>
</div>
```

**2.3.4 - Actualizar lógica de payload (app.js, línea ~1031):**
```javascript
// ANTES (línea 1031-1038):
transaccionInstrumentoDeCobro: [{
  cuentaTipo: 1, // Tipo de cuenta (1 = Caja)
  cuenta: { ID: 1, id: 1 }, // Cuenta de caja por defecto
  moneda: comp.moneda || { ID: 1 },
  cotizacion: comp.cotizacion || 1,
  importe: parseFloat(importe),
  descripcion: `Cobranza de factura ${idComprobante}`
}]

// DESPUÉS:
transaccionInstrumentoDeCobro: [{
  cuentaTipo: this.cobranzaFormaPago === 'efectivo' ? 1 : 
              this.cobranzaFormaPago === 'cheque' ? 2 : 
              this.cobranzaFormaPago === 'transferencia' ? 3 : 1,
  cuenta: this.cobranzaCuentaId ? 
    { ID: parseInt(this.cobranzaCuentaId), id: parseInt(this.cobranzaCuentaId) } : 
    { ID: 1, id: 1 }, // Cuenta por defecto si no se selecciona
  moneda: comp.moneda || { ID: 1 },
  cotizacion: comp.cotizacion || 1,
  importe: parseFloat(importe),
  descripcion: `Cobranza de factura ${idComprobante} - ${this.cobranzaFormaPago}`
}]
```

**Tiempo estimado:** 2 horas  
**Dependencias:** Ninguna

---

## 🎯 Fase 3: Mejoras Generales (Prioridad Baja)

### 3.1. Agregar Explicación para "Tipo Impresión"

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (líneas 288-294, 345-351, 420-427)

**Checklist:**

- [x] **Paso 3.1.1:** Agregar tooltip/ayuda en cada campo
  - [x] Agregar `<span class="tooltip">` después de cada label "Tipo Impresión"
  - [x] Texto: "Tipo de formato de impresión. Valor recomendado: 1"
  - [x] Agregar icono de ayuda (?)

- [x] **Paso 3.1.2:** Agregar estilos para tooltip
  - [x] Agregar clase `.tooltip` en `styles.css`
  - [x] Estilo: cursor help, color #666, font-size 12px

- [ ] **Paso 3.1.3:** Probar funcionalidad
  - [ ] Verificar que tooltip aparece en todas las secciones
  - [ ] Verificar que es claro y útil

**Ejemplos de Código:**

**3.1.1 - Tooltip en HTML (index.html, modificar líneas 288, 345, 420):**
```html
<!-- Modificar cada label "Tipo Impresión" -->
<label for="facturaTipoimpresion">
    Tipo Impresión (para PDF):
    <span class="tooltip" title="Tipo de formato de impresión. Valor recomendado: 1">❓</span>
</label>
```

**3.1.2 - Estilos (styles.css):**
```css
.tooltip {
    cursor: help;
    color: #666;
    font-size: 12px;
    margin-left: 5px;
    display: inline-block;
}

.tooltip:hover {
    color: #2196F3;
}
```

**Tiempo estimado:** 30 minutos  
**Dependencias:** Ninguna

---

### 3.2. Agregar Selector de Condición de Pago

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (agregar en sección factura)
- `test-imprimir-pdf/assets/app.js` (líneas 74-77, 782)

**Checklist:**

- [x] **Paso 3.2.1:** Agregar campo de datos
  - [x] Agregar `facturaCondicionPago: 1` en `data()` de `app.js` (línea ~77)

- [x] **Paso 3.2.2:** Agregar selector en HTML
  - [x] Agregar `<select>` con opciones:
    - `1` = Cuenta Corriente
    - `2` = Contado
  - [x] Vincular con `v-model="facturaCondicionPago"`

- [x] **Paso 3.2.3:** Actualizar lógica de payload
  - [x] Modificar `flujoCompletoFactura()` en `app.js` (línea 782)
  - [x] Usar `this.facturaCondicionPago` en lugar de hardcodeado `1`

- [ ] **Paso 3.2.4:** Probar funcionalidad
  - [ ] Verificar que selector funciona
  - [ ] Verificar que valor se envía correctamente

**Ejemplos de Código:**

**3.2.1 - Agregar campo en data() (app.js):**
```javascript
// En data(), después de línea 77, agregar:
facturaCondicionPago: 1, // 1 = Cuenta Corriente, 2 = Contado
```

**3.2.2 - Selector en HTML (index.html, agregar después de campo observaciones):**
```html
<div class="form-group">
    <label for="facturaCondicionPago">Condición de Pago:</label>
    <select id="facturaCondicionPago" v-model="facturaCondicionPago" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option :value="1">Cuenta Corriente</option>
        <option :value="2">Contado</option>
    </select>
</div>
```

**3.2.3 - Actualizar payload (app.js, línea 782):**
```javascript
// ANTES:
condicionDePago: 1, // 1=Cuenta Corriente, 2=Contado

// DESPUÉS:
condicionDePago: parseInt(this.facturaCondicionPago) || 1,
```

**Tiempo estimado:** 1 hora  
**Dependencias:** Ninguna

---

### 3.3. Agregar Selector de Fecha de Vencimiento

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (agregar en sección factura)
- `test-imprimir-pdf/assets/app.js` (líneas 74-77, 781)

**Checklist:**

- [x] **Paso 3.3.1:** Agregar campo de datos
  - [x] Agregar `facturaFechaVto: ''` en `data()` de `app.js`
  - [x] Inicializar con fecha actual en `mounted()`

- [x] **Paso 3.3.2:** Agregar campo de fecha en HTML
  - [x] Agregar `<input type="date">` para fecha de vencimiento
  - [x] Vincular con `v-model="facturaFechaVto"`

- [x] **Paso 3.3.3:** Actualizar lógica de payload
  - [x] Modificar `flujoCompletoFactura()` en `app.js` (línea 781)
  - [x] Usar `this.facturaFechaVto` en lugar de `fechaISO`

- [ ] **Paso 3.3.4:** Probar funcionalidad
  - [ ] Verificar que campo aparece con fecha por defecto
  - [ ] Verificar que se puede cambiar
  - [ ] Verificar que valor se envía correctamente

**Ejemplos de Código:**

**3.3.1 - Agregar campo en data() y mounted() (app.js):**
```javascript
// En data(), después de línea 77, agregar:
facturaFechaVto: '',

// En mounted(), después de línea 189, agregar:
// Inicializar fecha de vencimiento con fecha actual
this.facturaFechaVto = new Date().toISOString().split('T')[0];
```

**3.3.2 - Campo de fecha en HTML (index.html, agregar después de condición de pago):**
```html
<div class="form-group">
    <label for="facturaFechaVto">Fecha de Vencimiento:</label>
    <input 
        type="date" 
        id="facturaFechaVto" 
        v-model="facturaFechaVto" 
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

**3.3.3 - Actualizar payload (app.js, línea 781):**
```javascript
// ANTES:
fechaVto: fechaISO, // Fecha de vencimiento (requerido según Swagger)

// DESPUÉS:
fechaVto: this.facturaFechaVto || fechaISO,
```

**Tiempo estimado:** 1 hora  
**Dependencias:** Ninguna

---

### 3.4. Mejorar Feedback Visual Después de Crear

**Archivos a modificar:**
- `test-imprimir-pdf/index.html` (modificar sección de resultados)
- `test-imprimir-pdf/assets/app.js` (líneas 838-846)

**Checklist:**

- [x] **Paso 3.4.1:** Mejorar mensaje de éxito
  - [x] Modificar `flujoCompletoFactura()` en `app.js` (línea ~840)
  - [x] Agregar más información en el mensaje:
    - Número de factura (si está disponible)
    - Cliente
    - Total
    - Moneda

- [ ] **Paso 3.4.2:** Agregar componente visual de confirmación
  - [ ] Crear componente de "tarjeta de éxito" en HTML
  - [ ] Mostrar información destacada
  - [ ] Agregar botones: "Ver PDF", "Crear Otra", "Ver en Xubio" (si es posible)

- [ ] **Paso 3.4.3:** Agregar estilos
  - [ ] Agregar clase `.confirmacion-exito` en `styles.css`
  - [ ] Estilo: fondo verde claro, borde verde, padding 20px

- [ ] **Paso 3.4.4:** Probar funcionalidad
  - [ ] Verificar que mensaje es más informativo
  - [ ] Verificar que botones funcionan
  - [ ] Verificar que diseño es atractivo

**Ejemplos de Código:**

**3.4.1 - Mejorar mensaje de éxito (app.js, línea ~840):**
```javascript
// ANTES:
let mensaje = `✅ Factura creada exitosamente!\n\n`;
mensaje += `Transaction ID: ${transaccionId}\n`;
mensaje += `ID: ${data.id || data.ID || 'N/A'}\n\n`;
mensaje += `Obteniendo PDF...\n\n`;

// DESPUÉS:
let mensaje = `✅ Factura creada exitosamente!\n\n`;
mensaje += `📋 Detalles:\n`;
mensaje += `• Transaction ID: ${transaccionId}\n`;
mensaje += `• Número: ${data.numeroComprobante || data.numero || 'N/A'}\n`;
mensaje += `• Cliente: ${this.clienteSeleccionadoParaFactura?.razonSocial || this.clienteSeleccionadoParaFactura?.nombre || 'N/A'}\n`;
mensaje += `• Total: $${this.formatearPrecio(this.totalProductosSeleccionados)} ${this.facturaMoneda}\n`;
mensaje += `• Moneda: ${this.facturaMoneda}\n\n`;
mensaje += `Obteniendo PDF...\n\n`;
```

**3.4.2 - Componente visual de confirmación (index.html, modificar sección de resultados):**
```html
<!-- Reemplazar o complementar el div de resultado (después de línea 316) -->
<div v-if="facturaResult.visible && facturaResult.type === 'success'" 
     class="confirmacion-exito"
     style="margin-top: 20px; padding: 20px; background: #d4edda; border: 2px solid #28a745; border-radius: 8px;">
    
    <div style="font-size: 20px; font-weight: bold; color: #155724; margin-bottom: 15px;">
        ✅ Factura Creada Exitosamente
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
            <div><strong>Transaction ID:</strong> {{ facturaResult.transaccionId || 'N/A' }}</div>
            <div><strong>Número:</strong> {{ facturaResult.numero || 'N/A' }}</div>
            <div><strong>Cliente:</strong> {{ clienteSeleccionadoParaFactura?.razonSocial || 'N/A' }}</div>
            <div><strong>Total:</strong> ${{ formatearPrecio(totalProductosSeleccionados) }} {{ facturaMoneda }}</div>
        </div>
    </div>
    
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button @click="facturaPdfViewerVisible ? null : obtenerPDF(facturaResult.transaccionId, facturaTipoimpresion, 'factura')" 
                class="btn-secondary"
                v-if="facturaResult.transaccionId">
            📄 Ver PDF
        </button>
        <button @click="limpiarFormularioFactura()" class="btn-secondary">
            ➕ Crear Otra
        </button>
    </div>
</div>
```

**3.4.3 - Estilos (styles.css):**
```css
.confirmacion-exito {
    background: #d4edda;
    border: 2px solid #28a745;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}
```

**Método para limpiar formulario (app.js):**
```javascript
limpiarFormularioFactura() {
  this.productosSeleccionados = [];
  this.clienteSeleccionadoParaFactura = null;
  this.facturaClienteId = '';
  this.facturaObservacion = 'CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5';
  this.facturaResult.visible = false;
  this.facturaPdfViewerVisible = false;
},
```

**Tiempo estimado:** 1.5 horas  
**Dependencias:** Ninguna

---

## 📊 Resumen de Prioridades y Tiempos

### Prioridad Alta (Fase 1)
- **1.1** Selector de moneda: 2-3 horas
- **1.2** Campo observaciones: 1 hora
- **1.3** Ocultar JSON: 1 hora
- **1.4** Mostrar valores por defecto: 1.5 horas
- **1.5** Calcular totales: 2 horas
- **1.6** Preview antes de crear: 2.5 horas

**Total Fase 1:** ~10-11 horas

### Prioridad Media (Fase 2)
- **2.1** Búsqueda facturas pendientes: 2 horas
- **2.2** Preview factura cobranza: 1.5 horas
- **2.3** Selector forma de pago: 2 horas

**Total Fase 2:** ~5.5 horas

### Prioridad Baja (Fase 3)
- **3.1** Explicación tipo impresión: 0.5 horas
- **3.2** Selector condición de pago: 1 hora
- **3.3** Selector fecha vencimiento: 1 hora
- **3.4** Mejorar feedback visual: 1.5 horas

**Total Fase 3:** ~4 horas

**Tiempo Total Estimado:** ~19-20 horas

---

## 🚀 Orden Recomendado de Implementación

### Sprint 1 (Día 1-2): Fundamentos
1. 1.1 - Selector de moneda
2. 1.2 - Campo observaciones
3. 1.3 - Ocultar JSON

### Sprint 2 (Día 3-4): Información y Preview
4. 1.4 - Mostrar valores por defecto
5. 1.5 - Calcular totales
6. 1.6 - Preview antes de crear

### Sprint 3 (Día 5-6): Mejoras de Cobranza
7. 2.1 - Búsqueda facturas pendientes
8. 2.2 - Preview factura cobranza
9. 2.3 - Selector forma de pago

### Sprint 4 (Día 7): Mejoras Generales
10. 3.1 - Explicación tipo impresión
11. 3.2 - Selector condición de pago
12. 3.3 - Selector fecha vencimiento
13. 3.4 - Mejorar feedback visual

---

## 📝 Notas de Implementación

### Convenciones de Código
- Mantener estructura Vue.js existente
- Usar computed properties para cálculos
- Agregar comentarios JSDoc para métodos nuevos
- Seguir convención de nombres existente

### Testing
- Probar cada feature individualmente antes de pasar al siguiente
- Verificar que no se rompe funcionalidad existente
- Probar con datos reales de la API cuando sea posible

### Referencias de Código
- **Autenticación:** `app.js` líneas 387-469
- **Construcción de payload factura:** `app.js` líneas 640-859
- **Construcción de payload cobranza:** `app.js` líneas 992-1067
- **Cache:** `app.js` líneas 223-345
- **Estilos:** `styles.css` completo

---

## ✅ Checklist General de Finalización

Antes de considerar el plan completo, verificar:

- [ ] Todas las tareas de Fase 1 completadas
- [ ] Todas las tareas de Fase 2 completadas (opcional pero recomendado)
- [ ] Todas las tareas de Fase 3 completadas (opcional)
- [ ] Código probado en ambiente de desarrollo
- [ ] Sin errores de consola
- [ ] Funcionalidad existente no afectada
- [ ] Documentación actualizada si es necesario

---

**Última actualización:** 2024-01-XX  
**Estado:** Pendiente de implementación

