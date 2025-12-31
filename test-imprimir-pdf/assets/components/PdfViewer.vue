<template>
  <div v-if="visible" class="pdf-viewer-overlay" @click.self="$emit('close')">
    <div class="pdf-viewer-container">
      <div class="pdf-viewer-header">
        <h3>📄 Visualizador PDF</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      <iframe v-if="url" :src="url" class="pdf-iframe"></iframe>
      <p v-else>No hay PDF para mostrar</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PdfViewer',
  props: {
    url: {
      type: String,
      default: null
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  mounted() {
    console.log('✅ PdfViewer montado');
  }
}
</script>

<style scoped>
.pdf-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.pdf-viewer-container {
  background: white;
  width: 90%;
  height: 90%;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.pdf-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1.2rem;
}

.close-btn:hover {
  background: #d32f2f;
}

.pdf-iframe {
  flex: 1;
  border: none;
  width: 100%;
}
</style>
