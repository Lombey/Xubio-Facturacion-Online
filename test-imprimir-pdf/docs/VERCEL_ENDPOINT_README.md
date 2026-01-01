# Endpoint Vercel - Xubio Facturación

Endpoint serverless que permite a Apps Script crear facturas en Xubio usando login automatizado con Playwright.

---

## 🎯 Contexto

**Problema**: OAuth de Xubio NO funciona para crear facturas (documentado: 5 intentos fallidos con NullPointerException)

**Solución**: Endpoint serverless en Vercel que:
1. Hace login con usuario/contraseña usando Playwright
2. Obtiene cookies de sesión
3. Construye XML Legacy (template GOLD)
4. Hace POST a `/NXV/DF_submit` con cookies

**Stack**:
- Vercel Serverless Functions (Node.js)
- Playwright (browser automation)
- Template XML Legacy GOLD

---

## 📁 Estructura de Archivos

```
test-imprimir-pdf/
├── api/
│   ├── crear-factura.js           # Endpoint principal
│   ├── test-login.js               # Endpoint de prueba
│   └── utils/
│       ├── browserLogin.js         # Lógica Playwright
│       └── buildXMLPayload.js      # Construcción XML
├── package.json                    # Dependencies (playwright-aws-lambda)
├── vercel.json                     # Config serverless
└── docs/
    ├── ENV_VARS.md                 # Variables de entorno
    └── VERCEL_ENDPOINT_README.md   # Este archivo
```

---

## 🚀 Deployment

### Prerequisitos

1. **Proyecto en Vercel**: Conectar repo a Vercel
2. **Credenciales Xubio**: Usuario y contraseña

### Paso 1: Instalar Dependencias

```bash
cd test-imprimir-pdf
npm install
```

Esto instalará:
- `playwright-core@^1.40.0`
- `playwright-aws-lambda@^0.10.0`

### Paso 2: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agregar:

| Variable | Valor |
|----------|-------|
| `XUBIO_USERNAME` | `martin.lombardi@gmail.com` |
| `XUBIO_PASSWORD` | `Corvus"22` |

**IMPORTANTE**: Marcar para `Production`, `Preview`, `Development`

Ver detalles completos en: [`docs/ENV_VARS.md`](./ENV_VARS.md)

### Paso 3: Deploy

#### Opción A: Desde Git (Recomendado)

1. Hacer commit de todos los archivos
2. Push a GitHub/GitLab
3. Vercel auto-deploys

```bash
git add .
git commit -m "feat: Endpoint Vercel para crear facturas con Playwright"
git push origin main
```

#### Opción B: Desde CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Paso 4: Validar Deployment

Una vez deployado, probar los endpoints:

**Test de Login:**
```bash
curl -X POST https://tu-app.vercel.app/api/test-login
```

**Test de Factura:**
```bash
curl -X POST https://tu-app.vercel.app/api/crear-factura \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 8157173,
    "clienteNombre": "2MCAMPO",
    "provinciaId": 1,
    "provinciaNombre": "Buenos Aires",
    "localidadId": 147,
    "localidadNombre": "Saladillo",
    "cantidad": 1
  }'
```

---

## 📡 API Reference

### POST `/api/test-login`

Endpoint de prueba para validar login con Playwright.

**Request:**
```http
POST /api/test-login
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "cookiesCount": 5,
    "cookiesValid": true,
    "cookieHeader": "cookie1=value1; cookie2=value2...",
    "cookies": [
      {
        "name": ".AspNetCore.Cookies",
        "domain": ".xubio.com",
        "httpOnly": true,
        "secure": true
      }
    ]
  }
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Login falló - No se redirigió a xubio.com"
}
```

---

### POST `/api/crear-factura`

Endpoint principal para crear facturas en Xubio.

**Request:**
```http
POST /api/crear-factura
Content-Type: application/json

{
  "clienteId": 8157173,
  "clienteNombre": "2MCAMPO",
  "provinciaId": 1,
  "provinciaNombre": "Buenos Aires",
  "localidadId": 147,
  "localidadNombre": "Saladillo",
  "cantidad": 1
}
```

**Parámetros:**
| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `clienteId` | number | ID del cliente en Xubio | ✅ Sí |
| `clienteNombre` | string | Nombre del cliente | ✅ Sí |
| `provinciaId` | number | ID de provincia | ✅ Sí |
| `provinciaNombre` | string | Nombre de provincia | ✅ Sí |
| `localidadId` | number | ID de localidad | ✅ Sí |
| `localidadNombre` | string | Nombre de localidad | ✅ Sí |
| `cantidad` | number | Cantidad de productos (default: 1) | ❌ No |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Factura creada exitosamente",
  "data": {
    "transaccionId": "67750488",
    "numeroDocumento": "A-00004-00001680",
    "total": 593.9,
    "pdfUrl": "https://xubio.com/NXV/transaccion/ver/67750488",
    "cotizacion": 1455,
    "cantidad": 1
  }
}
```

**Error (400):**
```json
{
  "error": "Missing parameters",
  "message": "Faltan parámetros requeridos: ..."
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Login falló: ..."
}
```

---

## 🔌 Integración con Apps Script

Una vez deployado el endpoint, modificar Apps Script para usarlo:

### Código Apps Script

```javascript
/**
 * Crea factura usando endpoint Vercel (en lugar de OAuth directo)
 */
