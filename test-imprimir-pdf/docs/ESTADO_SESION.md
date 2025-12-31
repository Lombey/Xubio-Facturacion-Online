# Estado de la Sesión - Xubio API Laboratory

> **Última actualización:** 31 Diciembre 2025
> **Sesión:** Investigación de API REST + Bearer Token + Creación de proxies Vercel

---

## ✅ Lo que YA ESTÁ FUNCIONANDO (VALIDADO)

### **Método 1: XML Legacy (PRODUCCIÓN READY)**

**Archivo:** `test-imprimir-pdf/sdk/xubioLegacyXml.js`

**Flujo completo:**
1. ✅ Crear factura → `POST https://xubio.com/NXV/DF_submit` (XML payload)
2. ✅ Extraer TransaccionID → Buscar en DOM después de 3 segundos
3. ✅ Obtener config reportes → `DINAMICFORM_ImprimirReportesGetReportes(220, false)`
4. ✅ Generar URL PDF → `https://xubio.com/NXV/general/includes/sr2.jsp` con parámetros
5. ✅ Abrir PDF automáticamente

**Función principal:**
```javascript
crearFacturaConPDF({
  clienteId: 8157173,
  clienteNombre: '2MCAMPO',
  productos: [{ id: 2851980, nombre: 'PRODUCTO', cantidad: 1, precio: 100 }]
})
// → Crea factura + abre PDF automáticamente
```

**Validado con:**
- Múltiples facturas creadas exitosamente
- Comprobantes: A-00004-00001679 hasta A-00004-00001683
- PDFs generados correctamente

**Autenticación:**
- Cookie-based (SessionId, JSESSIONID)
- Se obtiene al hacer login en Xubio con Visma Connect
- ❌ **CONFIRMADO:** Expira al cerrar navegador (NO VIABLE para automatización)

**Documentación:**
- `docs/FLUJO_COMPLETO_FACTURACION.md` - Guía completa con todos los detalles
- Incluye pseudocódigo para Google Apps Script

---

## 🔬 Lo que ESTAMOS INVESTIGANDO (EXPERIMENTAL)

### **Método 2: API REST + Bearer Token**

**Estado:** ⏳ En prueba - esperando deployment de Vercel para verificación final

#### **Descubrimientos Confirmados:**

**1. Arquitectura de Dominios de Xubio:**

Xubio tiene DOS dominios API diferentes:

| Dominio | Propósito | Endpoints Confirmados |
|---------|-----------|----------------------|
| **xubio.com** | Frontend legacy + API mixta | `/NXV/*` (XML legacy)<br>`/api/dashboard/datosUsuario` ✅<br>`/api/dashboard/cardsdashboard` ✅ |
| **microservice.xubio.com** | Microservicios REST puros | `/api/autorizacion/autorizar` ✅ |

**2. Bearer Token:**

- **Formato:** Numérico largo (ejemplo: `17672144603098004776931473459293379488`)
- **Generación:** Automática al hacer login con Visma Connect
- **Uso:** Headers HTTP `Authorization: Bearer {token}`
- **Duración:** Desconocida (probablemente mayor que session cookies)
- **Compatibilidad:** Funciona con ambos dominios (xubio.com y microservice.xubio.com)

**3. Headers Requeridos (Confirmados del Network Tab):**

```javascript
{
  "accept": "application/json, text/plain, */*",
  "authorization": "Bearer 17672144603098004776931473459293379488",
  "sec-fetch-site": "same-site"  // Indica request desde app.xubio.com
}
```

**Nota importante:** Los requests desde `app.xubio.com` a `xubio.com` también incluyen `credentials: "include"`, lo que significa que envían cookies además del Bearer token.

**4. Endpoints Descubiertos:**

✅ **Confirmados que existen:**
- `GET https://xubio.com/api/dashboard/datosUsuario` - Datos del usuario/empresa
- `GET https://xubio.com/api/dashboard/cardsdashboard` - Dashboard cards
- `GET https://microservice.xubio.com/api/autorizacion/autorizar?ruta=X&verbo=Y` - Autorización

❓ **Por confirmar:**
- `POST https://xubio.com/api/argentina/comprobanteVentaBean` - Crear factura (probado antes con error "comprobante vacío")
- `POST https://microservice.xubio.com/api/argentina/comprobanteVentaBean` - Versión en microservicio

---

## 🛠️ Infraestructura Creada

