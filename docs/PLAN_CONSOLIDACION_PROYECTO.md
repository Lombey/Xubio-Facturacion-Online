# Plan de Consolidación del Proyecto - Xubio API Laboratory

**Fecha**: 1 Enero 2026
**Autor**: Claude Code (Sesión de refactorización)
**Estado**: 📋 PENDIENTE DE EJECUCIÓN
**Prioridad**: MEDIA (puede ejecutarse después de resolver issues de Vercel)

---

## 🎯 Objetivo

Consolidar el proyecto eliminando duplicación innecesaria entre la raíz y la carpeta `test-imprimir-pdf`, mejorando mantenibilidad y evitando confusión en deployments de Vercel.

---

## 📊 Diagnóstico - Situación Actual

### Problema Identificado

El proyecto tiene **DOS estructuras casi idénticas**:

```
/ (raíz)
├── api/                    ← APIs serverless (Vercel las usa)
├── package.json            ← Vercel usa ESTE
├── vercel.json
└── vite.config.js

/test-imprimir-pdf
├── api/                    ← APIs serverless DUPLICADAS
├── apps-script/            ← Scripts únicos aquí
├── docs/                   ← Documentación única aquí
├── sdk/                    ← SDK único aquí
├── package.json            ← NO usado por Vercel
├── vercel.json             ← NO usado por Vercel
└── index.html
```

### Consecuencias del Problema

1. ❌ **Dependencias desincronizadas**:
   - Raíz: `@sparticuz/chromium` v131 (viejo)
   - test-imprimir-pdf: `@sparticuz/chromium-min` v143 (nuevo)

2. ❌ **Código duplicado**:
   - `browserLogin.js` en ambos lados (versiones diferentes)
   - `test-chromium.js` copiado manualmente

3. ❌ **Confusión de Vercel**:
   - Vercel usa archivos de raíz
   - Desarrollador edita archivos en test-imprimir-pdf
   - Cambios no se reflejan en producción

4. ❌ **Mantenimiento doble**:
   - Cada cambio debe replicarse manualmente
   - Alto riesgo de inconsistencias

---

## 🏗️ Estructura Objetivo

```
/ (raíz consolidada)
├── api/                          ← APIs serverless (Vercel)
│   ├── utils/
│   │   ├── browserLogin.js       ← Versión única y actualizada
│   │   └── xubioApiClient.js     ← (Si aplica)
│   ├── test-chromium.js
│   ├── test-login.js
│   └── crear-factura.js          ← (Futuro)
│
├── sdk/                          ← SDK JavaScript puro (mover desde test-imprimir-pdf)
│   ├── xubioClient.js
│   ├── facturaService.js
│   └── cobranzaService.js
│
├── apps-script/                  ← Scripts de Google Apps Script
│   ├── XubioFacturacion.js       ← Mover desde test-imprimir-pdf/
│   ├── XubioFacturacionVercel.js
│   └── README-VERCEL.md
│
├── docs/                         ← Documentación consolidada
│   ├── apis/                     ← Mover desde test-imprimir-pdf/docs/
│   ├── templates/
│   ├── PLAN_CONSOLIDACION_PROYECTO.md  ← Este archivo
│   └── ARQUITECTURA_PROYECTO.md
│
├── frontend/                     ← (Opcional) UI Vue actual
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── archive/                      ← Archivos históricos
│   └── test-imprimir-pdf-legacy/
│       ├── README-ARCHIVADO.md   ← Explicar qué fue y por qué se archivó
│       └── [snapshots relevantes]
│
├── package.json                  ← UN SOLO package.json
├── vercel.json                   ← UN SOLO vercel.json
├── vite.config.js
├── .gitignore
└── README.md                     ← Actualizado con nueva estructura
```

---

## 📋 Plan de Ejecución - Paso a Paso

### FASE 0: Preparación y Backup

```bash
# 0.1 Crear branch para refactorización
git checkout -b refactor/consolidar-proyecto

# 0.2 Crear carpeta archive
mkdir -p archive

# 0.3 Commit estado actual como checkpoint
git add -A
git commit -m "checkpoint: Estado antes de consolidación"
```

**Validación Fase 0**:
- [ ] Branch `refactor/consolidar-proyecto` creado
- [ ] Carpeta `archive/` existe
- [ ] Commit checkpoint realizado

---

### FASE 1: Mover Código Único de test-imprimir-pdf a Raíz

#### 1.1 Mover SDK

