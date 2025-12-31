<template>
  <div class="tab-factura">
    <h2>🧾 Facturación</h2>
    <p>Componente TabFactura - En construcción</p>
  </div>
</template>

<script>
export default {
  name: 'TabFactura',
  inject: {
    sdk: {
      from: 'sdk',
      default: () => null
    },
    showToast: {
      from: 'showToast',
      default: () => (msg) => console.log(msg)
    }
  },
  mounted() {
    console.log('✅ TabFactura montado - SDK disponible:', !!this.sdk);
  }
}
</script>

<style scoped>
.tab-factura {
  padding: 2rem;
}
</style>
