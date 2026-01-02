# Xubio Login Service (Fly.io)

Servicio dedicado para hacer login automático a Xubio usando Puppeteer + Stealth Plugin.

## 🎯 Propósito

Visma Connect (OAuth provider de Xubio) detecta y bloquea browsers headless sin stealth. Este servicio corre en Fly.io con:
- Puppeteer completo (no puppeteer-core)
- Plugin stealth para evitar detección
- Docker con Chromium preinstalado

## 📡 Endpoints

### POST /login
Hace login a Xubio y retorna cookies de sesión.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "cookies": [
    {
      "name": "cookie_name",
      "value": "cookie_value",
      "domain": ".xubio.com",
      "path": "/",
      "expires": 1234567890,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "timestamp": "2026-01-02T12:34:56.789Z"
}
```

**Response (500):**
```json
{
  "success": false,
  "error": "Login failed",
  "message": "Waiting for selector `input#Password` failed",
  "timestamp": "2026-01-02T12:34:56.789Z"
}
```

### GET /health
Health check para monitoreo de Fly.io.

**Response:**
```json
{
  "status": "ok",
  "service": "xubio-login",
  "timestamp": "2026-01-02T12:34:56.789Z"
}
```

## 🚀 Deployment

### Primera vez

```bash
# 1. Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Crear app (desde raíz del repo)
fly apps create xubio-login --region gru

# 4. Deploy
fly deploy --config fly.toml
```

### Deploys subsecuentes

```bash
fly deploy --config fly.toml
```

## 🔧 Configuración

### Archivo: fly.toml

- **Region:** `gru` (São Paulo, Brazil - más cercano a Argentina)
- **Memory:** 256 MB (límite Free tier)
- **Auto-sleep:** Duerme cuando no hay tráfico (ahorra créditos)
- **Health checks:** Cada 30 segundos vía GET /health

### Variables de entorno

No requiere variables de entorno. Las credenciales se pasan en el request body.

## 🏗️ Arquitectura

```
AppSheet → Vercel API → Fly.io Login Service
                ↓              ↓
           Check cache    Puppeteer + Stealth
                ↓              ↓
           Si expiró      Login a Xubio
                ↓              ↓
           Llamar Fly     Retornar cookies
                ↓              ↓
           Cache cookies  ←───┘
                ↓
           Crear factura
```

## 🧪 Testing Local

```bash
# 1. Instalar dependencias
cd fly-login
npm install

# 2. Iniciar servidor
npm start

# 3. Test endpoint (desde otra terminal)
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password123"}'
```

## 📊 Monitoreo

```bash
# Ver logs en vivo
fly logs

# Ver métricas
fly status

# Ver apps desplegadas
fly apps list
```

## 💰 Costos

- **Free tier:** 256 MB RAM, duerme cuando no hay tráfico
- **Estimado:** 100% gratis para uso ocasional (< 100 logins/día)

## 🔒 Seguridad

- **NO** guardar credenciales en variables de entorno
- Credenciales pasan solo via request body (HTTPS)
- Cookies retornadas deben cachearse en Vercel (no en Fly.io)
- No hay persistencia de datos en este servicio

## 🛠️ Troubleshooting

### Error: "fly: command not found"
Instalar Fly CLI: `curl -L https://fly.io/install.sh | sh`

### Error: "waiting for selector failed"
Xubio puede estar caído o cambió selectores. Verificar manualmente en navegador.

### Error: "out of memory"
Aumentar memoria en fly.toml (requiere plan pago):
```toml
[[vm]]
  memory = "512mb"
```
