# Xubio API - Aplicación Web de Testing

Aplicación web para probar y gestionar la API de Xubio, incluyendo generación de facturas, cobranzas y obtención de PDFs.

## 🎯 Fase 1: Aplicación Web (ACTUAL)

Aplicación web desplegada en **Vercel** para testing y gestión de la API de Xubio.

### 🚀 Despliegue

La aplicación está configurada para funcionar en **Vercel** con **auto-deploy** en cada push.

#### Primera Vez (Configuración Inicial)

1. **Conectar repositorio a Vercel** (solo una vez):
   - Ve a https://vercel.com
   - Haz clic en "Add New Project"
   - Importa el repositorio `Lombey/Xubio-Facturacion-Online` (o el tuyo)
   - Vercel detectará automáticamente la configuración desde `vercel.json`
   - Haz clic en "Deploy"

2. **Configuración automática**:
   - Vercel detecta `vercel.json` y configura el routing automáticamente
   - Los endpoints `/api/*` se configuran como serverless functions
   - La app se despliega en tu dominio de Vercel (ej: `tu-app.vercel.app`)

#### Despliegues Automáticos (Después de la Primera Vez)

**✅ Cada push a la rama principal despliega automáticamente:**

```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción de los cambios"
git push origin main  # o master, según tu rama principal
```

**Vercel automáticamente:**
- Detecta el push
- Ejecuta el build (si es necesario)
- Despliega la nueva versión
- La app queda disponible en ~1-2 minutos

**Ver el estado del deploy:**
- Ve a tu dashboard de Vercel
- Verás el estado de cada deploy (Building → Ready)
- Puedes ver los logs si hay errores

#### Credenciales

- Las credenciales están en `.xubio-credentials.md` (no se sube a git - está en `.gitignore`)
- Después del primer deploy, copia las credenciales en la aplicación web
- Opcionalmente, marca "Guardar credenciales" para no tener que ingresarlas cada vez

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
- Cuenta de Vercel (para despliegue)
- Credenciales de Xubio (ver `.xubio-credentials.md`)

### Opciones para Probar la Aplicación

#### Opción 1: Probar Directamente en Producción (Recomendado) ✅

**No necesitas Vercel CLI** - Simplemente despliega en Vercel:

1. **Conectar repositorio a Vercel**:
   - Ve a https://vercel.com
   - Importa tu repositorio
   - Vercel detectará automáticamente la configuración desde `vercel.json`

2. **La app se desplegará automáticamente** en tu dominio de Vercel

3. **Probar directamente en producción**:
   - Abre la URL de tu app en Vercel
   - Ingresa las credenciales desde `.xubio-credentials.md`
   - Todo funciona igual que en local

**Ventajas:**
- ✅ No necesitas instalar nada
- ✅ Los endpoints de API funcionan perfectamente
- ✅ Es el mismo entorno que usarán los usuarios

#### Opción 2: Desarrollo Local con Vercel CLI (Opcional)

**Solo si quieres probar localmente antes de desplegar:**

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Iniciar servidor local**:
   ```bash
   vercel dev
   ```

3. **La aplicación estará en** `http://localhost:3000`

**Cuándo usar esta opción:**
- Si quieres probar cambios antes de hacer commit
- Si quieres debugging más rápido (sin esperar deploy)
- Si estás desarrollando nuevas funcionalidades

#### Opción 3: Servidor HTTP Simple (Solo Frontend)

**Solo para ver el HTML/CSS/JS, pero los endpoints NO funcionarán:**

```bash
# Con Python (si lo tienes instalado)
cd test-imprimir-pdf
python -m http.server 8000

# O con Node.js http-server
npx http-server test-imprimir-pdf -p 8000
```

**Limitaciones:**
- ❌ Los endpoints `/api/auth` y `/api/proxy` NO funcionarán
- ❌ No podrás probar autenticación ni requests a Xubio
- ✅ Solo útil para verificar estilos y estructura HTML

### Recomendación

**Para tu caso (testing con 3 usuarios):**
- **Usa la Opción 1** (desplegar directamente en Vercel)
- Es más simple y no necesitas instalar nada
- Los endpoints funcionan perfectamente
- Puedes probar todo directamente en producción

### Verificar que Todo Funciona

**Si usas Opción 1 (Producción en Vercel):**

1. **Frontend carga correctamente**:
   - Abre tu URL de Vercel → Debe cargar la aplicación
   - Verifica que los assets cargan (abre DevTools → Network tab)

2. **Endpoints API funcionan**:
   - Ingresa credenciales y haz clic en "Obtener Token"
   - Debe funcionar correctamente (el token se obtiene)
   - Si hay errores, revisa la consola del navegador

3. **Sin errores en consola**:
   - Abre DevTools (F12) → Console tab
   - No debe haber errores de carga de recursos

**Si usas Opción 2 (Vercel CLI local):**

1. **Frontend carga correctamente**:
   - Abre `http://localhost:3000` → Debe cargar `test-imprimir-pdf/index.html`
   - Verifica que los assets cargan: `http://localhost:3000/assets/styles.css` y `http://localhost:3000/assets/app.js`

2. **Endpoints API funcionan**:
   - `GET /api/proxy/*` → Debe responder (405 para métodos no permitidos)
   - `POST /api/auth` sin body → Debe responder 400 (Missing credentials)
   - `GET /api/auth` → Debe responder 405 (Method not allowed)

### Tecnologías
- **Frontend**: Vue.js 3.4.21 (CDN - versión específica), HTML5, CSS3
- **Backend**: Vercel Serverless Functions (Node.js)
- **Despliegue**: Vercel Platform

### Variables de Entorno

Actualmente no se requieren variables de entorno. Las credenciales se ingresan manualmente desde la aplicación web.

**Nota**: Si en el futuro necesitas configurar variables de entorno en Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las variables necesarias

## 📝 Notas

- **Seguridad**: Las credenciales se procesan en el servidor (`/api/auth`), nunca en el cliente
- Las credenciales pueden guardarse localmente en localStorage (opcional, solo para UX)
- El proxy serverless en Vercel maneja automáticamente los problemas de CORS
- La aplicación crea facturas reales en Xubio, usar con cuidado
- La aplicación usa Vue.js 3.4.21 (versión específica) para reactividad y mejor mantenibilidad
- Logging estructurado en JSON para fácil debugging en Vercel Dashboard

## 🔍 Endpoints Disponibles

### `/api/auth` (POST)
Endpoint seguro para autenticación con Xubio.

**Request:**
```json
{
  "clientId": "tu_client_id",
  "secretId": "tu_secret_id"
}
```

**Response (éxito):**
```json
{
  "access_token": "token_aqui",
  "expires_in": 3600
}
```

**Seguridad:**
- El Basic Auth se construye completamente en el servidor
- Las credenciales nunca se exponen en el cliente
- Logging estructurado para debugging (sin exponer credenciales)

### `/api/proxy/*` (GET, POST, PUT, DELETE)
Proxy genérico para requests a la API de Xubio.

**Uso:**
- `GET /api/proxy/Clientes` → `https://xubio.com/API/1.1/Clientes`
- `POST /api/proxy/Facturas` → `https://xubio.com/API/1.1/Facturas`

**Headers automáticos:**
- `Authorization: Bearer {token}` (si está disponible)
- `Accept: application/json`
- CORS configurado automáticamente
