# Gemini Project Memory: Sheets con xubio

## Project Overview
Infraestructura de API para integrar Google Sheets con Xubio.
- **Root Path:** `C:\dev\Sheets con xubio`
- **Plataforma:** Vercel (Node.js Serverless).
- **Status:** Refactorización a API Oficial (Bearer Token).

## ⚠️ Dead Ends
- **Fly.io / Puppeteer:** Descartado el 2 de enero de 2026. Visma Connect bloquea IPs de datacenters (EZE, SCL, GRU, DFW, IAD) mostrando errores de sistema falsos. No es viable mantener sesión vía simulación de navegador en infraestructura cloud para este caso.

## Active Strategy
1.  **Autenticación**: Uso de `api/auth.js` con ClientID y SecretID oficiales.
2.  **Facturación**: Migración de `api/crear-factura.js` para usar el Token de la API oficial.
3.  **Híbrido**: Evaluar si el método XML Legacy funciona con Bearer Token, o si se debe pulir el JSON de la REST API.

## Environment & Secrets
- **Vercel Secrets**: `XUBIO_CLIENT_ID`, `XUBIO_SECRET_ID`, `XUBIO_USERNAME`, `XUBIO_PASSWORD`.
- **SDK**: Localizado en `sdk/`, diseñado para ser modular.

## Key Files
- `api/auth.js`: Punto de entrada para tokens.
- `api/crear-factura.js`: Endpoint principal de negocio.
- `sdk/xubioClient.js`: Cliente base para peticiones autenticadas.