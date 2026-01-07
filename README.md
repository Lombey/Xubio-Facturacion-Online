# Sheets con Xubio - API Centralizada (Vercel)

Este proyecto es una infraestructura de API serverless para conectar Google Sheets (via AppSheet y Apps Script) con Xubio para la creación de facturas.

## 🚀 Arquitectura Actual

El sistema utiliza una arquitectura de 4 capas para asegurar modularidad y robustez:

1.  **AppSheet**: Interfaz de usuario donde el operador selecciona una fila y presiona el botón para facturar.
2.  **Google Apps Script**: Actúa como un Webhook que recibe la petición de AppSheet, genera un ID único para la transacción, y llama al backend.
3.  **Vercel API**: Endpoints serverless (Node.js) que contienen la lógica pesada:
    - Gestionan la autenticación (OAuth2) con Xubio.
    - Obtienen el precio actualizado del producto desde la lista de precios.
    - Construyen y envían el payload de la factura a Xubio.
    - Solicitan el link de descarga público del PDF.
4.  **Xubio API**: Backend final donde se procesa y almacena la factura.

## ✨ Características Clave del Flujo de Facturación

- **Obtención Dinámica de Precios**: El backend consulta el precio del producto directamente desde la lista de precios de Xubio en tiempo real, asegurando que el valor facturado sea siempre el correcto sin necesidad de actualizarlo en el frontend.
- **Generación de PDF Público**: Después de crear la factura, el sistema solicita a la API de Xubio el link de descarga público del PDF, que se guarda en la hoja de Google Sheets para fácil acceso.
- **Idempotencia Flexible**: Se utiliza un `externalId` único compuesto por el ID de la fila de AppSheet + una marca de tiempo (`idRef-timestamp`). Esto previene duplicados por reintentos accidentales pero permite volver a facturar la misma fila si se necesita (ej: tras anular una factura anterior).
- **Datos Bancarios Automáticos**: Las observaciones de la factura se completan automáticamente en el backend con la información bancaria (CBU, Alias) para facilitar el pago al cliente.

## ⚠️ Nota sobre Fly.io y Puppeteer (Dead End)

Se intentó implementar un servicio de login automatizado con Puppeteer en Fly.io para obtener cookies de sesión. Esta vía fue **descartada** debido a los bloqueos de firewall de Visma Connect en IPs de datacenters. El enfoque actual utiliza exclusivamente la **API Oficial de Xubio (OAuth2)**.

## 🛠️ Configuración en Vercel

Se deben configurar las siguientes variables de entorno en el dashboard de Vercel:

- `XUBIO_CLIENT_ID`: Obtenido en Configuración > Mi cuenta > API.
- `XUBIO_SECRET_ID`: Obtenido en Configuración > Mi cuenta > API.

---

## 📁 Estructura del Proyecto

- `api/`: Funciones serverless de Vercel (Auth, Proxy, Crear Factura).
- `sdk/`: (DEPRECADO) Lógica del cliente XML legacy. La funcionalidad principal está en `api/`.
- `apps-script/`: Código para copiar en el editor de Google Apps Script.

## 📝 Endpoints Principales

- `POST /api/auth`: Gestiona el token de acceso oficial.
- `POST /api/crear-factura`: Procesa la creación de facturas (Usa Bearer Token).
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
- `ANY /api/discovery`: Proxy genérico para endpoints de consulta de Xubio.
