3# Plan: Implementar Cobranza de Factura vía API Xubio
3
## Objetivo
Crear funcionalidad para cobrar una factura específica usando la API de Xubio, replicando el flujo de la UI web.

## Estado: ✅ Exploración Completa → Diseño de Implementación

---

## 🔍 Hallazgos de la Exploración

### ✅ Asociación Factura-Cobranza RESUELTA
**Ubicación:** `sdk/cobranzaService.js:51-55`

```javascript
// Campo clave descubierto:
detalleCobranzas: [{
    idComprobante: parseInt(facturaRef.id),
    importe: monto
}]
```

El array `detalleCobranzas` contiene la imputación de la cobranza a factura(s) específica(s).

### ✅ Tipos de Cuenta Mapeados
**Ubicación:** `sdk/cobranzaService.js:14`

- `cuentaTipo: 1` = Caja
- `cuentaTipo: 2` = Banco

### ✅ Estructura Completa de Payload
**Ubicación:** `sdk/cobranzaService.js:20-56`

El servicio ya tiene implementado `buildPayload()` con todos los campos necesarios:
- Circuito contable (heredado de factura)
- Cliente
- Moneda + cotización (heredados de factura)
- Instrumento de cobro con cuenta, tipo, importe
- **Imputación a factura vía `detalleCobranzas`**

---

## 📋 Flujo del Usuario (Confirmado)

**En la UI de Xubio:**
1. Selecciona factura → botón "Cobrar"
2. Formulario se pre-completa automáticamente
3. Usuario solo configura:
   - **Tipo de Cuenta**: "Banco" (transferencia) o "Valores a Depositar" (cheque)
   - **Cuenta**: Santander, etc.
   - **Si es cheque**: Nro. de cheque + vencimiento + banco
4. Siempre se cancela el monto total de la factura

---

## 🎯 Plan de Implementación

### Fase 1: Generar "Gold Standard" de Cobranza
**Enfoque:** Usuario crea cobranza manualmente, obtenemos payload real via API

**Pasos:**
1. Usuario crea cobranza en UI de Xubio (ejemplo: factura recién creada)
2. Ejecutar script para obtener cobranza vía `GET /cobranzaBean`
3. Guardar response completo como "gold standard"
4. Analizar campos reales vs estructura en `cobranzaService.js`

**Script a crear:** `apps-script/TestObtenerCobranza.js`
```javascript
function obtenerUltimaCobranza() {
  const hoy = new Date().toISOString().split('T')[0];
  const url = VERCEL_BASE + '/api/discovery?resource=cobranzaBean&fechaDesde=' + hoy;

  const res = UrlFetchApp.fetch(url);
  const result = JSON.parse(res.getContentText());

  // Guardar en Drive para análisis
  if (result.success && result.data.length > 0) {
    const ultima = result.data[result.data.length - 1];
    persistJsonToDrive('cobranza-gold', ultima);
    Logger.log('✅ Cobranza guardada: ' + JSON.stringify(ultima, null, 2));
  }
}
```

### Fase 2: Crear Endpoint `/api/crear-cobranza`
**Ubicación:** Nuevo archivo `api/crear-cobranza.js`

**Parámetros de entrada:**
```javascript
{
  facturaId: 123456,           // ID de la factura a cobrar
  cuentaTipo: 2,               // 1=Caja, 2=Banco
  cuentaId: 789,               // ID de la cuenta (Santander, etc)
  // Opcional para cheques:
  numCheque: "12345678",
  vtoCheque: "2026-02-15",
  bancoId: 456
}
```

**Lógica:**
1. Obtener factura completa vía `GET /comprobanteVentaBean/{facturaId}`
2. Extraer: cliente, moneda, cotización, circuito contable, monto total
3. Construir payload usando `cobranzaService.buildPayload()`
4. POST a `/cobranzaBean`
5. Retornar: `{ transaccionid, numeroRecibo, fecha }`

### Fase 3: Integración con Apps Script
**Ubicación:** Actualizar `apps-script/XubioDiscovery.js`

**Nueva función:**
```javascript
function cobrarFactura(facturaId, cuentaTipo, cuentaId) {
  const payload = {
    facturaId: facturaId,
    cuentaTipo: cuentaTipo,  // 2 = Banco
    cuentaId: cuentaId
  };

  const url = VERCEL_BASE + '/api/crear-cobranza';
  const res = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });

  return JSON.parse(res.getContentText());
}
```

---

## 📁 Archivos a Crear/Modificar

### Crear:
1. **`apps-script/TestObtenerCobranza.js`**
   - Funciones para obtener cobranzas via discovery
   - Script para guardar "gold standard"

2. **`api/crear-cobranza.js`**
   - Endpoint principal para crear cobranza
   - Validaciones de factura existente
   - Construcción de payload

3. **`docs/Consulta APIs/COBRANZA_GOLD_STANDARD.md`**
   - Documentar payload real obtenido de Xubio
   - Comparativa con estructura en `cobranzaService.js`
   - Notas de implementación

### Modificar:
1. **`apps-script/XubioDiscovery.js`**
   - Agregar función `cobrarFactura()`
   - Test de cobranza completa

2. **`sdk/cobranzaService.js`**
   - Ajustar si se descubren campos faltantes en el gold standard
   - Agregar soporte para cheques (numCheque, vtoCheque, banco)

---

## 🔄 Flujo Completo End-to-End

```
1. AppSheet trigger → Apps Script
2. crearFacturaCompleta(cuit, precio, cantidad)
   → Retorna { transaccionId, numeroDocumento }
3. cobrarFactura(transaccionId, cuentaTipo=2, cuentaId)
   → Retorna { cobranzaId, numeroRecibo }
4. Actualizar AppSheet con: facturaId + cobranzaId
```

---

## ⚠️ Validaciones Críticas

1. **Factura debe existir** antes de crear cobranza
2. **Cliente debe coincidir** entre factura y cobranza
3. **Moneda + cotización** deben heredarse de factura origen
4. **Importe de cobranza** no puede exceder saldo pendiente de factura
5. **Cuenta debe existir** en Xubio (obtener via `GET /cuenta`)

---

## 🧪 Próximo Paso Inmediato

**Usuario crea cobranza manualmente → Obtener via API**

Comandos para ejecutar después de crear la cobranza:

1. Abrir Apps Script Editor
2. Copiar función `obtenerUltimaCobranza()`
3. Ejecutar
4. Revisar logs para ver estructura completa
5. Guardar JSON en `docs/Consulta APIs/cobranza-gold-{timestamp}.json`
