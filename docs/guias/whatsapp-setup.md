# Guía: Integración WhatsApp Business Cloud API (Modo Híbrido)

Esta guía detalla los pasos para configurar la API oficial de WhatsApp manteniendo el uso de la aplicación móvil en el mismo número, permitiendo la automatización de facturas desde el backend de Vercel.

## 1. Registro en Meta for Developers

1. Accede a [developers.facebook.com](https://developers.facebook.com/).
2. Haz clic en **"Mis aplicaciones"** > **"Crear aplicación"**.
3. Selecciona el tipo de aplicación **"Empresa"** (Business).
4. Asigna un nombre (Ej: `Xubio-Automation-Suite`). Evita usar la palabra "WhatsApp" en el nombre.
5. Selecciona tu **Cuenta Comercial de Meta** (Business Manager) o crea una nueva.

## 2. Configuración del Producto WhatsApp

1. En el panel de la aplicación, busca **WhatsApp** y haz clic en **"Configurar"**.
2. Acepta los términos y condiciones.
3. Ve a **WhatsApp** > **Configuración de la API**.
4. Verás un "Número de prueba". Úsalo para los primeros tests antes de vincular tu número real.

## 3. Configuración del "Modo Híbrido" (Coexistencia)

Para usar el mismo número en el celular y la API:

1. Asegúrate de que el número que vas a usar ya esté registrado en la **App WhatsApp Business** en tu celular.
2. En el panel de Meta, ve a **Configuración de la API** > **Añadir número de teléfono**.
3. Sigue los pasos de verificación.
4. **IMPORTANTE:** Durante el proceso, selecciona la opción que permite la coexistencia si Meta te la solicita. Los mensajes enviados por la API aparecerán en tu historial del celular.

## 4. Credenciales Críticas para Vercel

Guarda estos valores, los configuraremos en las variables de entorno de Vercel:

- **Phone Number ID:** Identificador único del número.
- **WABA ID (WhatsApp Business Account ID):** ID de la cuenta de negocio.
- **Access Token:** Para desarrollo usa el temporal. Para producción, genera un **System User Access Token** perpetuo en el Business Manager.

## 5. Plantillas de Mensajes (Templates)

Meta requiere que los mensajes iniciados por la API sigan una estructura aprobada para evitar spam.

1. Ve a **WhatsApp** > **Plantillas de mensajes**.
2. Crea una plantilla de tipo **"Utilidad"** (Utility).
3. Ejemplo de cuerpo:
   > "Hola {{1}}, adjuntamos la factura electrónica de tu compra {{2}}. ¡Gracias por elegirnos!"
4. Una vez aprobada (tarda de 1 a 24hs), podrás usarla desde el código.

## 6. Lógica en el Backend (Próximos Pasos)

El flujo final en el repositorio será:

1. Xubio crea la factura.
2. Recuperamos el PDF.
3. El backend llama al endpoint de Meta `https://graph.facebook.com/v21.0/{phone-number-id}/messages`.
4. El mensaje llega al cliente y queda registrado en tu celular.

---
*Creado por Antigravity - Enero 2026*
