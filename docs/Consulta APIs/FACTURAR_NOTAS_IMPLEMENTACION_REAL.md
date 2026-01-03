# Endpoint Xubio `/API/1.1/facturar` — Notas de implementación real (probado)

Fecha: 2026-01-02

Este documento registra el comportamiento **real** observado al integrar el endpoint de Xubio **`POST /API/1.1/facturar`** (vía Vercel proxy), complementando el esquema formal del Swagger (`docs/Consulta APIs/swagger.json`).

## Contexto

- Se implementó un flujo de prueba desde Apps Script (`apps-script/XubioVercelDinamico.js`) llamando a Xubio a través del proxy de Vercel:
  - `POST {VERCEL}/api/proxy?path=/facturar`
- El proxy (`api/proxy.js`) inyecta el Bearer token oficial y reenvía el body.

## Hallazgo clave (bloqueante)

Aunque el Swagger marca `TransaccionProductoItems.iva` como requerido, en la práctica Xubio devolvió:

- `400 FunctionalException`
- `description`: **"El iva para cada item producto debe ser vacío"**

### Regla real aplicada (para que funcione)

- En cada ítem de `transaccionProductoItems`, **NO enviar el campo `iva`** (omitirlo del JSON).
- Con eso, la facturación resultó **exitosa**.

## Payload mínimo de prueba (resumen)

Objetivo: armar un `ComprobanteVentaBean` “mínimo para prueba”.

- **`externalId`**: string numérico aleatorio (12 dígitos) para diagnóstico.
  - Nota: para producción conviene que sea estable (ej: RowKey AppSheet / ID de fila).
- **`vendedor`**: “vacío pero válido” (objeto presente con valores vacíos/0).
- **`cantComprobantesEmitidos` / `cantComprobantesCancelados`**: `0`.
- **`mailEstado`**: `"No Enviado"`.
- **`nombre`**: `""` (vacío).
- **`numeroDocumento`**: `""` (vacío).
- **`provincia`**: se obtuvo desde `GET /clienteBean/{clienteId}` (campo `provincia`).
- **`centroDeCosto`**: se obtuvo desde `GET /centroDeCostoBean?activo=1` y se usó el primero activo (o por filtro).

### Estructura (ejemplo)

```json
{
  "externalId": "123456789012",
  "tipo": 1,
  "cliente": { "ID": 8157173, "id": 8157173, "nombre": "" },
  "fecha": "2026-01-02",
  "fechaVto": "2026-01-02",
  "puntoVenta": { "ID": 212819, "id": 212819, "nombre": "", "codigo": "" },
  "numeroDocumento": "",
  "condicionDePago": 1,
  "deposito": { "ID": -2, "id": -2, "nombre": "Depósito Universal", "codigo": "DEPOSITO_UNIVERSAL" },
  "cotizacion": 1,
  "provincia": { "provincia_id": 1, "codigo": "", "nombre": "", "pais": "" },
  "cotizacionListaDePrecio": 1,
  "listaDePrecio": { "ID": 15386, "id": 15386, "nombre": "", "codigo": "" },
  "vendedor": { "vendedorId": 0, "nombre": "", "apellido": "" },
  "porcentajeComision": 0,
  "mailEstado": "No Enviado",
  "descripcion": "",
  "cbuinformada": false,
  "facturaNoExportacion": false,
  "cantComprobantesEmitidos": 0,
  "cantComprobantesCancelados": 0,
  "nombre": "",
  "transaccionProductoItems": [
    {
      "producto": { "ID": 2751338, "id": 2751338 },
      "centroDeCosto": { "ID": 57329, "id": 57329, "nombre": "", "codigo": "" },
      "deposito": { "ID": -2, "id": -2, "nombre": "Depósito Universal", "codigo": "DEPOSITO_UNIVERSAL" },
      "descripcion": "TEST /facturar - diagnóstico",
      "cantidad": 1,
      "precio": 490,
      "importe": 490,
      "total": 592.9,
      "montoExento": 0,
      "porcentajeDescuento": 0,
      "precioconivaincluido": 0
      // IMPORTANTE: NO incluir "iva"
    }
  ],
  "transaccionPercepcionItems": [],
  "transaccionCobranzaItems": []
}
```

## Implicancias / próximos pasos recomendados

- **No confiar ciegamente en `required` del Swagger** para `/facturar`: hay validaciones “funcionales” que piden campos vacíos u omitidos.
- Definir una política de **idempotencia**:
  - `externalId` debería venir de la Sheet/AppSheet (estable), no aleatorio.
- Definir cómo resolver **`vendedor`**:
  - hoy se envía “vacío válido” para pruebas; para producción conviene obtener uno real (lookup `GET /vendedorBean`) y cachearlo.

