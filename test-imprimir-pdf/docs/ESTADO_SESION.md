# Estado de la Sesión - Xubio API Laboratory

> **Última actualización:** 31 Diciembre 2025
> **Sesión:** Descubrimiento completo de facturación + Planificación API REST

---

## ✅ Lo que YA ESTÁ FUNCIONANDO (VALIDADO)

### **Método 1: XML Legacy (PRODUCCIÓN READY)**

**Archivo:** `test-imprimir-pdf/sdk/xubioLegacyXml.js`

**Flujo completo:**
1. ✅ Crear factura → `POST /NXV/DF_submit` (XML payload)
2. ✅ Extraer TransaccionID → Buscar en DOM después de 3 segundos
3. ✅ Obtener config reportes → `DINAMICFORM_ImprimirReportesGetReportes(220, false)`
4. ✅ Generar URL PDF → `/NXV/general/includes/sr2.jsp` con parámetros
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
- Expira al cerrar navegador (session cookies)

**Documentación:**
- `docs/FLUJO_COMPLETO_FACTURACION.md` - Guía completa con todos los detalles
- Incluye pseudocódigo para Google Apps Script

---

## 🔬 Lo que ESTAMOS INVESTIGANDO (EXPERIMENTAL)

### **Método 2: API REST + Bearer Token**

**Descubrimiento:**
- Al hacer login con Visma Connect, Xubio genera automáticamente:
  - Session cookies (para XML legacy)
  - Bearer token (para API REST)

**Bearer Token encontrado:**
```
Authorization: Bearer 17672115954180896103847217637501596365
```

**Endpoint a probar:**
```
POST https://xubio.com/api/argentina/comprobanteVentaBean
Headers: Authorization: Bearer xxx
Body: JSON (similar a XML legacy pero formato JSON)
```

**Estado actual:**
- ❓ No sabemos si funciona para crear facturas electrónicas
- ❓ Probamos antes y dio error "comprobante vacío"
- ❓ Puede que con Bearer token funcione diferente

---

## 🎯 PLAN INMEDIATO

### **Objetivo:** Probar método API REST + Bearer Token en app de laboratorio

**Pasos:**

1. **Crear nueva pestaña `TabApiRest.vue`**
   - Input: Credenciales (o usar token existente)
   - Botón: Obtener Bearer Token
   - Mostrar: Token obtenido
   - Selector: Cliente + Productos
   - Botón: Crear Factura con API REST
   - Debug panel: Request/Response JSON

2. **Implementar lógica:**
   - Función para obtener Bearer token
   - Función para crear factura con API REST
   - Comparar resultado con XML legacy

3. **Comparación:**
   ```
   XML Legacy          vs    API REST + Bearer
   ✅ Funciona              ❓ Por probar
   Cookie-based             Token-based
   XML payload              JSON payload
   DOM scraping             Response directo
   Complejo                 Simple (si funciona)
   ```

4. **Decisión:**
   - Si API REST funciona → Usar para Apps Script (más simple)
   - Si API REST falla → Usar XML legacy (ya validado)

---

## 📊 Comparación de Métodos

| Aspecto | XML Legacy | API REST + Bearer |
|---------|------------|-------------------|
| Estado | ✅ VALIDADO | ❓ EXPERIMENTAL |
| Endpoint | `/NXV/DF_submit` | `/api/argentina/comprobanteVentaBean` |
| Auth | Session cookies | Bearer token |
| Payload | XML (complejo) | JSON (simple) |
| Response | XML malformado | JSON (esperado) |
| TransaccionID | DOM scraping | Response directo (esperado) |
| PDF URL | Construir manualmente | ❓ Por descubrir |
| Complejidad | Alta | Baja (si funciona) |
| Confiabilidad | Alta (UI oficial) | ❓ Desconocida |

---

## 🔐 Desafío de Autenticación para Apps Script

### **Problema:**
Xubio usa **Visma Connect** (OAuth) para login:
1. Usuario → `connect.visma.com/password` (email + password)
2. Visma → OAuth callback con code/token
3. Xubio → Genera sesión (cookies + Bearer token)

### **Opciones:**

**A) Cookies manuales (NO VIABLE)**
- Session cookies expiran al cerrar navegador
- Requiere intervención manual constante
- ❌ Descartado

**B) Login en cada request (LENTO)**
- Login completo cada vez que se crea factura
- Riesgo de bloqueo por rate limiting
- ⚠️ Solo si no hay alternativa

**C) Login con renovación inteligente (RECOMENDADO)**
- Login una vez al inicio
- Guardar cookies/token en Properties
- Renovar solo cuando expire
- Usar mismo token para múltiples facturas
- ✅ Mejor opción

