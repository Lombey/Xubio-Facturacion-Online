import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
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
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'test-imprimir-pdf/index.html')
      }
    },
    // Optimizaciones
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.log para debugging
        drop_debugger: true
      }
    },
    // Code splitting
    chunkSizeWarningLimit: 1000
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

