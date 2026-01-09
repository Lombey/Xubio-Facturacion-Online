# Estado: Facturación de Equipos (Kits AGDP)

**Fecha:** 2026-01-09
**Estado:** UI completa, backend pendiente

---

## Resumen del flujo

Facturar múltiples equipos del mismo cliente en 1 sola factura con N items.
Opcionalmente incluir licencias (490 USD c/u).

```
Usuario carga equipos → SELECCION_PARA_FC = TRUE (auto)
Usuario ejecuta "FACTURAR KITS AGDP"
Popup: "¿Incluir licencias?" → Yes/No
Bot detecta ESTADO_PAGO = "FACTURADO"
Bot busca todos con SELECCION_PARA_FC = TRUE + mismo CUIT
Bot llama webhook → 1 factura con N items
Bot limpia SELECCION_PARA_FC = FALSE
```

---

## UI AppSheet (COMPLETADO)

### Tabla: TABLET

### Columnas:
| Columna | Tipo | Función |
|---------|------|---------|
| CUIT | Text | Identificador cliente |
| ESTADO_PAGO | Enum | "NO FACTURADO" / "FACTURADO" |
| PRESUPUESTO (USD) | Price | Precio por equipo (ej: 1900) |
| SELECCION_PARA_FC | Text | Agrupa equipos para facturar |
| INCLUIR_LICENCIAS | Yes/No | Input del popup |

### Initial Value de SELECCION_PARA_FC:
```
IF([ESTADO_PAGO] = "NO FACTURADO", TRUE, FALSE)
```

### Acción: FACTURAR KITS AGDP
- **Do this:** Data: set the values of some columns
- **Set columns:**
  - `ESTADO_PAGO` = `"FACTURADO"`
  - `INCLUIR_LICENCIAS` = `[_INPUT].[¿Incluir licencias?]`
- **Condition:** `[ESTADO_PROCESO] = "1 - VENTAS"`
- **Confirmation:** "SÍ, FACTURAR"
- **Input:** `¿Incluir licencias?` (Yes/No, default TRUE)
- **Position:** Inline
- **Attach to column:** FACTURAR KITS

---

## PENDIENTE: Bot AppSheet

### Crear bot: "Facturar Kits AGDP"
- **Event:** Updates on TABLET
- **Condition:** `[ESTADO_PAGO] = "FACTURADO"`
- **Task 1:** Call webhook (ver body abajo)
- **Task 2:** Limpiar SELECCION_PARA_FC = FALSE en filas procesadas

### Webhook body (propuesto):
```json
{
  "accion": "facturarEquipos",
  "cuit": "<<[CUIT]>>",
  "idRef": "<<[ID]>>",
  "incluirLicencias": <<[INCLUIR_LICENCIAS]>>,
  "precioEquipo": <<[PRESUPUESTO (USD)]>>,
  "descuento": <<[DESCUENTO (%)]>>
}
```

**Nota:** El bot debe contar equipos con SELECCION_PARA_FC = TRUE del mismo CUIT.
Esto puede requerir lógica en Apps Script (no solo webhook simple).

---

## PENDIENTE: Apps Script

### Nuevo archivo: `XubioEquipos.js`

Funciones necesarias:
1. `procesarFacturacionEquipos(requestData)` - llamada desde router.gs
2. `contarEquiposSeleccionados(cuit)` - cuenta filas con TRUE + mismo CUIT
3. `obtenerPrecioEquipo(idRef)` - lee precio de la fila
4. `limpiarSeleccion(cuit)` - pone FALSE en filas procesadas

### Router.gs - agregar ruta:
```javascript
if (requestData.accion === 'facturarEquipos') {
  return procesarFacturacionEquipos(requestData);
}
```

---

## PENDIENTE: Endpoint Vercel

### Opción A: Modificar `/api/crear-factura.js`
Agregar soporte para múltiples items en `transaccionProductoItems[]`

### Opción B: Nuevo endpoint `/api/crear-factura-equipos.js`
Específico para este flujo

### Payload necesario:
```javascript
{
  clienteId: number,
  items: [
    { productoId: KIT_AGDP_ID, cantidad: N, precio: 1900 },
    { productoId: LICENCIA_ID, cantidad: N, precio: 490 }  // opcional
  ]
}
```

### IDs de productos (verificar en Xubio):
- Kit AGDP: ? (buscar con /api/discovery?resource=productoBean)
- Licencia: 2751338 (CONECTIVIDAD ANUAL POR TOLVA)

---

## Decisiones pendientes

1. ¿Cómo cuenta el bot los equipos seleccionados?
   - Opción A: Webhook por cada fila, Apps Script agrupa
   - Opción B: Apps Script lee sheet directamente y cuenta

2. ¿ID del producto Kit AGDP?
   - Buscar en Xubio o crear si no existe

3. ¿Mismo endpoint o nuevo?
   - Recomendación: modificar existente para soportar array de items

---

## Archivos relacionados

- `README.md` - Documentación FLUJO 4
- `apps-script/router.gs` - Router de webhooks
- `apps-script/XubioDiscovery.js` - Facturación conectividades (referencia)
- `api/crear-factura.js` - Endpoint actual (base para modificar)