### **Vercel Functions (Proxies para evitar CORS):**

**Creados en esta sesión:**

```
test-imprimir-pdf/api/proxy/
├── datosUsuario.js           ✅ Proxy para verificar Bearer token
├── comprobanteVentaBean.js   ✅ Proxy para crear facturas
└── xubio.js                  ✅ Proxy genérico (acepta cualquier ruta)
```

**Función del proxy genérico (`/api/proxy/xubio`):**
```javascript
// Permite probar cualquier endpoint sin CORS
POST /api/proxy/xubio
{
  "bearerToken": "17672144603098004776931473459293379488",
  "ruta": "/api/dashboard/datosUsuario",
  "method": "GET",  // opcional, default GET
  "domain": "xubio.com"  // opcional, default xubio.com
}
```

**Evolución de los proxies:**
1. ❌ Primera versión: Llamaba a `xubio.com` → Error 401
2. ❌ Segunda versión: Cambiado a `microservice.xubio.com` → Error 401
3. ✅ Tercera versión: Revertido a `xubio.com` con headers simplificados → En prueba

**Lección aprendida:** Los endpoints de dashboard están en `xubio.com`, no en `microservice.xubio.com`.

### **Componente Vue: TabApiRest.vue**

**Características:**
- ✅ Input manual de Bearer token
- ✅ Botón para verificar token con `/api/dashboard/datosUsuario`
- ✅ Sección para probar endpoints manualmente (🔬 Probar Endpoint Manualmente)
- ✅ Selector de clientes y productos (cuando token es válido)
- ✅ Botón para crear factura con API REST
- ✅ Debug panel con request/response JSON
- ✅ Tabla comparativa: API REST vs XML Legacy

**URL:** https://xubio-facturacion-online.vercel.app/ → Pestaña "🔬 API REST (Exp.)"

---

## 📊 Comparación de Métodos (Actualizada)

| Aspecto | XML Legacy | API REST + Bearer |
|---------|------------|-------------------|
| **Estado** | ✅ VALIDADO | ⏳ EN PRUEBA |
| **Endpoint** | `POST /NXV/DF_submit` | `POST /api/argentina/comprobanteVentaBean` |
| **Dominio** | `xubio.com` | `xubio.com` ó `microservice.xubio.com` |
| **Auth** | Session cookies | Bearer token |
| **Duración Auth** | Hasta cerrar navegador ❌ | Desconocida (probablemente mayor) |
| **Payload** | XML (complejo) | JSON (simple) |
| **Response** | XML malformado | JSON (esperado) |
| **TransaccionID** | DOM scraping (3s delay) | ❓ Por confirmar |
| **PDF URL** | Construir manualmente | ❓ Por confirmar |
| **Complejidad** | Alta | Baja (si funciona) |
| **Confiabilidad** | Alta (UI oficial) | ❓ Desconocida |
| **Viable para Apps Script** | Sí (pero complejo) | Sí (si funciona) |

---

## 🔐 Autenticación para Apps Script - Actualizado

### **Problema Confirmado:**

Session cookies **expiran al cerrar navegador** → ❌ NO VIABLE para automatización que corre sin intervención humana.

### **Opciones Evaluadas:**

| Opción | Viabilidad | Razón |
|--------|-----------|-------|
| **A) Cookies manuales** | ❌ DESCARTADO | Expiran al cerrar navegador - requiere intervención manual constante |
| **B) Bearer Token manual** | ⚠️ TEMPORAL | Dura más que cookies pero duración desconocida - viable para pruebas |
| **C) Login programático** | ✅ RECOMENDADO | Automatizar login de Visma Connect + capturar Bearer token |

### **Implementación Propuesta (Opción C):**

1. **Replicar flujo de login de Visma Connect:**
   - POST a `connect.visma.com` con credenciales
   - Seguir OAuth redirects
   - Capturar Bearer token del response/headers

2. **Guardar en Apps Script Properties:**
   ```javascript
   PropertiesService.getScriptProperties().setProperty('XUBIO_BEARER_TOKEN', token);
   PropertiesService.getScriptProperties().setProperty('XUBIO_TOKEN_EXPIRY', expiry);
   ```

