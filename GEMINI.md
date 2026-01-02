# Gemini Project Memory: Sheets con xubio

## Estado Actual (2 de Enero 2026)
El sistema ha sido refactorizado para eliminar dependencias externas inestables.

### 🚀 Arquitectura Final
- **Backend**: Vercel Serverless (Node.js).
- **Autenticación**: Oficial OAuth2 (Bearer Token) usando ClientID y SecretID.
- **Facturación**: Endpoint `/api/crear-factura` que usa la REST API oficial (`comprobanteVentaBean`).
- **Sincronización**: El payload JSON ha sido sincronizado con el "Golden Template" XML que funcionaba en el navegador (Condición de Pago 7, Puntos de Venta automáticos, etc.).

### 🛑 Lecciones Aprendidas (Dead Ends)
- **Fly.io / Puppeteer**: DESCARTADO. Visma Connect bloquea IPs de datacenters. La simulación de navegador para login es inviable en infraestructura cloud para este caso.
- **XML Legacy via Token**: DESCARTADO. El endpoint `/NXV/DF_submit` no acepta Bearer Tokens, solo cookies de sesión web.

### 🛠️ Herramientas Disponibles
- `api/discovery.js`: Para buscar IDs reales de productos, clientes y puntos de venta desde Apps Script.
- `api/proxy.js`: Para realizar cualquier petición a la API de Xubio sin problemas de CORS.
- `apps-script/XubioVercel.js`: Script definitivo para Google Sheets.

## Variables de Entorno Críticas (Vercel)
- `XUBIO_CLIENT_ID`
- `XUBIO_SECRET_ID`
