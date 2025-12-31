<template>
  <div class="container">
    <h1>🧪 Test Xubio - Imprimir PDF</h1>
    <p class="subtitle">Prueba completa: Facturas y Cobranzas con obtención de PDF</p>

    <!-- 🧪 FASE 1: Sistema de Pestañas (En Desarrollo) -->
    <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border: 2px dashed #2196F3; border-radius: 8px;">
      <div style="font-weight: bold; margin-bottom: 10px; color: #1976d2;">
        🚧 Refactor en Progreso - Navegación por Pestañas (Fase 1)
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button
          @click="currentTab = 'auth'"
          :style="currentTab === 'auth' ? 'background: #2196F3; color: white;' : 'background: #f5f5f5;'"
          style="padding: 10px 20px; border: 1px solid #2196F3; border-radius: 4px; cursor: pointer; font-weight: 500;">
          🔐 Autenticación
        </button>
        <button
          @click="currentTab = 'factura'"
          :style="currentTab === 'factura' ? 'background: #2196F3; color: white;' : 'background: #f5f5f5;'"
          style="padding: 10px 20px; border: 1px solid #2196F3; border-radius: 4px; cursor: pointer; font-weight: 500;">
          🧾 Facturas
        </button>
        <button
          @click="currentTab = 'cobranza'"
          :style="currentTab === 'cobranza' ? 'background: #2196F3; color: white;' : 'background: #f5f5f5;'"
          style="padding: 10px 20px; border: 1px solid #2196F3; border-radius: 4px; cursor: pointer; font-weight: 500;">
          💰 Cobranzas
        </button>
      </div>
      <div style="font-size: 12px; color: #1976d2;">
        Pestaña activa: <strong>{{ currentTab }}</strong> |
        <span style="cursor: pointer; text-decoration: underline;" @click="currentTab = 'legacy'">
          Ver interfaz original
        </span>
      </div>
    </div>

    <!-- Componentes de Pestañas (Scaffolds Vacíos - Fase 1) -->
    <tab-auth v-if="currentTab === 'auth'" @login-success="handleLogin"></tab-auth>
    <tab-factura v-if="currentTab === 'factura'" @show-pdf="handleShowPdf"></tab-factura>
    <tab-cobranza v-if="currentTab === 'cobranza'" @show-pdf="handleShowPdf"></tab-cobranza>

    <!-- Visor PDF Global -->
    <pdf-viewer :url="pdfUrl" :visible="pdfVisible" @close="closePdf"></pdf-viewer>
  </div>
</template>

<script>
// Importar las opciones del componente desde app.js
import { appOptions } from './app.js';

export default {
  ...appOptions,
  name: 'App'
};
</script>

