# Test Xubio - Imprimir PDF

Aplicación web para probar el endpoint `/imprimirPDF` de la API de Xubio y determinar los valores válidos del parámetro `tipoimpresion`.

## 🚀 Despliegue en Vercel

Esta aplicación está configurada para funcionar en **Vercel**. 

### Configuración

1. Conecta tu repositorio GitHub a Vercel
2. Vercel detectará automáticamente la configuración desde `vercel.json`
3. La aplicación se desplegará automáticamente en cada push

### URLs

- **Producción**: Se despliega automáticamente en tu dominio de Vercel
- El proxy API está en `/api/proxy` y se configura automáticamente

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

5. **Obtener PDF de Comprobante Existente**:
   - Probar el endpoint `/imprimirPDF` con diferentes valores de `tipoimpresion`
   - Visualizar y descargar PDFs

## 🧪 Cómo probar `tipoimpresion`

1. Obtén un `transaccionId` de una factura o cobranza existente
2. Prueba con diferentes valores:
   - Botones rápidos: 1, 2, 3, 0
   - O ingresa manualmente cualquier número
3. Observa la respuesta:
   - ✅ Si funciona: verás la `urlPdf` en la respuesta
   - ❌ Si falla: verás el error específico

## ⚠️ Notas

- **Seguridad**: Las credenciales NO están hardcodeadas en el código. Se almacenan localmente en `.xubio-credentials.md` (excluido de git) y opcionalmente en localStorage del navegador
- **No compartas tus credenciales**: No subas el archivo `.xubio-credentials.md` al repositorio. Está en `.gitignore`
- **Facturas de prueba**: La opción de crear factura crea facturas reales en Xubio, úsala con cuidado
- **CORS**: La aplicación usa un proxy serverless en Vercel (`/api/proxy`) para evitar problemas de CORS

## 📝 Resultados esperados

Una vez que determines qué valores de `tipoimpresion` funcionan, documenta:
- Valores válidos encontrados
- Qué representa cada valor (si es posible determinarlo)
- Errores específicos para valores inválidos
