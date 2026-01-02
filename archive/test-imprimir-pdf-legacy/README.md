# Test Xubio - Imprimir PDF

Aplicación web moderna para probar el endpoint `/imprimirPDF` de la API de Xubio y determinar los valores válidos del parámetro `tipoimpresion`.

## 🚀 Despliegue en Vercel

Esta aplicación está configurada para funcionar en **Vercel**. 

### Configuración

1. Conecta tu repositorio GitHub a Vercel
2. Vercel detectará automáticamente la configuración desde `vercel.json`
3. La aplicación se desplegará automáticamente en cada push

### URLs

- **Producción**: Se despliega automáticamente en tu dominio de Vercel
- El proxy API está en `/api/proxy` y se configura automáticamente
- El endpoint de autenticación está en `/api/auth`

## 🏗️ Arquitectura

La aplicación está construida con:

- **Frontend**: Vue.js 3 (via CDN) para reactividad y gestión de estado
- **Estilos**: CSS modular en `assets/styles.css`
- **Lógica**: JavaScript modular en `assets/app.js` con Vue 3
- **Backend**: 
  - `/api/proxy`: Proxy serverless para requests a Xubio API
  - `/api/auth`: Endpoint seguro para autenticación (Basic Auth construido en servidor)

### Seguridad

- ✅ Las credenciales **nunca** se construyen en el cliente
- ✅ El Basic Auth se construye completamente en el servidor (`/api/auth`)
- ✅ Las credenciales viajan por HTTPS al servidor
- ✅ El servidor no expone credenciales en las respuestas
- ⚠️ Opcionalmente, las credenciales pueden guardarse en localStorage (solo para UX)

## 🔐 Credenciales

Las credenciales de Xubio están almacenadas en el archivo `.xubio-credentials.md` en la raíz del proyecto.

**⚠️ IMPORTANTE:** Este archivo está en `.gitignore` y NO se sube al repositorio por seguridad.

**Primera vez:**
1. Abre el archivo `.xubio-credentials.md` (está en la raíz del proyecto)
2. Copia el Client ID y Secret ID
3. Pégalos en los campos correspondientes de la aplicación web
4. Marca el checkbox "Guardar credenciales en localStorage" para no tener que ingresarlas cada vez

## 📋 Funcionalidades

1. **Autenticación**: 
   - Obtener token de acceso con Client ID y Secret ID
   - Guardar credenciales en localStorage (opcional)
   - Renovación automática de token cuando expira
   - Gestión segura de credenciales (procesadas en servidor)

2. **Flujo Completo - Factura**:
   - Crear factura en Xubio
   - Obtener PDF automáticamente después de crear
   - Visualizar PDF en iframe
   - Descargar PDF

3. **Flujo Completo - Cobranza**:
   - Crear cobranza asociada a una factura
   - Obtener PDF automáticamente después de crear
   - Visualizar PDF en iframe
   - Descargar PDF

4. **Listar Facturas**:
   - Ver facturas del último mes
   - Seleccionar facturas para usar sus IDs
   - Tabla interactiva con Vue.js

5. **Obtener PDF de Comprobante Existente**:
   - Probar el endpoint `/imprimirPDF` con diferentes valores de `tipoimpresion`
   - Visualizar y descargar PDFs
   - Botones rápidos para valores comunes

## 🧪 Cómo probar `tipoimpresion`

1. Obtén un `transaccionId` de una factura o cobranza existente
2. Prueba con diferentes valores:
   - Botones rápidos: 1, 2, 3, 0
   - O ingresa manualmente cualquier número
3. Observa la respuesta:
   - ✅ Si funciona: verás la `urlPdf` en la respuesta
   - ❌ Si falla: verás el error específico

## 💻 Desarrollo

### Estructura de Archivos

```
test-imprimir-pdf/
├── index.html              # HTML principal (con Vue.js)
├── assets/
│   ├── app.js              # Lógica Vue 3 (componente principal)
│   └── styles.css          # Estilos CSS
└── docs/
    ├── API_Xubio.md        # Documentación de la API
    └── REFACTOR_PLAN.md    # Plan de refactorización completado
```

### Tecnologías Utilizadas

- **Vue.js 3**: Framework reactivo para gestión de estado y UI
- **Vanilla JavaScript**: Sin build step, usando Vue via CDN
- **CSS3**: Estilos modernos y responsive
- **Vercel Serverless**: Backend sin servidor

### Características Técnicas

- **Reactividad**: Estado centralizado con Vue.js 3
- **Modularidad**: Separación de HTML, CSS y JavaScript
- **Manejo de Errores**: Función centralizada `handleError()`
- **Loading States**: Indicadores visuales de carga
- **UX Mejorada**: Botones deshabilitados durante operaciones
- **JSDoc**: Documentación inline en funciones principales

## ⚠️ Notas de Seguridad

- **✅ Seguro**: Las credenciales se procesan en el servidor (`/api/auth`)
- **✅ Seguro**: El Basic Auth nunca se construye en el cliente
- **⚠️ Opcional**: Las credenciales pueden guardarse en localStorage (solo para comodidad, no crítico)
- **✅ Seguro**: Todas las comunicaciones son por HTTPS
- **✅ Seguro**: El servidor no expone credenciales en logs o respuestas

## 📝 Resultados esperados

Una vez que determines qué valores de `tipoimpresion` funcionan, documenta:
- Valores válidos encontrados
- Qué representa cada valor (si es posible determinarlo)
- Errores específicos para valores inválidos

## 🔄 Historial de Refactorización

La aplicación ha sido completamente refactorizada siguiendo el plan en `docs/REFACTOR_PLAN.md`:

1. ✅ **Slice 1**: Modularización básica (separación HTML/CSS/JS)
2. ✅ **Slice 2**: Hardening de seguridad (autenticación en servidor)
3. ✅ **Slice 3**: Migración a Vue.js (reactividad y estado)
4. ✅ **Slice 4**: Refinamiento de UX (loading states, error handling, JSDoc)
