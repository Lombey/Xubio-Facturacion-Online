# Variables de Entorno - Vercel Deployment

Este documento lista todas las variables de entorno necesarias para el correcto funcionamiento de los endpoints serverless de Vercel.

## 📋 Variables Requeridas

### Credenciales de Xubio

Estas credenciales se usan para hacer login programático a Xubio usando Playwright.

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `XUBIO_USERNAME` | Email de usuario de Xubio | `martin.lombardi@gmail.com` | ✅ Sí |
| `XUBIO_PASSWORD` | Contraseña de Xubio | `Corvus"22` | ✅ Sí |

---

## 🔧 Cómo Configurar en Vercel

### Opción A: Desde Vercel Dashboard (Recomendado)

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar el proyecto
3. Ir a **Settings** → **Environment Variables**
4. Agregar cada variable:
   - **Key**: `XUBIO_USERNAME`
   - **Value**: `martin.lombardi@gmail.com`
   - **Environments**: Seleccionar `Production`, `Preview`, `Development`
5. Repetir para `XUBIO_PASSWORD`
6. Hacer **Redeploy** del proyecto para que tome las nuevas variables

### Opción B: Desde CLI de Vercel

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Login
vercel login

# Configurar variables
vercel env add XUBIO_USERNAME production
# → Ingresar: martin.lombardi@gmail.com

vercel env add XUBIO_PASSWORD production
# → Ingresar: Corvus"22

# Aplicar a preview y development también
vercel env add XUBIO_USERNAME preview
vercel env add XUBIO_PASSWORD preview

vercel env add XUBIO_USERNAME development
vercel env add XUBIO_PASSWORD development

# Redeploy
vercel --prod
```

---

## ⚠️ Seguridad

**IMPORTANTE**:
- ❌ **NUNCA** commitear estas credenciales en el código fuente
- ❌ **NUNCA** compartir en repos públicos o documentación
- ✅ Usar **solo** variables de entorno de Vercel
- ✅ Rotar credenciales periódicamente
- ✅ Usar credenciales de una cuenta con permisos mínimos necesarios

---

## 🧪 Validar Configuración

Una vez configuradas las variables, validar que funcionan:

### Test de Login

```bash
# Hacer POST al endpoint de test
curl -X POST https://tu-app.vercel.app/api/test-login

# Response esperado:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "cookiesCount": 5,
    "cookiesValid": true,
    ...
  }
}
```

### Test de Creación de Factura

```bash
# Hacer POST al endpoint principal
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

# Response esperado:
{
  "success": true,
  "message": "Factura creada exitosamente",
  "data": {
    "transaccionId": "123456",
    "numeroDocumento": "0001-00001234",
    "total": 593.9,
    "pdfUrl": "https://xubio.com/NXV/transaccion/ver/123456",
    ...
  }
}
```

---

## 🔍 Troubleshooting

### Error: "Missing credentials"

**Causa**: Variables de entorno no configuradas o no visibles en el environment correcto

**Solución**:
1. Verificar que las variables estén configuradas en Vercel Dashboard
2. Asegurarse de que están habilitadas para `Production`, `Preview`, `Development`
3. Hacer **Redeploy** del proyecto
4. Esperar a que el deploy termine completamente

### Error: "Login failed"

**Causa**: Credenciales incorrectas o cuenta bloqueada

**Solución**:
1. Verificar que las credenciales son correctas
2. Probar login manual en https://xubio.com
3. Verificar que no haya caracteres especiales mal escapados
4. Revisar logs de Vercel para más detalles: `vercel logs`

---

## 📝 Checklist de Configuración

- [ ] Variables `XUBIO_USERNAME` y `XUBIO_PASSWORD` configuradas en Vercel
- [ ] Variables habilitadas para `Production`, `Preview`, `Development`
- [ ] Redeploy ejecutado después de configurar variables
- [ ] Test de `/api/test-login` exitoso (200 OK)
- [ ] Test de `/api/crear-factura` exitoso (200 OK)
- [ ] Credenciales validadas con login manual en xubio.com

---

**Última actualización**: 2025-12-31
