# ADR-003: Optimizaciones de Build con Vite

**Fecha:** 2025-01-27  
**Estado:** ✅ Implementado  
**Contexto:** Revisión de configuración de Vite vs. documentación oficial

## Contexto

Se realizó una revisión exhaustiva de la configuración actual de Vite comparándola con las mejores prácticas y documentación oficial de Vite 5.x para identificar oportunidades de optimización en el proceso de build y el rendimiento de la aplicación en producción.

## Configuración Actual

### Análisis de `vite.config.js`

```javascript
export default defineConfig({
  base: './',
  plugins: [vue(), visualizer()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // ⚠️ Mantiene console.log
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Estado Actual del Código

- ✅ **Correcto:** Uso de `@vitejs/plugin-vue` oficial
- ✅ **Correcto:** Base path relativo para Vercel
- ✅ **Correcto:** Visualizer para análisis de bundle
- ⚠️ **Mejorable:** No hay estrategia de chunking manual
- ⚠️ **Mejorable:** `drop_console: false` en producción
- ⚠️ **Mejorable:** Faltan optimizaciones de build explícitas

## Comparación con Documentación Oficial

### 1. Chunking Strategy (Code Splitting)

**Documentación oficial:** [Vite Build Guide - Chunking Strategy](https://vitejs.dev/guide/build.html#chunking-strategy)

**Estado actual:** No hay configuración de `manualChunks`. Todo el código se empaqueta en un solo bundle.

**Recomendación:** Implementar estrategia de chunking para separar:
- **vendor:** Vue y dependencias
- **app:** Código de la aplicación
- **utils:** Utilidades compartidas

**Impacto esperado:**
- Mejor caché del navegador (vendor cambia menos frecuentemente)
- Carga inicial más rápida
- Mejor paralelización de descargas

### 2. build.target

**Documentación oficial:** [Build Options - build.target](https://vitejs.dev/config/build-options.html#build-target)

**Estado actual:** Usa el valor por defecto `'baseline-widely-available'` (Chrome 107+, Edge 107+, Firefox 104+, Safari 16+).

**Recomendación:** Especificar explícitamente para mejor control y transparencia:

```javascript
// Nota: No especificamos target explícitamente
// Vite usa 'baseline-widely-available' por defecto
// Especificarlo explícitamente causa conflictos con esbuild en CSS
```

**Impacto esperado:**
- Mejor control sobre compatibilidad
- Transpilación optimizada para navegadores modernos

### 3. build.assetsInlineLimit

**Documentación oficial:** [Build Options - build.assetsInlineLimit](https://vitejs.dev/config/build-options.html#build-assetsinlinelimit)

**Estado actual:** Usa el valor por defecto de 4096 (4KB).

**Recomendación:** Mantener 4KB es adecuado, pero documentarlo explícitamente:

```javascript
build: {
  assetsInlineLimit: 4096 // Assets < 4KB se inlinan como base64
}
```

**Justificación:** 4KB es un buen balance entre reducir requests HTTP y mantener el tamaño del HTML razonable.

### 4. build.cssCodeSplit

**Documentación oficial:** [Build Options - build.cssCodeSplit](https://vitejs.dev/config/build-options.html#build-csscodesplit)

**Estado actual:** Habilitado por defecto (true).

**Recomendación:** Mantener explícito para claridad:

```javascript
build: {
  cssCodeSplit: true // CSS se divide por chunks
}
```

**Impacto:** CSS se carga junto con los chunks JS correspondientes, mejorando el rendimiento.

### 5. build.cssMinify

**Documentación oficial:** [Build Options - build.cssMinify](https://vitejs.dev/config/build-options.html#build-cssminify)

**Estado actual:** Usa esbuild por defecto (más rápido).

**Recomendación:** Especificar explícitamente:

```javascript
build: {
  cssMinify: 'esbuild' // Más rápido que otras opciones
}
```

**Justificación:** esbuild es significativamente más rápido que otras opciones de minificación CSS.

### 6. Optimización de Terser

**Estado actual:** `drop_console: false` mantiene todos los `console.log` en producción.

**Recomendación:** Eliminar console.log en producción:

```javascript
build: {
  terserOptions: {
    compress: {
      drop_console: true, // Eliminar console.log en producción
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'] // Más específico
    }
  }
}
```

**Impacto esperado:**
- Reducción de ~5-10% en tamaño del bundle
- Mejor rendimiento (menos código ejecutado)
- Código más limpio en producción

### 7. build.reportCompressedSize

**Documentación oficial:** [Build Options - build.reportCompressedSize](https://vitejs.dev/config/build-options.html#build-reportcompressedsize)

**Estado actual:** Habilitado por defecto (true).

**Recomendación:** Mantener habilitado para monitoreo:

```javascript
build: {
  reportCompressedSize: true // Muestra tamaños comprimidos (gzip)
}
```

**Justificación:** Útil para monitorear el tamaño real de los bundles que los usuarios descargan.

### 8. build.chunkSizeWarningLimit

**Estado actual:** Configurado en 1000 (1MB).

**Recomendación:** Aumentar a 500KB o 1000KB según necesidades:

```javascript
build: {
  chunkSizeWarningLimit: 500 // Advertir si chunks > 500KB
}
```

**Justificación:** Chunks de 500KB-1MB son normales en aplicaciones modernas. El límite actual puede generar advertencias innecesarias.

### 9. build.modulePreload

**Documentación oficial:** [Build Options - build.modulePreload](https://vitejs.dev/config/build-options.html#build-modulepreload)

**Estado actual:** Habilitado por defecto con polyfill.

**Recomendación:** Mantener configuración por defecto (ya está habilitado):

```javascript
build: {
  modulePreload: {
    polyfill: true // Polyfill para navegadores sin soporte nativo
  }
}
```

**Impacto:** Mejora la carga de módulos dinámicos en navegadores antiguos.

### 10. Lazy Loading de Componentes

**Estado actual:** Todos los componentes se importan estáticamente:

```javascript
import ProductoSelector from './components/ProductoSelector.vue';
import ClienteSelector from './components/ClienteSelector.vue';
```

**Recomendación:** Implementar lazy loading para componentes pesados:

```javascript
// En lugar de:
import ProductoSelector from './components/ProductoSelector.vue';

