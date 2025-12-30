# Fix: Error de Output Directory en Vercel

## Problema
Vercel reportaba el error:
```
Error: No Output Directory named "dist" found after the Build completed.
```

## Causa
El proyecto usa Vite para build, que genera el output en `test-imprimir-pdf/dist`, pero Vercel estaba buscando `dist` en la raíz del proyecto.

## Solución Aplicada

### 1. Configuración de Vercel (`vercel.json`) ✅

Agregadas las siguientes propiedades:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "test-imprimir-pdf/dist",
  "installCommand": "npm install"
}
```

### 2. Configuración de Vite (`vite.config.js`) ✅

Ajustado `outDir` para que sea relativo al `root`:
```js
{
  root: 'test-imprimir-pdf',
  build: {
    outDir: 'dist'  // Relativo a root, resultando en test-imprimir-pdf/dist
  }
}
```

### 3. Rutas Actualizadas ✅

Las rutas en `vercel.json` ahora apuntan correctamente:
- `/api/*` → Serverless functions
- `/favicon.*` → Favicons desde el dist
- `/*` → Archivos estáticos desde el dist

## Estructura del Build

Después de `npm run build`:
```
test-imprimir-pdf/
  dist/
    index.html
    assets/
      main-*.js
      main-*.css
      favicon-*.svg
      favicon-*.ico
```

## Verificación

Para verificar localmente:
```bash
npm run build
# Verifica que test-imprimir-pdf/dist/index.html existe
```

## Despliegue en Vercel

Ahora Vercel:
1. ✅ Ejecuta `npm install`
2. ✅ Ejecuta `npm run build`
3. ✅ Encuentra el output en `test-imprimir-pdf/dist`
4. ✅ Sirve los archivos correctamente

## Notas

- El build es necesario porque el proyecto usa ES modules (`import/export`)
- Los archivos se optimizan y minifican durante el build
- Los favicons se copian automáticamente al directorio `assets/` durante el build