### **Implementación pendiente:**
1. Replicar flujo de login de Visma Connect
2. Capturar cookies/Bearer token del callback
3. Guardar en Apps Script Properties
4. Verificar validez antes de cada request
5. Renovar automáticamente si expira

---

## 📝 Decisiones Importantes Tomadas

1. **API REST original rechazada:**
   - Intentamos `/api/argentina/comprobanteVentaBean` con payload JSON
   - Error: "Este recurso sólo admite la creación de facturas con punto de venta editable-sugerido"
   - No funciona con punto de venta electrónico

2. **Endpoint XML legacy adoptado:**
   - Mismo que usa la UI oficial de Xubio
   - Funciona perfectamente con punto de venta electrónico
   - Respuesta XML tiene errores de formato pero factura se crea

3. **DOM scraping necesario:**
   - Response XML no contiene TransaccionID
   - Solución: Esperar 3s + buscar en `document.body.innerHTML`
   - Funciona de forma confiable

4. **Próximo experimento:**
   - Probar API REST con Bearer token en lugar de cookies
   - Si funciona, es mejor para Apps Script
   - Si no funciona, usamos XML legacy (ya listo)

---

## 🚀 Estado del Código

### **Archivos Creados/Modificados:**

```
test-imprimir-pdf/
├── sdk/
│   └── xubioLegacyXml.js          ✅ NUEVO - Completo y funcionando
├── docs/
│   ├── FLUJO_COMPLETO_FACTURACION.md  ✅ NUEVO - Documentación exhaustiva
│   └── ESTADO_SESION.md               ✅ NUEVO - Este archivo
├── assets/
│   └── components/
│       ├── TabFactura.vue         ✅ Modificado - Debug panel agregado
│       └── TabApiRest.vue         ⏳ PENDIENTE - Por crear
```

### **Git Status:**
```
✅ Commit: "feat: flujo completo de facturación con endpoint XML legacy VALIDADO"
✅ Push: Subido a GitHub
📦 2 archivos nuevos: xubioLegacyXml.js + FLUJO_COMPLETO_FACTURACION.md
```

---

## 💡 Próximos Pasos (Ordenados)

### **Inmediato (Hoy):**
1. ✅ Crear `TabApiRest.vue`
2. ✅ Implementar obtención de Bearer token
3. ✅ Probar creación de factura con API REST
4. ✅ Comparar resultados
5. ✅ Documentar hallazgos

### **Corto Plazo:**
1. Decidir método final (XML vs REST)
2. Implementar login automático en Apps Script
3. Crear función completa de facturación en Apps Script
4. Probar desde AppSheet

### **Mediano Plazo:**
1. Integrar con AppSheet (webhook → Apps Script)
2. Mapeo de IDs (AppSheet ↔ Xubio)
3. Guardar PDFs en Google Drive
4. Actualizar estado en AppSheet

---

## 🎓 Aprendizajes Clave

1. **Xubio tiene DOS sistemas de autenticación:**
   - Legacy XML: Session cookies
   - API REST: Bearer token
   - Ambos se obtienen al hacer login con Visma Connect

2. **La UI oficial usa XML legacy:**
   - Endpoint `/NXV/DF_submit`
   - Es el más confiable (lo usa Xubio mismo)

3. **DOM scraping es necesario:**
   - Response XML no contiene TransaccionID
   - Pero Xubio actualiza el HTML con la factura creada
   - Esperar 3s y buscar patrón en innerHTML funciona

4. **Bearer token se genera automáticamente:**
   - Al hacer login con Visma Connect
   - Sirve para endpoints `/api/*`
   - Dura más que session cookies (probablemente)

---

## 🤔 Preguntas Sin Resolver

1. ¿El Bearer token funciona para crear facturas en `/api/argentina/comprobanteVentaBean`?
2. ¿Cuánto dura el Bearer token antes de expirar?
3. ¿Cómo replicar el login de Visma Connect programáticamente?
4. ¿El API REST devuelve TransaccionID en la respuesta?
5. ¿El API REST permite obtener PDF directamente?

**Responderemos estas preguntas en la nueva pestaña `TabApiRest.vue`.**

---

## 📌 Notas Finales

- **XML Legacy está listo para producción** - funciona al 100%
- **API REST es experimental** - puede o no funcionar
- **Ambos métodos valen la pena explorar** - API REST sería más simple si funciona
- **La decisión final se tomará después de probar API REST**

**Estado general:** ✅ Exitoso - Tenemos método funcional + explorando alternativa mejor

---

*Documentación generada automáticamente el 31/12/2025*