// Usar:
const ProductoSelector = () => import('./components/ProductoSelector.vue');
```

**Impacto esperado:**
- Reducción del bundle inicial
- Carga bajo demanda de componentes
- Mejor Time to Interactive (TTI)

**Nota:** Evaluar si los componentes son lo suficientemente grandes como para justificar el lazy loading.

## Configuración Optimizada Propuesta

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ],
  build: {
    // Target explícito para navegadores modernos
    target: 'baseline-widely-available',
    
    // Directorio de salida
    outDir: resolve(__dirname, 'test-imprimir-pdf/dist'),
    assetsDir: 'assets',
    
    // Estrategia de chunking optimizada
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'test-imprimir-pdf/index.html')
      },
      output: {
        // Separar vendor, app y utils para mejor caching
        manualChunks: (id) => {
          // Separar node_modules (vendor)
          if (id.includes('node_modules')) {
            // Separar Vue en su propio chunk
            if (id.includes('vue')) {
              return 'vendor-vue';
            }
            // Otros vendor
            return 'vendor';
          }
          // Separar utils en su propio chunk
          if (id.includes('/utils/')) {
            return 'utils';
          }
          // Separar composables
          if (id.includes('/composables/')) {
            return 'composables';
          }
        },
        // Nombres de chunks más legibles
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Minificación optimizada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false // Eliminar comentarios
      }
    },
    
    // Optimizaciones de assets
    assetsInlineLimit: 4096, // Assets < 4KB se inlinan como base64
    
    // CSS optimizado
    cssCodeSplit: true, // CSS dividido por chunks
    cssMinify: 'esbuild', // Minificación rápida con esbuild
    
    // Sourcemaps (deshabilitado para producción)
    sourcemap: false,
    
    // Reporte de tamaños comprimidos
    reportCompressedSize: true,
    
    // Límite de advertencia de tamaño de chunk
    chunkSizeWarningLimit: 500, // Advertir si chunks > 500KB
    
    // Module preload (habilitado por defecto)
    modulePreload: {
      polyfill: true
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'test-imprimir-pdf/assets'),
      '@utils': resolve(__dirname, 'test-imprimir-pdf/assets/utils'),
      '@composables': resolve(__dirname, 'test-imprimir-pdf/assets/composables')
    }
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  root: 'test-imprimir-pdf'
});
```