function crearFacturaViaVercel(cliente, cantidad = 1) {
  const url = 'https://tu-app.vercel.app/api/crear-factura';

  const payload = {
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    provinciaId: cliente.provinciaId,
    provinciaNombre: cliente.provinciaNombre,
    localidadId: cliente.localidadId,
    localidadNombre: cliente.localidadNombre,
    cantidad: cantidad
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('📤 Llamando a endpoint Vercel...');

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('📥 Response Code: ' + responseCode);
  Logger.log('📥 Response: ' + responseText);

  if (responseCode !== 200) {
    throw new Error('Error al crear factura vía Vercel: ' + responseText);
  }

  const resultado = JSON.parse(responseText);

  if (!resultado.success) {
    throw new Error('Error: ' + resultado.error);
  }

  return resultado.data;
}

/**
 * Test con endpoint Vercel
 */
function testCrearFacturaVercel() {
  const cliente = {
    id: 8157173,
    nombre: '2MCAMPO',
    provinciaId: 1,
    provinciaNombre: 'Buenos Aires',
    localidadId: 147,
    localidadNombre: 'Saladillo'
  };

  const resultado = crearFacturaViaVercel(cliente, 1);

  Logger.log('✅ Factura creada exitosamente');
  Logger.log('TransaccionID: ' + resultado.transaccionId);
  Logger.log('Número: ' + resultado.numeroDocumento);
  Logger.log('PDF: ' + resultado.pdfUrl);
}
```

---

## ⚙️ Configuración Técnica

### vercel.json

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

**Explicación**:
- `memory: 3008`: Máxima memoria (Playwright necesita ~2GB)
- `maxDuration: 60`: Timeout de 60 segundos (login + factura ~10-15s)

### package.json

```json
{
  "dependencies": {
    "playwright-core": "^1.40.0",
    "playwright-aws-lambda": "^0.10.0"
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Missing credentials"

**Causa**: Variables de entorno no configuradas

**Solución**:
1. Ir a Vercel Dashboard → Settings → Environment Variables
2. Agregar `XUBIO_USERNAME` y `XUBIO_PASSWORD`
3. Marcar para todos los environments
4. Redeploy

### Error: "Login failed"

**Causa**: Credenciales incorrectas o Visma Connect bloqueó IP

**Solución**:
1. Validar credenciales con login manual en xubio.com
2. Revisar logs de Vercel: `vercel logs`
3. Verificar que no haya captcha o 2FA habilitado

### Error: "Error de Xubio: NullPointerException"

**Causa**: XML incompleto o campos faltantes

**Solución**:
1. Validar que template GOLD esté completo en `buildXMLPayload.js`
2. Revisar logs del payload XML generado
3. Comparar con template GOLD original

### Error: "Function timeout"

**Causa**: Playwright tarda mucho en arrancar

**Solución**:
1. Verificar que `memory: 3008` en `vercel.json`
2. Aumentar `maxDuration` si es necesario
3. Considerar cachear cookies (Fase 5 del plan)

### Logs de Vercel

Ver logs en tiempo real:
```bash
vercel logs --follow
```

Ver logs de una función específica:
```bash
vercel logs --filter "crear-factura"
```

---

## 📊 Performance

**Sin cache (login por request)**:
- Latencia: ~10-15 segundos
- Breakdown:
  - Playwright launch: ~3s
  - Login: ~4-6s
  - POST Xubio: ~2-3s
  - Parsing: ~0.5s

**Con cache (Fase 5 - opcional)**:
- Latencia: ~2-3 segundos
- Login solo 1 vez cada 1 hora

---

## 🔒 Seguridad

**Recomendaciones**:
- ✅ Credenciales solo en env vars de Vercel
- ✅ Nunca commitear credenciales en código
- ✅ Rotar credenciales periódicamente
- ✅ Usar cuenta Xubio con permisos mínimos
- ⚠️ Considerar agregar API Key al endpoint para restringir acceso

---

## 🚀 Optimizaciones Futuras (Fase 5 - Opcional)

### Cache de Cookies con Vercel KV

Si la latencia es un problema, implementar cache:

1. Activar Vercel KV en dashboard
2. Instalar `@vercel/kv`:
   ```bash
   npm install @vercel/kv
   ```
3. Modificar `browserLogin.js`:
   ```javascript
   import { kv } from '@vercel/kv';

   export async function loginToXubioWithCache(credentials) {
     // Intentar obtener cookies de cache
     const cached = await kv.get('xubio_session_cookies');

     if (cached) {
       const isValid = await validateCookies(cached);
       if (isValid) {
         return cached; // Cookies aún válidas
       }
     }

     // Login y cachear por 1 hora
     const cookies = await loginToXubio(credentials);
     await kv.set('xubio_session_cookies', cookies, { ex: 3600 });

     return cookies;
   }
   ```

**Beneficio**: Reduce latencia de ~12s a ~2s

---

## ✅ Checklist de Deploy

- [ ] `package.json` con dependencies instaladas
- [ ] `vercel.json` con config de memory y timeout
- [ ] Variables `XUBIO_USERNAME` y `XUBIO_PASSWORD` en Vercel
- [ ] Código commiteado y pusheado a repo
- [ ] Deploy automático exitoso (o `vercel --prod`)
- [ ] Test `/api/test-login` retorna 200 OK
- [ ] Test `/api/crear-factura` retorna 200 OK con transaccionId
- [ ] Logs de Vercel muestran flujo completo sin errores

---

**Última actualización**: 2025-12-31
**Versión**: 1.0.0
**Estado**: ✅ Listo para deployment
