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

## 🚀 Estrategia de Desarrollo Actual: "Ingeniería Inversa del Éxito"

Para resolver el error genérico `FunctionalException` de Xubio y asegurar una integración estable, estamos siguiendo este procedimiento:

1.  **Análisis de Factura Existente**: Consultar vía API una factura creada manualmente en la UI de Xubio que haya sido exitosa. Esto nos proporciona el "JSON de Oro" (el molde perfecto) con todos los campos obligatorios ocultos.
2.  **Enriquecimiento Automático**: El endpoint de Vercel consultará el perfil del cliente (`/clienteBean/{id}`) antes de facturar para obtener automáticamente su ubicación (provincia/localidad), CUIT y condición fiscal. Esto reduce la carga de datos en Google Sheets y evita errores de discrepancia.
3.  **Construcción Dinámica**: El payload final se construye imitando el molde exitoso pero inyectando los datos dinámicos del Sheets (Producto, Cantidad, Precio).

---

## 📁 Estructura del Proyecto

- `api/`: Funciones serverless de Vercel (Auth, Proxy, Crear Factura).
- `sdk/`: Lógica compartida para interactuar con Xubio.
- `apps-script/`: Código para copiar en el editor de Google Apps Script.

## 📝 Endpoints Principales

- `POST /api/auth`: Gestiona el token de acceso oficial.
- `POST /api/crear-factura`: Procesa la creación de facturas (Usa Bearer Token).
- `ANY /api/proxy`: Proxy para peticiones genéricas a la API de Xubio.
