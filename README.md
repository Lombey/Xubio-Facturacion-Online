# Xubio Facturación Online

> 🔗 **API en vivo**: [https://xubio-facturacion-online.vercel.app/](https://xubio-facturacion-online.vercel.app/)

Sistema automatizado de facturación para Xubio usando **arquitectura híbrida Vercel + Fly.io**.

**Objetivo Principal**: Crear facturas en Xubio de forma programática desde **AppSheet / Google Apps Script** sin intervención manual.

---

## 🏗️ Arquitectura Híbrida

### Vercel (API Principal)
- Endpoints serverless para crear facturas
- Cache de cookies de sesión (in-memory)
- Límite: 2048 MB RAM, 60s timeout

### Fly.io (Login Service)
- Puppeteer + Stealth para login automático
- Evita detección de bot por Visma Connect
- Free tier: 256 MB RAM, auto-sleep
- Solo se llama cuando cookies expiran

### Flujo Completo

```
AppSheet → Vercel (/api/crear-factura) → Check cache
                ↓                              ↓
         Si cache válido              Si expiró: Fly.io (/login)
                ↓                              ↓
         Construir XML              Puppeteer + Stealth → Cookies
                ↓                              ↓
         POST a Xubio  ←────────────── Cache cookies
                ↓
         Factura creada ✅
```

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

### Test Login (Vercel → Fly.io)
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
    "cookiesValid": true
  }
}
```

### Test Crear Factura
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

---

## 🛠️ Tecnologías

- **Vercel**: Serverless functions, auto-deploy desde GitHub
- **Fly.io**: Docker containers, Puppeteer + Stealth
- **Puppeteer**: Browser automation para login
- **Express**: API server en Fly.io
- **Google Apps Script**: Bridge para AppSheet