```bash
# Si /sdk ya existe en raíz, comparar primero
diff -r sdk/ test-imprimir-pdf/sdk/ || echo "SDKs diferentes, revisar manualmente"

# Mover SDK desde test-imprimir-pdf a raíz (si no existe en raíz)
# O mergear archivos si ambos existen
mv test-imprimir-pdf/sdk ./sdk

# Si ya existe, hacer merge manual consultando diferencias
```

**Acción manual si SDK existe en ambos lados**:
- Comparar archivo por archivo
- Quedarse con la versión más actualizada
- Documentar decisiones en commit

#### 1.2 Mover apps-script

```bash
# Mover scripts de Google Apps Script
mkdir -p apps-script
cp -r test-imprimir-pdf/apps-script/* ./apps-script/

# Verificar que se copiaron correctamente
ls -la apps-script/
```

#### 1.3 Mover documentación

```bash
# Crear carpeta docs si no existe
mkdir -p docs

# Mover documentación específica de test-imprimir-pdf
cp -r test-imprimir-pdf/docs/* ./docs/ 2>/dev/null || echo "No hay docs para mover"

# Mover READMEs relevantes
cp test-imprimir-pdf/README.md ./docs/README-TEST-PDF-LEGACY.md
```

#### 1.4 Commit de migración

```bash
git add sdk/ apps-script/ docs/
git commit -m "refactor: Mover código único de test-imprimir-pdf a raíz

Movido:
- /sdk → /sdk (SDK JavaScript puro)
- /apps-script → /apps-script (Scripts Google Apps Script)
- /docs → /docs (Documentación consolidada)

Refs: docs/PLAN_CONSOLIDACION_PROYECTO.md Fase 1"
```

**Validación Fase 1**:
- [ ] SDK movido/mergeado correctamente
- [ ] apps-script/ contiene todos los scripts
- [ ] docs/ contiene toda la documentación
- [ ] Commit realizado

---

### FASE 2: Archivar test-imprimir-pdf

```bash
# 2.1 Crear README explicativo para el archivo
cat > archive/README-TEST-IMPRIMIR-PDF-ARCHIVADO.md << 'EOF'
# test-imprimir-pdf (Archivado)

**Fecha de archivo**: 1 Enero 2026
**Razón**: Consolidación del proyecto - eliminación de duplicación

## ¿Qué fue test-imprimir-pdf?

Subproyecto experimental para probar el endpoint `/imprimirPDF` de Xubio API
y validar valores del parámetro `tipoimpresion`.

## ¿Por qué se archivó?

1. Experimento completado exitosamente
2. Código útil migrado a raíz del proyecto
3. Evitar duplicación de package.json, vercel.json, /api
4. Simplificar deployment en Vercel

## ¿Qué se migró a raíz?

- `/sdk` → `/sdk`
- `/apps-script` → `/apps-script`
- `/docs` → `/docs`
- `/api/utils/browserLogin.js` → `/api/utils/browserLogin.js` (versión actualizada)

## ¿Dónde está el código ahora?

- **SDK**: `/sdk`
- **APIs serverless**: `/api`
- **Documentación**: `/docs`
- **Google Apps Script**: `/apps-script`

## Restaurar si es necesario

```bash
git checkout <commit-antes-de-consolidacion>
# O revisar historial: git log --follow -- test-imprimir-pdf/
```
EOF

# 2.2 Mover test-imprimir-pdf completo a archive
mv test-imprimir-pdf archive/test-imprimir-pdf-legacy

# 2.3 Commit de archivado
git add archive/
git rm -r test-imprimir-pdf  # Git ya lo detectó como movido
git commit -m "refactor: Archivar test-imprimir-pdf como legacy

- Movido completo a archive/test-imprimir-pdf-legacy
- Creado README explicativo en archive/
- Código útil ya migrado en Fase 1

Refs: docs/PLAN_CONSOLIDACION_PROYECTO.md Fase 2"
```

**Validación Fase 2**:
- [ ] test-imprimir-pdf movido a archive/
- [ ] README-TEST-IMPRIMIR-PDF-ARCHIVADO.md existe
- [ ] Commit realizado
- [ ] Git detecta el movimiento correctamente

---

### FASE 3: Verificar y Limpiar APIs Duplicadas

```bash
# 3.1 Comparar api/ de raíz con api/ archivada
diff -r api/ archive/test-imprimir-pdf-legacy/api/

# 3.2 Verificar que browserLogin.js de raíz está actualizado
grep '@sparticuz/chromium-min' api/utils/browserLogin.js || echo "⚠️ browserLogin.js NO actualizado!"
grep 'chromium-v143.0.0-pack.x64.tar' api/utils/browserLogin.js || echo "⚠️ URL CDN faltante!"

# 3.3 Listar endpoints actuales
ls -la api/*.js
```

