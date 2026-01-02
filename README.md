# Sheets con Xubio - API Centralizada (Vercel)

Este proyecto es una infraestructura de API serverless para conectar Google Sheets (Apps Script) con Xubio para la creación de facturas.

## 🚀 Arquitectura Actual

El sistema utiliza exclusivamente **Vercel Functions** (Node.js) para procesar las peticiones. 

1.  **Apps Script**: Interfaz en Google Sheets que envía datos de facturación.
2.  **Vercel API**: Endpoints que gestionan la autenticación oficial y el envío de datos a Xubio.
3.  **Xubio API**: Backend final donde se procesan las facturas.

## ⚠️ Nota sobre Fly.io y Puppeteer (Dead End)

Se intentó implementar un servicio de login automatizado con Puppeteer + Stealth en Fly.io para obtener cookies de sesión (necesarias para el método XML Legacy). Sin embargo, esta vía fue **descartada** debido a:
- **Bloqueos de Visma Connect**: Los firewalls detectan las IPs de datacenters (Brasil, Chile, USA) y muestran una "Interrupción masiva del sistema" falsa para bloquear bots.
- **Inestabilidad de red**: Problemas de resolución DNS y timeouts constantes en entornos serverless.

**Enfoque Actual:** Uso de la **API Oficial de Xubio (OAuth2 / Bearer Token)** integrada directamente en Vercel.

## 🛠️ Configuración en Vercel

Se deben configurar las siguientes variables de entorno en el dashboard de Vercel:

- `XUBIO_CLIENT_ID`: Obtenido en Configuración > Mi cuenta > API.
- `XUBIO_SECRET_ID`: Obtenido en Configuración > Mi cuenta > API.
- `XUBIO_USERNAME`: Email de acceso a Xubio.
- `XUBIO_PASSWORD`: Contraseña de acceso a Xubio.

## 📁 Estructura del Proyecto

- `api/`: Funciones serverless de Vercel (Auth, Proxy, Crear Factura).
- `sdk/`: Lógica compartida para interactuar con Xubio.
- `apps-script/`: Código para copiar en el editor de Google Apps Script.

## 📝 Endpoints Principales

- `POST /api/auth`: Gestiona el token de acceso oficial.
- `POST /api/crear-factura`: Procesa la creación de facturas (Usa Bearer Token).
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