3. **Renovación inteligente:**
   ```javascript
   function getValidToken() {
     const stored = PropertiesService.getScriptProperties().getProperty('XUBIO_BEARER_TOKEN');
     const expiry = PropertiesService.getScriptProperties().getProperty('XUBIO_TOKEN_EXPIRY');

     if (Date.now() < expiry - 60000) {
       return stored;  // Token aún válido
     }

     return renewToken();  // Token expirado, renovar
   }
   ```

---

## 🎯 Estado Actual y Próximos Pasos

### **Estado de Prueba Actual:**

**Token de prueba:** `17672144603098004776931473459293379488`

**❌ PROBLEMA CRÍTICO DESCUBIERTO:**

Los proxies de Vercel dan **401 UNAUTHORIZED_ACCESS** incluso con endpoints que funcionan en el browser:

- ❌ `/api/proxy/datosUsuario` → 401
- ❌ `/api/proxy/xubio` con ruta `/api/dashboard/cardsdashboard` → 401

**Confirmado en browser (SIN proxy):**
- ✅ `GET https://xubio.com/api/dashboard/cardsdashboard` → 200 OK
- ✅ Authorization: Bearer 17672144603098004776931473459293379488
- ✅ Headers: `accept`, `authorization`, `origin`, `referer`, `sec-fetch-*`

**Conclusión:**
El Bearer token ES válido, pero hay algo que el proxy NO está replicando correctamente.

**Hipótesis:**
1. Xubio requiere **cookies + Bearer token juntos** (`credentials: "include"`)
2. Xubio valida headers `Origin` y `Referer` (aunque el proxy los envía desde servidor)
3. Xubio valida `sec-fetch-site: same-site` (no replicable desde proxy externo)
4. Falta algún header o cookie crítico

**Próximos pasos de investigación:**
1. ⏳ Verificar si Xubio acepta SOLO Bearer token (sin cookies)
2. ⏳ Probar agregando headers `origin` y `referer` al proxy
3. ⏳ Investigar si hay forma de replicar cookies desde el cliente al proxy
4. ⏳ Considerar alternativa: Extensión de Chrome o script local (no Vercel)

### **Preguntas a Responder:**

1. ❓ ¿El Bearer token funciona para `/api/dashboard/datosUsuario`?
   - **Cómo responder:** Probar en TabApiRest después del deployment

2. ❓ ¿El Bearer token funciona para crear facturas en `/api/argentina/comprobanteVentaBean`?
   - **Cómo responder:** Usar TabApiRest con clientes/productos reales

3. ❓ ¿El response de creación de factura incluye TransaccionID directamente?
   - **Cómo responder:** Revisar JSON response en debug panel

4. ❓ ¿El response incluye PDF URL o hay que construirla?
   - **Cómo responder:** Revisar JSON response en debug panel

5. ❓ ¿Cuánto dura el Bearer token antes de expirar?
   - **Cómo responder:** Dejar pasar tiempo y re-probar, o buscar en response del login

6. ❓ ¿Cómo replicar login de Visma Connect programáticamente?
   - **Cómo responder:** Analizar Network tab durante login completo

### **Decisión Final (Pendiente):**

**Si API REST funciona:**
- ✅ Usar para Google Apps Script (más simple)
- ✅ Payload JSON es más fácil de construir que XML
- ✅ Response JSON es más fácil de parsear
- ✅ No requiere DOM scraping ni delays

**Si API REST NO funciona:**
- ✅ Usar XML Legacy (ya validado al 100%)
- ⚠️ Más complejo de implementar en Apps Script
- ⚠️ Requiere construir XML payload manualmente
- ⚠️ Requiere parsear response XML malformado
- ⚠️ Requiere delay + pattern matching para TransaccionID

---

## 🚀 Archivos del Proyecto

### **Creados/Modificados en esta Sesión:**

```
test-imprimir-pdf/
├── api/proxy/                      ✅ NUEVO - Vercel Functions
│   ├── datosUsuario.js            ✅ Verificar Bearer token
│   ├── comprobanteVentaBean.js    ✅ Crear facturas
│   └── xubio.js                   ✅ Proxy genérico
├── assets/components/
│   └── TabApiRest.vue             ✅ NUEVO - UI experimental para API REST
├── assets/
│   ├── app.js                     ✅ Modificado - Agregado TabApiRest
│   └── App.vue                    ✅ Modificado - Agregado botón pestaña
└── docs/
    └── ESTADO_SESION.md           ✅ Actualizado - Este archivo
```

### **Commits Importantes:**

