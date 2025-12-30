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
│   ├── index.html          # Aplicación web principal
│   └── README.md           # Documentación de la app
├── api/
│   └── proxy.js            # Proxy serverless para evitar CORS
├── vercel.json             # Configuración de Vercel
└── .xubio-credentials.md   # Credenciales (gitignored)
```

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

## 📝 Notas

- Las credenciales se almacenan localmente y nunca se suben al repositorio
- El proxy serverless en Vercel maneja automáticamente los problemas de CORS
- La aplicación crea facturas reales en Xubio, usar con cuidado
