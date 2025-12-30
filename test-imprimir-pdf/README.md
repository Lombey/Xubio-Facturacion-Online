# Test Xubio - Imprimir PDF

Aplicación HTML simple para probar el endpoint `/imprimirPDF` de la API de Xubio y determinar los valores válidos del parámetro `tipoimpresion`.

## 🚀 Uso

### ⚠️ IMPORTANTE: Problema de CORS

La API de Xubio **NO permite peticiones directas desde navegadores** (ni localhost ni otros dominios). Por eso necesitas usar el **servidor proxy incluido**.

### Opción 1: Servidor Proxy (RECOMENDADO) ✅

El servidor proxy actúa como intermediario y evita problemas de CORS.

**Windows:**
```bash
# Doble clic en start-server-proxy.bat
# O desde terminal:
cd test-imprimir-pdf
python server-proxy.py
```

**Mac/Linux:**
```bash
cd test-imprimir-pdf
python3 server-proxy.py
```

Luego abre: `http://localhost:8000/index.html`

El servidor proxy:
- ✅ Sirve los archivos estáticos (HTML, CSS, JS)
- ✅ Hace las peticiones a Xubio desde el servidor (sin CORS)
- ✅ Devuelve las respuestas al navegador con CORS habilitado

### Opción 2: Servidor Simple (NO funciona por CORS)

Si usas `python -m http.server 8000`, seguirás teniendo errores de CORS porque Xubio bloquea peticiones desde navegadores.

### Opción 3: Extensión CORS (solo para desarrollo)

Puedes instalar "CORS Unblock" o "Allow CORS" en Chrome, pero **el servidor proxy es la solución correcta**.

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

4. **Obtener PDF de Comprobante Existente**:
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

- **No compartas tus credenciales**: Este es un archivo HTML estático, no envíes credenciales a ningún servidor externo
- **Facturas de prueba**: La opción de crear factura crea facturas reales en Xubio, úsala con cuidado
- **CORS**: Si hay problemas de CORS, puedes usar una extensión del navegador o ejecutar un servidor local simple

## 🔧 Solución de problemas CORS

Si encuentras errores de CORS, puedes:

1. **Usar un servidor local simple**:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (con http-server)
   npx http-server
   ```

2. **Usar una extensión del navegador** que deshabilite CORS (solo para desarrollo)

3. **Probar desde GitHub Pages** (si lo subes a un repo)

## 📝 Resultados esperados

Una vez que determines qué valores de `tipoimpresion` funcionan, documenta:
- Valores válidos encontrados
- Qué representa cada valor (si es posible determinarlo)
- Errores específicos para valores inválidos