```bash
99856dc - fix: Revertir proxies a xubio.com (no microservice)
6472436 - feat: Agregar proxy genérico y prueba manual de endpoints
0ba22b9 - fix: Actualizar proxies para usar microservice.xubio.com
212b4e3 - fix: Corregir CORS en TabApiRest.vue agregando proxies de Vercel
ae3e6ef - feat: Crear TabApiRest.vue para probar API REST + Bearer Token
```

---

## 🎓 Aprendizajes Clave de Esta Sesión

### **1. Arquitectura de Xubio (Descubierta)**

Xubio usa una arquitectura mixta:
- **Frontend moderno:** `app.xubio.com` (React/Vue)
- **Frontend legacy:** `xubio.com` (JSP/XML)
- **API REST:** `xubio.com/api/*` + `microservice.xubio.com/api/*`
- **API XML Legacy:** `xubio.com/NXV/*`

### **2. Sistema de Autenticación Dual**

Al hacer login con Visma Connect, Xubio genera:
- **Session Cookies:** Para compatibilidad con frontend legacy
  - `SessionId`, `JSESSIONID`
  - Expiran al cerrar navegador
  - Usados por `/NXV/*` endpoints

- **Bearer Token:** Para API REST moderna
  - Formato numérico largo
  - Duración desconocida (probablemente mayor)
  - Usado por `/api/*` endpoints

### **3. CORS y Proxies**

Llamadas directas desde `vercel.app` a `xubio.com` causan CORS.
**Solución:** Vercel Functions como proxy intermedio.

### **4. Headers HTTP Críticos**

Los headers mínimos necesarios son:
```javascript
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json, text/plain, */*"
}
```

Headers como `Origin` y `Referer` **NO son necesarios** desde el proxy (servidor).

### **5. Método de Investigación Efectivo**

**Red de prueba iterativa:**
1. Observar Network tab en browser (requests reales de Xubio)
2. Copiar fetch exacto que funciona
3. Extraer Bearer token y endpoint
4. Probar en app de laboratorio con proxy
5. Iterar hasta funcionar

---

## 📌 Resumen Ejecutivo

### **Para la Próxima Sesión:**

**Tienes 2 métodos disponibles:**

1. **XML Legacy (xubioLegacyXml.js):**
   - ✅ Funciona al 100%
   - ✅ Documentado completamente
   - ✅ Listo para Google Apps Script
   - ⚠️ Requiere session cookies (manual refresh)
   - ⚠️ Complejo (XML payload + DOM scraping)

2. **API REST + Bearer Token (TabApiRest.vue):**
   - ⏳ En verificación final
   - ✅ Proxies creados y desplegados
   - ✅ UI de prueba lista
   - ❓ Falta confirmar que funciona end-to-end
   - ✅ Más simple (JSON + response directo)

**Token actual para pruebas:** `17672144603098004776931473459293379488`

**Próxima acción:** Investigar por qué el proxy da 401 cuando el Bearer token es válido.

---

## ⚠️ BLOQUEO ACTUAL (Fin de Sesión)

**Problema:**
Los proxies de Vercel no pueden autenticar con Xubio usando solo Bearer token. Todos los endpoints dan 401, incluso los que funcionan en el browser con el mismo token.

**Evidencia:**
- Browser: `GET https://xubio.com/api/dashboard/cardsdashboard` → ✅ 200 OK
- Proxy: `POST /api/proxy/xubio` (mismo endpoint, mismo token) → ❌ 401

**Posibles causas:**
1. **Cookies requeridas:** Xubio puede requerir cookies de sesión además del Bearer token
2. **Headers de seguridad:** `sec-fetch-site: same-site` no es replicable desde proxy externo
3. **Validación de origen:** Xubio valida que requests vengan de `app.xubio.com`

**Soluciones alternativas a explorar:**
1. **Proxy con cookies:** Pasar cookies del cliente al proxy (complejo)
2. **Script local:** Ejecutar desde máquina con acceso a xubio.com (no serverless)
3. **Extensión Chrome:** Bypass CORS ejecutando desde browser
4. **Apps Script directo:** Intentar desde Apps Script (sin proxy) con Bearer token

**Recomendación temporal:**
Usar **Método XML Legacy** (ya validado) para Google Apps Script hasta resolver autenticación de API REST.

---

*Documentación actualizada el 31/12/2025*
*Última actualización: Bloqueo de autenticación en proxy Vercel - Sesión pausada*
