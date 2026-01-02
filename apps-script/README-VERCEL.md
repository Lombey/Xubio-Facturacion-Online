# Xubio Facturación vía Vercel (Híbrido)

Sistema de facturación automática usando **API Oficial (Tokens)** + **XML Legacy**.

---

## 🏗️ Arquitectura Actual

```
Google Sheets (Apps Script)
    ↓
Vercel API (/api/crear-factura)
    ↓
Xubio (OAuth Auth + XML Submit)
```

**Beneficios:**
- ✅ **Sin bloqueos**: Al no usar navegadores simulados (Puppeteer/Fly.io), Visma no bloquea la IP.
- ✅ **Velocidad**: La factura se crea en < 2 segundos.
- ✅ **Estabilidad**: El XML Legacy es el método más probado de Xubio.

---

## 📋 Setup

1. **Vercel**: Asegúrate de tener `XUBIO_CLIENT_ID` y `XUBIO_SECRET_ID` configurados.
2. **Apps Script**: Copia el código de `apps-script/XubioVercelHybrid.js`.
3. **Test**: Ejecuta la función `testCrearFactura` en el editor de Google.

---

## 🔍 Troubleshooting

- **Error 401**: Verifica tus llaves de API en el dashboard de Xubio.
- **Error "Token no válido para este endpoint"**: Esto ocurrirá si Xubio decide que el endpoint XML solo admite cookies. En ese caso, migraremos a la REST API JSON (el motor ya está preparado en el SDK).