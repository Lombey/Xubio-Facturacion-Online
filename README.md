# Xubio Facturación Online

> 🔗 **API en vivo**: [https://xubio-facturacion-online.vercel.app/](https://xubio-facturacion-online.vercel.app/)
> 🚀 **Fly.io Service**: [https://xubio-login.fly.dev/](https://xubio-login.fly.dev/)

Sistema automatizado de facturación para Xubio usando **arquitectura híbrida Vercel + Fly.io**.

**Objetivo Principal**: Crear facturas en Xubio de forma programática desde **AppSheet / Google Apps Script** sin intervención manual.

---

## 🏗️ Arquitectura Híbrida

### Vercel (API Principal)
- Endpoints serverless para crear facturas
- Cliente HTTP para comunicarse con Fly.io
- Cache in-memory de cookies (TTL 55 min)
- Límite: 2048 MB RAM, 60s timeout
- **FREE** - Sin costos

### Fly.io (Login Service)
- Puppeteer + Stealth plugin para evitar detección de bot
- Cache global de cookies (sobrevive a cold starts de Vercel)
- Keep-alive automático cada 30 minutos (mantiene sesión viva)
- Free tier: 256 MB RAM, 1 CPU compartido
- **FREE** - $0/mes permanente

### Flujo Completo

**Primera llamada (cache vacío):**
```
AppSheet/Apps Script
        ↓
Vercel /api/crear-factura
        ↓
getSessionCookies() → Cache miss
        ↓
POST https://xubio-login.fly.dev/login
        ↓
Fly.io: Cache global vacío
        ↓
Puppeteer + Stealth → Login a Visma Connect (60s)
        ↓
Cookies de sesión obtenidas ✅
        ↓
Fly.io: Cachea cookies + activa keep-alive (30 min)
        ↓
Vercel: Cachea cookies (55 min)
        ↓
Construir XML de factura
        ↓
POST a https://xubio.com/NXV/DF_submit
        ↓
Factura creada ✅
```

**Llamadas subsiguientes (< 30 min):**
```
AppSheet/Apps Script
        ↓
Vercel /api/crear-factura
        ↓
getSessionCookies() → Cache hit (Vercel)
        ↓
Construir XML de factura
        ↓
POST a https://xubio.com/NXV/DF_submit
        ↓
Factura creada ✅ (latencia < 2s)
```

**Llamadas después de Vercel cold start (> 15 min inactividad):**
```
AppSheet/Apps Script
        ↓
Vercel /api/crear-factura (cold start - cache perdido)
        ↓
getSessionCookies() → Cache miss (Vercel)
        ↓
POST https://xubio-login.fly.dev/login
        ↓
Fly.io: Cache global HIT (keep-alive mantuvo sesión viva)
        ↓
Cookies retornadas instantáneamente ✅
        ↓
Vercel: Cachea cookies (55 min)
        ↓
Construir XML de factura
        ↓
POST a https://xubio.com/NXV/DF_submit
        ↓
Factura creada ✅ (latencia < 3s)
```

### Keep-Alive Automático (Fly.io)

Fly.io ejecuta un background job cada 30 minutos que:
1. Hace GET a `https://xubio.com/NXV/home` con cookies cacheadas
2. Si respuesta OK → sesión sigue viva, no hace nada
3. Si respuesta 401 → sesión expiró, limpia cache
4. Próxima llamada desde Vercel → Fly.io detecta cache vacío → hace login fresco

**Ventajas:**
- ✅ Sesión de Xubio se mantiene viva indefinidamente
- ✅ Cache global sobrevive a cold starts de Vercel
- ✅ Solo 1 login de Puppeteer por día (vs 1 login cada 15 min sin keep-alive)
- ✅ Latencia < 3s en el 99% de los casos

---

## 📁 Estructura del Repositorio

```
├── api/                    # Vercel Serverless Functions
│   ├── crear-factura.js    # Endpoint principal
│   ├── test-login.js       # Test de login
│   └── utils/
│       ├── flyLogin.js     # Cliente Fly.io
│       ├── cookieCache.js  # Cache de cookies
│       └── buildXMLPayload.js # Constructor XML
│
├── fly-login/              # Fly.io Login Service
│   ├── server.js           # Express + Puppeteer + Stealth
│   ├── Dockerfile          # Container config
│   └── package.json
│
├── apps-script/            # Google Apps Script wrappers
├── sdk/                    # Lógica portable (legacy OAuth)
├── docs/                   # Documentación técnica
└── archive/                # Proyectos archivados
```

---

## 🚀 Deployment

### Vercel (Ya deployado)
```bash
# Auto-deploy desde GitHub main branch
# URL: https://xubio-facturacion-online.vercel.app/
```

### Fly.io (Primera vez)
Ver guía completa: **[DEPLOY_FLY.md](DEPLOY_FLY.md)**

```bash
# 1. Instalar CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Crear app
fly apps create xubio-login --region gru

# 4. Deploy
fly deploy --config fly.toml

# 5. Verificar
fly status
curl https://xubio-login.fly.dev/health
```

---

## 🧪 Testing

### 1. Test Health Check de Fly.io
```bash
curl https://xubio-login.fly.dev/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "service": "xubio-login",
  "timestamp": "2026-01-02T..."
}
```

### 2. Test Login Directo en Fly.io
```bash
curl -X POST https://xubio-login.fly.dev/login \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Nota:** Las credenciales se toman de variables de entorno `XUBIO_USERNAME` y `XUBIO_PASSWORD` en Fly.io.

**Respuesta esperada (primera llamada):**
```json
{
  "success": true,
  "cookies": [ /* 15-20 cookies */ ],
  "cached": false,
  "timestamp": "2026-01-02T..."
}
```

**Respuesta esperada (segunda llamada < 30 min):**
```json
{
  "success": true,
  "cookies": [ /* 15-20 cookies */ ],
  "cached": true,
  "timestamp": "2026-01-02T..."
}
```

### 3. Test Login desde Vercel → Fly.io
```bash
curl -X POST https://xubio-facturacion-online.vercel.app/api/test-login
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "cookiesCount": 15,
    "cookiesValid": true,
    "cookieHeader": "XSRF-TOKEN=...; xubio_session=...",
    "cookies": [ /* detalles de cookies */ ]
  }
}
```

### 4. Test Crear Factura (End-to-End)
```bash
curl -X POST https://xubio-facturacion-online.vercel.app/api/crear-factura \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 123,
    "clienteNombre": "Cliente Test",
    "provinciaId": 1,
    "provinciaNombre": "Buenos Aires",
    "localidadId": 1,
    "localidadNombre": "CABA",
    "cantidad": 1
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Factura creada exitosamente",
  "data": {
    "transaccionId": "123456",
    "numeroDocumento": "00001-00000042",
    "total": 1455.00,
    "pdfUrl": "https://xubio.com/NXV/transaccion/ver/123456",
    "cotizacion": 1455,
    "cantidad": 1
  }
}
```

---

## 🛠️ Tecnologías

- **Vercel**: Serverless functions, auto-deploy desde GitHub
- **Fly.io**: Docker containers, Puppeteer + Stealth
- **Puppeteer**: Browser automation para login (puppeteer-core + @sparticuz/chromium-min)
- **Express**: API server en Fly.io
- **Google Apps Script**: Bridge para AppSheet

---

## 🔍 Monitoreo y Logs

### Logs de Vercel
```bash
# Ver logs en tiempo real desde Vercel Dashboard
https://vercel.com/tu-username/xubio-facturacion-online/logs
```

**Mensajes clave a buscar:**
- `✅ [FLY-CLIENT] Usando cookies del cache` → Cache hit en Vercel
- `🌐 [FLY-CLIENT] Solicitando cookies a Fly.io...` → Cache miss, llamando a Fly.io
- `✅ [FLY-CLIENT] 15 cookies obtenidas de Fly.io` → Login exitoso desde Fly.io
- `📤 [FACTURA] Enviando a /NXV/DF_submit...` → Creando factura en Xubio
- `✅ [FACTURA] Factura creada exitosamente` → Éxito

### Logs de Fly.io
```bash
# Ver logs en tiempo real
fly logs -a xubio-login