**Acción manual**:
- Si hay archivos en `archive/test-imprimir-pdf-legacy/api/` que NO están en `/api/`, evaluarlos uno por uno
- Decidir si migrar o descartar
- Documentar decisión en commit

**Validación Fase 3**:
- [ ] Diferencias entre APIs identificadas
- [ ] browserLogin.js actualizado verificado
- [ ] Endpoints listados y validados

---

### FASE 4: Actualizar Documentación Principal

```bash
# 4.1 Actualizar README.md principal
```

**Editar manualmente** `README.md` para incluir:

1. Nueva estructura de carpetas
2. Explicar que test-imprimir-pdf fue archivado
3. Indicar dónde está cada componente ahora
4. Actualizar instrucciones de desarrollo

Ejemplo de sección a agregar:

```markdown
## 📁 Estructura del Proyecto

\`\`\`
/
├── api/              # APIs serverless (Vercel)
├── sdk/              # SDK JavaScript puro para Xubio API
├── apps-script/      # Scripts de Google Apps Script
├── docs/             # Documentación técnica
├── archive/          # Código legacy archivado
├── package.json      # Dependencias del proyecto
└── vercel.json       # Configuración de Vercel
\`\`\`

### 🗄️ Archivos Legacy

El proyecto `test-imprimir-pdf` fue un experimento exitoso que se consolidó
en la estructura principal. Ver `archive/README-TEST-IMPRIMIR-PDF-ARCHIVADO.md`
para más detalles.
```

```bash
# 4.2 Commit de actualización de docs
git add README.md
git commit -m "docs: Actualizar README con nueva estructura consolidada

- Documentar estructura de carpetas actualizada
- Explicar archivado de test-imprimir-pdf
- Actualizar instrucciones de desarrollo

Refs: docs/PLAN_CONSOLIDACION_PROYECTO.md Fase 4"
```

**Validación Fase 4**:
- [ ] README.md actualizado con nueva estructura
- [ ] Sección de archivos legacy agregada
- [ ] Commit realizado

---

### FASE 5: Verificar package.json y vercel.json

```bash
# 5.1 Verificar que package.json de raíz tiene todas las dependencias necesarias
cat package.json | jq '.dependencies'

# Debe contener:
# - puppeteer-core: ^24.34.0
# - @sparticuz/chromium-min: ^143.0.0
# - playwright-core (si se usa)
# - vue (si se usa)

# 5.2 Verificar vercel.json
cat vercel.json
```

**Verificaciones manuales**:

1. **package.json**:
   - ✅ Tiene `puppeteer-core`
   - ✅ Tiene `@sparticuz/chromium-min` (NO chromium viejo)
   - ✅ Versiones actualizadas

2. **vercel.json**:
   - ✅ `functions` apunta a `api/**/*.js`
   - ✅ `memory: 2048` (límite Hobby)
   - ✅ `maxDuration: 60`

```bash
# 5.3 Reinstalar dependencias para asegurar lockfile limpio
rm -rf node_modules package-lock.json
npm install

# 5.4 Commit si hay cambios en package-lock.json
git add package-lock.json
git commit -m "chore: Regenerar package-lock.json después de consolidación" || echo "Sin cambios"
```

**Validación Fase 5**:
- [ ] package.json tiene dependencias correctas
- [ ] vercel.json configurado apropiadamente
- [ ] node_modules regenerado limpiamente
- [ ] package-lock.json actualizado

---

### FASE 6: Testing y Validación

```bash
# 6.1 Verificar que no quedan referencias a test-imprimir-pdf en código activo
grep -r "test-imprimir-pdf" --exclude-dir=archive --exclude-dir=node_modules --exclude-dir=.git . || echo "✅ Sin referencias"

# 6.2 Build local (si aplica)
npm run build

# 6.3 Lint
npm run lint

# 6.4 Tests (si existen)
npm test || echo "⚠️ No hay tests configurados"
```

**Testing manual**:
1. Revisar que todos los imports funcionen
2. Si hay frontend, verificar que carga correctamente
3. Revisar que APIs no tengan imports rotos

**Validación Fase 6**:
- [ ] Sin referencias a test-imprimir-pdf fuera de archive
- [ ] Build exitoso (si aplica)
- [ ] Lint sin errores críticos
- [ ] Tests pasando (si existen)

