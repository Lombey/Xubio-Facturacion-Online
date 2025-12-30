import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: './', // Rutas relativas para compatibilidad con Vercel
  plugins: [
    vue(),
    visualizer({
      open: false, // No abrir en CI/CD (Vercel)
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // 'treemap', 'sunburst', 'network'
    })
  ],
  build: {
    // Target: Vite usa 'baseline-widely-available' por defecto (Chrome 107+, Edge 107+, Firefox 104+, Safari 16+)
    // No lo especificamos explícitamente para evitar conflictos con esbuild en CSS
    
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
    
    // Module preload (habilitado por defecto, pero explícito para claridad)
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