# Ver logs de las últimas 100 líneas
fly logs -a xubio-login --limit 100
```

**Mensajes clave a buscar:**
- `✅ Usando cookies del cache (sesión activa)` → Cache hit en Fly.io
- `🔐 Iniciando login a Xubio con Puppeteer + Stealth...` → Login fresco (60s)
- `✅ Login exitoso - 15 cookies obtenidas` → Login completado
- `🔄 Iniciando keep-alive de sesión (cada 30 min)...` → Keep-alive activado
- `✅ Sesión renovada exitosamente` → Keep-alive ejecutado OK
- `❌ Sesión expirada, limpiando cache` → Sesión murió, próxima llamada hará login fresco

### Verificar Estado de Fly.io
```bash
# Ver status de la app
fly status -a xubio-login

# Ver métricas de uso
fly scale show -a xubio-login

# Ver IP pública
fly ips list -a xubio-login
```

---

## 🐛 Troubleshooting

### Error: "Cannot reach Fly.io login service"

**Causa:** Fly.io app puede estar dormida o no deployada.

**Solución:**
```bash
# 1. Verificar que app existe
fly apps list | grep xubio-login

# 2. Verificar status
fly status -a xubio-login

# 3. Si no está corriendo, hacer deploy
fly deploy --config fly.toml
```

### Error: "Timeout: Fly.io login service did not respond in time"

**Causa:** Puppeteer está tardando más de 60s en hacer login (Visma Connect lento).

**Solución:**
1. Verificar logs de Fly.io: `fly logs -a xubio-login`
2. Si ves "⏳ Esperando campo de email...", significa que Visma Connect está lento
3. Esperar 1-2 minutos y reintentar
4. Si persiste, verificar que https://connect.visma.com/ esté funcionando

### Error: "Invalid response from Fly.io: missing cookies array"

**Causa:** Login falló en Fly.io (credenciales incorrectas, Visma Connect bloqueó, etc.).

**Solución:**
```bash
# 1. Verificar logs de Fly.io
fly logs -a xubio-login

