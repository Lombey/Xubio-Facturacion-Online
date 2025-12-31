<template>
  <div class="tab-cobranza">
    <h2>💰 Cobranzas</h2>
    <p>Componente TabCobranza - En construcción</p>
  </div>
</template>

<script>
export default {
  name: 'TabCobranza',
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
    console.log('✅ TabCobranza montado - SDK disponible:', !!this.sdk);
  }
}
</script>

<style scoped>
.tab-cobranza {
  padding: 2rem;
}
</style>
