# Xubio API - Aplicación Web de Testing

Aplicación web para probar y gestionar la API de Xubio, incluyendo generación de facturas, cobranzas y obtención de PDFs.

## 🎯 Fase 1: Aplicación Web (ACTUAL)

Aplicación web desplegada en **Vercel** para testing y gestión de la API de Xubio.

### 🚀 Despliegue

La aplicación está configurada para funcionar en **Vercel**:

1. **Conectar repositorio**: 
   - Ve a https://vercel.com
   - Importa el repositorio `Lombey/Xubio-Facturacion-Online`
   - Vercel detectará automáticamente la configuración

2. **Credenciales**:
   - Las credenciales están en `.xubio-credentials.md` (no se sube a git)
   - Cópialas en la aplicación web después del despliegue

3. **URL**: La aplicación estará disponible en tu dominio de Vercel

### ✨ Funcionalidades

- **Autenticación**: Obtener y gestionar tokens de acceso
- **Facturas**: Crear facturas y obtener PDFs
- **Cobranzas**: Crear cobranzas asociadas a facturas y obtener PDFs
- **Testing**: Probar diferentes valores de `tipoimpresion` para PDFs
- **Listado**: Ver y seleccionar facturas del último mes

### 📁 Estructura

```
├── test-imprimir-pdf/
│   ├── index.html          # Aplicación web principal (Vue.js)
│   ├── assets/
│   │   ├── app.js          # Lógica de la aplicación (Vue 3)
│   │   └── styles.css      # Estilos CSS
│   ├── docs/
│   │   ├── API_Xubio.md    # Documentación de la API
│   │   └── REFACTOR_PLAN.md # Plan de refactorización
│   └── README.md           # Documentación de la app
├── api/
│   ├── proxy.js            # Proxy serverless para evitar CORS
│   └── auth.js             # Endpoint de autenticación seguro
├── vercel.json             # Configuración de Vercel
└── .xubio-credentials.md   # Credenciales (gitignored)
```

### 🏗️ Arquitectura

La aplicación ha sido refactorizada siguiendo las mejores prácticas:

- **Frontend**: Vue.js 3 (CDN) con reactividad y estado centralizado
- **Backend**: Serverless functions en Vercel
  - `/api/proxy`: Proxy genérico para requests a Xubio API
  - `/api/auth`: Endpoint seguro para autenticación (Basic Auth en servidor)
- **Seguridad**: 
  - Credenciales nunca se construyen en el cliente
  - Autenticación procesada completamente en el servidor
  - Tokens manejados de forma segura
- **Modularidad**: Separación de concerns (HTML, CSS, JS)

## 🔮 Fase 2: Integración con Google Sheets (FUTURO)

**Estado**: Pendiente de implementación

La integración con Google Sheets permitirá:
- Leer datos de consumo desde Google Sheets
- Generar facturas automáticamente
- Procesar cobranzas masivamente
- Gestión de clientes sincronizada

> **Nota**: Esta fase se implementará después de validar la funcionalidad básica en la Fase 1.

## 🔗 Referencias

- [Documentación API Xubio del proyecto](./API_Xubio.md)
- [Documentación oficial Xubio](https://xubio.com/API/documentation/index.html)
- [Requerimientos del proyecto](./requerimientos.md)

## 🔧 Desarrollo Local

### Requisitos
- Node.js (para Vercel CLI opcional)
- Cuenta de Vercel (para despliegue)

### Ejecutar localmente
```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Iniciar servidor de desarrollo
vercel dev
```

### Tecnologías
- **Frontend**: Vue.js 3 (CDN), HTML5, CSS3
- **Backend**: Vercel Serverless Functions (Node.js)
- **Despliegue**: Vercel Platform

## 📝 Notas

- **Seguridad**: Las credenciales se procesan en el servidor (`/api/auth`), nunca en el cliente
- Las credenciales pueden guardarse localmente en localStorage (opcional, solo para UX)
- El proxy serverless en Vercel maneja automáticamente los problemas de CORS
- La aplicación crea facturas reales en Xubio, usar con cuidado
- La aplicación usa Vue.js 3 para reactividad y mejor mantenibilidad
