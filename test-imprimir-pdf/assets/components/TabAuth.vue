<template>
  <div class="tab-auth">
    <h2>🔐 Autenticación</h2>
    <p>Componente TabAuth - En construcción</p>
  </div>
</template>

<script>
export default {
  name: 'TabAuth',
  inject: {
    showToast: {
      from: 'showToast',
      default: () => (msg) => console.log(msg)
    }
  },
  mounted() {
    console.log('✅ TabAuth montado - provide/inject funciona');
  }
}
</script>

<style scoped>
.tab-auth {
  padding: 2rem;
}
</style>