---

### FASE 7: Merge y Deploy

```bash
# 7.1 Merge a main
git checkout main
git merge refactor/consolidar-proyecto --no-ff -m "refactor: Consolidar proyecto eliminando duplicación test-imprimir-pdf

Cambios principales:
- Migrado SDK, apps-script, docs de test-imprimir-pdf a raíz
- Archivado test-imprimir-pdf legacy en /archive
- Eliminada duplicación de package.json, vercel.json, /api
- Actualizada documentación principal

Beneficios:
- Una sola fuente de verdad para dependencias
- Vercel usa archivos correctos sin confusión
- Mantenimiento simplificado
- Estructura más clara

Refs: docs/PLAN_CONSOLIDACION_PROYECTO.md (todas las fases)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 7.2 Push a GitHub
git push origin main

# 7.3 Esperar redeploy de Vercel (~2 min)
# Verificar en https://vercel.com/dashboard

# 7.4 Testear endpoints en producción
curl -X POST https://xubio-facturacion-online.vercel.app/api/test-chromium
curl -X POST https://xubio-facturacion-online.vercel.app/api/test-login
```

**Validación Fase 7**:
- [ ] Merge a main exitoso
- [ ] Push a GitHub completado
- [ ] Vercel redeploy detectado y completado
- [ ] Endpoints de producción funcionando

---

## ✅ Checklist Final

### Estructura
- [ ] `/sdk` existe con SDK completo
- [ ] `/apps-script` existe con todos los scripts
- [ ] `/docs` consolidada
- [ ] `/archive/test-imprimir-pdf-legacy` existe con README explicativo
- [ ] `/api` limpia y sin duplicados

### Archivos de Configuración
- [ ] UN SOLO `package.json` en raíz
- [ ] UN SOLO `vercel.json` en raíz
- [ ] `package.json` tiene dependencias actualizadas
- [ ] `.gitignore` apropiado

### Documentación
- [ ] `README.md` actualizado con nueva estructura
- [ ] `archive/README-TEST-IMPRIMIR-PDF-ARCHIVADO.md` creado
- [ ] `docs/PLAN_CONSOLIDACION_PROYECTO.md` marcado como ✅ COMPLETADO

### Validación Técnica
- [ ] `npm install` exitoso
- [ ] `npm run build` exitoso (si aplica)
- [ ] `npm run lint` sin errores críticos
- [ ] Sin referencias a `test-imprimir-pdf` fuera de archive
- [ ] Vercel redeploy exitoso
- [ ] Endpoints funcionando en producción

### Git
- [ ] Todos los commits realizados
- [ ] Merge a `main` completado
- [ ] Push a GitHub exitoso
- [ ] Branch `refactor/consolidar-proyecto` puede eliminarse (opcional)

---

## 🔄 Plan de Rollback (Si algo sale mal)

### Rollback Completo

```bash
# Volver al checkpoint antes de consolidación
git log --oneline | grep "checkpoint: Estado antes de consolidación"
# Copiar hash del commit

git reset --hard <hash-del-checkpoint>
git push origin main --force  # ⚠️ CUIDADO: Solo si nadie más está trabajando
```

### Rollback Parcial

```bash
# Restaurar solo test-imprimir-pdf
git checkout <hash-del-checkpoint> -- test-imprimir-pdf/
git add test-imprimir-pdf/
git commit -m "rollback: Restaurar test-imprimir-pdf"
```

---

## 📝 Notas para el Agente Ejecutor

1. **Pausar entre fases** para validar resultados
2. **NO hacer force push** a menos que sea absolutamente necesario
3. **Documentar decisiones** en commits si se desvía del plan
4. **Consultar al usuario** si encuentra diferencias inesperadas entre archivos
5. **Guardar logs** de cada comando importante para debugging

---

## 🎓 Aprendizajes para Documentar

Después de completar la consolidación, actualizar `CLAUDE.md` con:

- Pattern de consolidación de proyectos duplicados
- Cómo manejar migraciones sin romper Vercel
- Importancia de estructura clara desde el inicio
- Evitar duplicación de configuraciones (package.json, vercel.json)

---

**Estado Final de Este Documento**: Una vez ejecutado, cambiar status a:

```markdown
**Estado**: ✅ COMPLETADO - [Fecha]
```

Y agregar sección de "Resultados Post-Ejecución" con métricas:
- Archivos eliminados
- Líneas de código reducidas
- Tiempo de ejecución total
- Issues encontrados y resueltos
