# Cobranzas via REST API

## Resumen

Endpoint para crear cobranzas en Xubio asociadas a facturas existentes.

**Limitación conocida:** La REST API de Xubio NO soporta imputación automática de cobranzas a facturas. La cobranza se crea correctamente pero debe imputarse manualmente desde la UI de Xubio (2 clicks). Para facilitar esto, la observación incluye los datos de la factura.

## Endpoint

```
POST https://xubio-facturacion-online.vercel.app/api/crear-cobranza
Content-Type: application/json
```

## Request

```json
{
  "facturaId": 67835721
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| facturaId | number | ID interno de la factura en Xubio (no es el número de documento) |

## Response (éxito)

```json
{
  "success": true,
  "data": {
    "cobranzaId": 67839148,
    "numeroRecibo": "C-0001-00001543",
    "factura": "A-00004-00001685",
    "cliente": "LA MAYACA SRL",
    "total": 169.4
  }
}
```

## Response (error)

```json
{
  "success": false,
  "error": "Mensaje de error",
  "debug": { ... }
}
```

## Flujo interno del endpoint

```
1. Recibe facturaId
   ↓
2. Obtiene token OAuth (cacheado)
   ↓
3. GET /comprobanteVentaBean/{facturaId}
   - Obtiene: cliente, moneda, cotización, total, numeroDocumento
   - Extrae: transaccionCVItemId del primer item
   ↓
4. Construye payload de cobranza
   - Cliente heredado de factura
   - Moneda y cotización heredadas
   - Observación: "IMPUTAR A: {numeroDocumento} - {cliente} - Total: {total}"
   - Instrumento de cobro: Banco (genérico)
   ↓
5. POST /cobranzaBean
   ↓
6. Retorna resultado
```

## Datos obtenidos automáticamente de la factura

El endpoint solo necesita `facturaId`. Los siguientes datos se obtienen automáticamente:

| Dato | Campo en factura |
|------|------------------|
| Cliente | `cliente.ID`, `cliente.nombre` |
| Moneda | `moneda.id`, `moneda.nombre` |
| Cotización | `cotizacion` |
| Total | `importetotal` |
| Número documento | `numeroDocumento` |
| Item ID | `transaccionProductoItems[0].transaccionCVItemId` |

## Observación generada

La cobranza incluye una observación automática para facilitar la imputación manual:

```
IMPUTAR A: A-00004-00001685 - LA MAYACA SRL - Total: 169.4 Dólares
```

## Script Apps Script

```javascript
const VERCEL_BASE = 'https://xubio-facturacion-online.vercel.app';

function crearCobranza(facturaId) {
  const url = VERCEL_BASE + '/api/crear-cobranza';
  const payload = { facturaId: parseInt(facturaId) };

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (!result.success) {
    throw new Error('Error creando cobranza: ' + result.error);
  }

  return result.data;
}
```

## Imputación manual en Xubio

Después de crear la cobranza:

1. Ir a **Xubio → Cuenta Corriente** del cliente
2. Seleccionar la cobranza (aparece con observación indicando factura)
3. Click en **Aplicar** → Seleccionar la factura → **Guardar**

## Campos de imputación probados (no funcionan)

Se intentaron los siguientes campos para imputación automática, todos ignorados por Xubio:

- `detalleCobranzas: [{ idComprobante, importe }]`
- `transaccionTesoreriaCtaCteItems: [{ transaccionIdOrigen, itemIdOrigen, ... }]`

**Conclusión:** La REST API de Xubio no expone la funcionalidad de imputación. Solo está disponible via UI o XML Legacy (no estable).

## IDs de referencia

| Recurso | ID | Valor |
|---------|-----|-------|
| Moneda ARS | -2 | Pesos Argentinos |
| Moneda USD | -3 | Dólares |
| Cuenta Banco | -14 | Banco (genérico) |
| Circuito Contable | -2 | default |