# 2. Buscar "❌ Error durante login"
# 3. Verificar credenciales
fly secrets list -a xubio-login

# 4. Re-setear credenciales si es necesario
fly secrets set XUBIO_USERNAME="tu-email" XUBIO_PASSWORD="tu-password" -a xubio-login
```

### Error: "La Sesión ha expirado" al crear factura

**Causa:** Cookies cacheadas expiraron, pero keep-alive no detectó la expiración.

**Solución:**
```bash
# 1. Forzar refresh del cache llamando a Fly.io directamente
curl -X POST https://xubio-login.fly.dev/login

# 2. Reintentar creación de factura
curl -X POST https://xubio-facturacion-online.vercel.app/api/crear-factura ...
```

### Cookies no se cachean (siempre llama a Fly.io)

**Causa:** Vercel está haciendo cold starts frecuentes.

**Solución:**
- Esto es normal en Vercel Hobby plan si no hay tráfico por > 15 minutos
- El cache de Fly.io debería compensar (retorna cookies en < 1s)
- Verificar que Fly.io logs muestran "✅ Usando cookies del cache"

### Keep-alive no se ejecuta

**Causa:** Fly.io app se durmió (auto-sleep después de inactividad).

**Solución:**
```bash
# 1. Despertar app con request
curl https://xubio-login.fly.dev/health

# 2. Verificar logs - debería ver mensaje de keep-alive
fly logs -a xubio-login | grep "keep-alive"
```

**Nota:** Fly.io free tier puede dormir apps después de inactividad prolongada. El keep-alive solo funciona mientras la app esté despierta.

---

## 📊 Métricas de Performance

| Escenario | Latencia | Descripción |
|-----------|----------|-------------|
| **Cache hit (Vercel)** | < 2s | Vercel tiene cookies, crea factura directamente |
| **Cache hit (Fly.io)** | < 3s | Vercel perdió cache (cold start), Fly.io tiene cookies |
| **Login fresco** | ~60s | Ambos caches vacíos, Puppeteer hace login |
| **Keep-alive** | ~500ms | Background job en Fly.io cada 30 min |

**Distribución esperada (producción):**
- 85% cache hit en Vercel (< 2s)
- 10% cache hit en Fly.io (< 3s)
- 5% login fresco (~60s)

---

## 💰 Costos

- **Vercel Hobby**: $0/mes (límite 100 GB bandwidth)
- **Fly.io Free Tier**: $0/mes (256 MB RAM, 1 CPU compartido)
- **Total**: **$0/mes** ✅

**Límites a considerar:**
- Vercel: Max 100 deploys/día, 100 GB bandwidth/mes
- Fly.io: Puede auto-sleep después de inactividad (despierta con primer request)

---

## 📚 Documentación Adicional

- **[DEPLOY_FLY.md](DEPLOY_FLY.md)** - Guía completa de deployment a Fly.io
- **[fly-login/README.md](fly-login/README.md)** - Documentación del servicio Fly.io
- **[apps-script/README-VERCEL.md](apps-script/README-VERCEL.md)** - Integración con Google Apps Script