## Decisiones

### Aplicar Inmediatamente

1. ✅ **Chunking Strategy:** Implementar `manualChunks` para separar vendor, app y utils
2. ✅ **Optimización de Terser:** Habilitar `drop_console: true` en producción
3. ✅ **Configuración Explícita:** Especificar todas las opciones de build relevantes
4. ✅ **Nombres de Chunks:** Mejorar nombres de archivos generados para mejor debugging

### Evaluar para Futuro

1. ⏳ **Lazy Loading:** Evaluar si los componentes justifican lazy loading
2. ⏳ **build.target personalizado:** Si se necesita soportar navegadores más antiguos, considerar `@vitejs/plugin-legacy`

## Consecuencias

### Positivas

- **Mejor Caching:** Separación de vendor permite mejor caché del navegador
- **Bundle más pequeño:** Eliminación de console.log reduce tamaño
- **Mejor rendimiento:** Chunks más pequeños se cargan más rápido
- **Mejor debugging:** Nombres de chunks más legibles facilitan debugging

### Consideraciones

- **Complejidad:** Configuración más explícita requiere mantenimiento
- **Build time:** Chunking adicional puede aumentar ligeramente el tiempo de build
- **Testing:** Necesario verificar que todos los chunks se cargan correctamente

## Métricas Obtenidas

### Resultados del Build Optimizado

Ejecutado el 2025-01-27 con `npm run build`:

```
dist/assets/js/utils-CXRB53Ve.js         3.00 kB │ gzip:  1.15 kB
dist/assets/js/composables-84mZ5aAL.js   3.65 kB │ gzip:  1.54 kB
dist/assets/js/main-DXu807q3.js         51.12 kB │ gzip: 12.63 kB
dist/assets/js/vendor-vue-Dcu8Akz5.js   59.27 kB │ gzip: 23.06 kB
dist/assets/css/main-QDTbRO3G.css        4.44 kB │ gzip:  1.31 kB
```

**Análisis:**
- ✅ **Chunking funcionando:** Código separado en 4 chunks principales
- ✅ **Vendor separado:** Vue en chunk independiente (59.27 kB, cacheable)
- ✅ **Utils y composables separados:** Mejor organización y caching
- ✅ **Tamaño total comprimido:** ~40 KB (gzip) - Excelente para una app Vue 3
- ✅ **Tiempo de build:** 3.34s - Rápido y eficiente

### Beneficios Obtenidos

1. **Mejor Caching:** Vendor chunk (Vue) se cachea independientemente
2. **Carga Paralela:** Múltiples chunks se descargan en paralelo
3. **Bundle más pequeño:** Eliminación de console.log reduce tamaño
4. **Mejor organización:** Código separado por responsabilidad

## Referencias

- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Terser Options](https://terser.org/docs/api-reference#compress-options)

## Notas de Implementación

1. **Testing:** Verificar que todos los chunks se cargan correctamente después de implementar `manualChunks`
2. **Monitoreo:** Usar `rollup-plugin-visualizer` para analizar el tamaño de los chunks
3. **CI/CD:** Asegurar que el build funciona correctamente en Vercel
4. **Rollback:** Mantener la configuración anterior como backup hasta verificar funcionamiento

---

**Autor:** Web Platform Engineer Senior  
**Revisado por:** [Pendiente]  
**Aprobado por:** [Pendiente]

