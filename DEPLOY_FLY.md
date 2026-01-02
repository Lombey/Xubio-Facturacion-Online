# Deployment a Fly.io - Guía Completa

## 🎯 Objetivo

Deployar servicio de login con Puppeteer + Stealth en Fly.io para evitar detección de bot por Visma Connect.

## 📋 Prerequisitos

1. Cuenta en Fly.io (100% gratis para este uso)
2. Fly CLI instalado
3. GitHub conectado a Fly.io

## 🚀 Primera Vez - Setup Inicial

### 1. Instalar Fly CLI

**Windows:**
```powershell
pwsh -c "irm https://fly.io/install.ps1 | iex"
```

**Linux/Mac:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login a Fly.io

```bash
fly auth login
```

Se abrirá el navegador para autenticar.

### 3. Crear la App en Fly.io

```bash
# Desde la raíz del repositorio
fly apps create xubio-login --region gru
```

**Región:** `gru` = São Paulo, Brazil (más cercano a Argentina)

### 4. Configurar Variables de Entorno (OPCIONAL)

Si quieres cambiar la URL del servicio:

```bash
fly secrets set FLY_LOGIN_URL=https://xubio-login.fly.dev
```

**Nota:** Por defecto ya está configurado en `flyLogin.js`

### 5. Deploy Inicial

```bash
# Desde la raíz del repositorio
fly deploy --config fly.toml
```

**Duración:** 2-5 minutos primera vez (descarga imagen Docker base)

### 6. Verificar Deployment

```bash
# Ver status
fly status

# Ver logs en vivo
fly logs

# Test health check
curl https://xubio-login.fly.dev/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "service": "xubio-login",
  "timestamp": "2026-01-02T12:34:56.789Z"
}
```

## 🔄 Deploys Subsecuentes

Cada vez que hagas cambios en `/fly-login`:

```bash
# 1. Commit cambios a Git
git add fly-login/
git commit -m "feat: Actualizar servicio de login Fly.io"

# 2. Deploy
fly deploy --config fly.toml

# 3. Verificar logs
fly logs
```

## 🧪 Testing

### Test Local (antes de deployar)

```bash
# 1. Ir a carpeta fly-login
cd fly-login

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm start

# 4. En otra terminal, test endpoint
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$XUBIO_USERNAME\",\"password\":\"$XUBIO_PASSWORD\"}"
```

### Test en Producción (después de deployar)

```bash
# Test desde Vercel (simular llamada real)
curl -X POST https://tu-app.vercel.app/api/test-login
```

## 📊 Monitoreo

### Ver Logs en Vivo

```bash
fly logs
```

### Ver Métricas

```bash
fly status
```

### Ver Lista de Apps

```bash
fly apps list
```

### SSH a la Instancia (debugging)

```bash
fly ssh console
```

## 🔧 Configuración Avanzada

### Cambiar Región

```bash
fly regions set gru  # São Paulo
fly regions set eze  # Buenos Aires (si está disponible)
fly regions set gig  # Rio de Janeiro
```

### Aumentar Memoria (requiere plan pago)

Editar `fly.toml`:
```toml
[[vm]]
  memory = "512mb"  # Cambiar de 256mb a 512mb
```

Luego:
```bash
fly deploy --config fly.toml
```

### Configurar Auto-Scale (plan pago)

Editar `fly.toml`:
```toml
[http_service]
  min_machines_running = 1  # Siempre al menos 1 instancia activa
```

## 🛠️ Troubleshooting

### Error: "fly: command not found"

Reiniciar terminal o agregar a PATH:

**Windows:**
```powershell
$env:Path += ";$HOME\.fly\bin"
```

**Linux/Mac:**
```bash
export PATH="$HOME/.fly/bin:$PATH"
```

### Error: "waiting for selector failed"

Xubio o Visma Connect puede estar caído. Verificar manualmente:
```bash
curl https://xubio.com/NXV/vismaConnect/login
```

### Error: "out of memory"

Aumentar memoria en `fly.toml` (requiere plan pago):
```toml
[[vm]]
  memory = "512mb"
```

### Error: "timeout"

Aumentar timeout en `api/utils/flyLogin.js`:
```javascript
signal: AbortSignal.timeout(120000) // 2 minutos
```

## 💰 Costos

### Free Tier (actual)

- **RAM:** 256 MB
- **CPU:** Shared
- **Auto-sleep:** Sí (duerme cuando no hay tráfico)
- **Estimado:** 100% gratis para uso ocasional (< 100 logins/día)

### Plan Pago (si necesitas)

- **RAM:** 512 MB = ~$2/mes
- **RAM:** 1 GB = ~$4/mes
- **Always-on:** +$1.94/mes

**Recomendación:** Empezar con Free tier, escalar solo si es necesario.

## 🔒 Seguridad

### Variables de Entorno en Vercel

Configurar en Vercel Dashboard:
```
XUBIO_USERNAME=tu-email@example.com
XUBIO_PASSWORD=tu-password
FLY_LOGIN_URL=https://xubio-login.fly.dev
```

### NO Guardar Credenciales en Fly.io

Las credenciales pasan vía request body (HTTPS), **nunca** como variables de entorno en Fly.io.

## 🔄 Rollback (si algo falla)

```bash
# Ver deployments anteriores
fly releases

# Rollback al deployment anterior
fly releases rollback
```

## 📚 Referencias

- [Fly.io Docs](https://fly.io/docs/)
- [Puppeteer on Fly.io](https://fly.io/docs/app-guides/puppeteer/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Status](https://status.fly.io/)

## ✅ Checklist Final

Antes de considerar deployment exitoso:

- [ ] `fly status` muestra "deployed" y "running"
- [ ] `curl https://xubio-login.fly.dev/health` retorna 200 OK
- [ ] `fly logs` NO muestra errores críticos
- [ ] Test desde Vercel: `curl https://tu-app.vercel.app/api/test-login` retorna cookies
- [ ] Logs de Vercel muestran "Usando cookies del cache" en segunda llamada
