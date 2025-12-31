# Xubio API Laboratory (Proof of Concept)

> ⚠️ **NOTA IMPORTANTE**: Este NO es un producto final. Es un entorno experimental para validar payloads antes de implementar en producción (AppSheet/Google Apps Script).

Este repositorio es un **Laboratorio de Pruebas** diseñado para realizar ingeniería inversa y pinpointing exacto de los endpoints de la API de Xubio.

**Objetivo Principal**: Descubrir y validar la estructura exacta de datos (JSON) necesaria para realizar Facturas y Cobranzas en Xubio, con el fin de replicar esta lógica en un sistema externo (**AppSheet / Google Apps Script**).

---

## 🧪 Propósito del Proyecto

1. **Pinpointing de API**: Identificar qué campos son obligatorios, opcionales y cuáles causan errores silenciosos en la API de Xubio.
2. **Entregable de Referencia**: Crear una librería JavaScript pura (`/sdk`) que sirva como "Verdad Absoluta" sobre cómo hablar con Xubio.
3. **Validación Visual**: Utilizar la interfaz en Vue.js simplemente como un "control remoto" rápido para ejecutar pruebas y ver resultados (PDFs, JSONs de respuesta) en tiempo real.

---

## 🔬 Anatomía del Experimento

El valor real del proyecto reside en la carpeta `test-imprimir-pdf/sdk/`, la cual está diseñada para ser agnóstica a la interfaz:

- **`sdk/xubioClient.js`**: Cliente base para autenticación y peticiones.
- **`sdk/facturaService.js`**: Lógica de construcción de payloads para facturación.
- **`sdk/cobranzaService.js`**: Lógica de construcción de payloads para cobranzas (En desarrollo).

---

## 🚀 Cómo usar este Laboratorio

1. **Credenciales**: Ingresa tu `Client ID` y `Secret ID` en la UI (obtenidos de Xubio).
2. **Obtener Token**: Valida que la conexión es exitosa.
3. **Pruebas de Facturación**: 
   - Selecciona cliente y productos.
   - Observa el JSON generado antes de enviar.
   - Envía y verifica si Xubio acepta el payload.
4. **Inspección**: Si algo falla, revisa el log de diagnóstico integrado para ver qué campo está causando el rechazo.

---

## 📁 Estructura del Repositorio

```
├── sdk/                # CEREBRO: Lógica portable para AppSheet/Node.js
├── api/                # Proxy Serverless para evitar CORS (Vercel)
├── test-imprimir-pdf/  # UI de Laboratorio (Vue.js + Vite)
└── docs/               # Análisis detallado de campos y flujos
```

---

## ❌ Qué NO es este Proyecto

- ❌ **No es una aplicación de producción**: Es un entorno controlado para experimentos.
- ❌ **No es un cliente completo de Xubio**: Solo implementa lo necesario para facturación y cobranzas.
- ❌ **No reemplaza la UI oficial de Xubio**: La interfaz Vue es solo un panel de control temporal para pruebas.
- ❌ **No está optimizado para usuarios finales**: El foco está en validar payloads, no en UX.

---

## 🔮 Destino Final: AppSheet
Una vez validada una funcionalidad en este laboratorio, el código del `sdk/` está preparado para ser copiado y adaptado a un entorno de **Google Apps Script** que servirá de puente para automatizaciones en AppSheet.

---

## 🛠️ Tecnologías
- **Frontend**: Vue.js 3 (Standalone).
- **Backend**: Vercel Functions (Proxy).
- **Logic**: JavaScript ES6 puro (SDK).