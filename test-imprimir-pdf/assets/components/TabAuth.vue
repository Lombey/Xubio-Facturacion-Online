<template>
  <div class="tab-auth">
    <h2>🔐 Autenticación</h2>

    <div class="info">
      💡 Las credenciales están en el archivo <code>.xubio-credentials.md</code><br>
      ✅ Desplegado en Vercel - El proxy API funciona automáticamente
    </div>

    <form @submit.prevent="handleTokenSubmit" novalidate>
      <div class="form-group">
        <label for="clientId">Client ID:</label>
        <input
          type="text"
          id="clientId"
          v-model="clientId"
          placeholder="Ingresa tu Client ID"
          autocomplete="username"
        >
      </div>

      <div class="form-group">
        <label for="secretId">Secret ID:</label>
        <input
          type="password"
          id="secretId"
          v-model="secretId"
          placeholder="Ingresa tu Secret ID"
          autocomplete="current-password"
        >
      </div>

      <div class="checkbox-group">
        <input
          type="checkbox"
          id="guardarCredenciales"
          v-model="guardarCredenciales"
        >
        <label for="guardarCredenciales" style="font-weight: normal; margin: 0;">
          Guardar credenciales en localStorage
        </label>
      </div>

      <button
        type="button"
        @click.prevent="handleTokenSubmit($event)"
        :disabled="isLoading"
      >
        Obtener Token
      </button>

      <button
        type="button"
        class="btn-danger"
        @click="limpiarCredenciales()"
        :disabled="isLoading"
      >
        Limpiar Credenciales
      </button>
    </form>

    <div
      v-if="isLoading && loadingContext && loadingContext.includes('token')"
      class="info"
    >
      ⏳ <span v-text="loadingContext"></span>
    </div>

    <div
      v-if="tokenResult.visible"
      :class="['result', tokenResult.type]"
      v-html="formatoMensaje(tokenResult.message)"
    ></div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth.js';

export default {
  name: 'TabAuth',
  inject: {
    showToast: {
      from: 'showToast',
      default: () => (msg) => console.log(msg)
    }
  },
  emits: ['login-success'],
  data() {
    return {
      clientId: '',
      secretId: '',
      guardarCredenciales: false,
      accessToken: null,
      tokenExpiration: null,
      tokenResult: { message: '', type: '', visible: false },
      isLoading: false,
      loadingContext: ''
    };
  },
  computed: {
    tokenValido() {
      return this.accessToken &&
             this.tokenExpiration &&
             Date.now() < this.tokenExpiration - 60000;
    }
  },
  mounted() {
    console.log('✅ TabAuth montado');
    // Cargar credenciales desde localStorage si existen
    const savedClientId = localStorage.getItem('xubio_clientId');
    const savedSecretId = localStorage.getItem('xubio_secretId');
    const savedToken = localStorage.getItem('xubio_token');
    const savedExpiration = localStorage.getItem('xubio_tokenExpiration');

    if (savedClientId) this.clientId = savedClientId;
    if (savedSecretId) this.secretId = savedSecretId;
    if (savedToken && savedExpiration) {
      this.accessToken = savedToken;
      this.tokenExpiration = parseInt(savedExpiration, 10);

      // Si el token es válido, notificar automáticamente
      if (this.tokenValido) {
        console.log('✅ Token válido encontrado en localStorage');
        this.showToast('Token válido cargado desde localStorage', 'success');
        this.emitLoginSuccess();
      } else {
        console.log('⚠️ Token expirado encontrado en localStorage');
      }
    }
  },
  methods: {
    handleTokenSubmit(event) {
      console.log('🚀 handleTokenSubmit llamado', { event, hasEvent: !!event });

      // Prevenir comportamiento por defecto del formulario
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('✅ Evento prevenido');
      } else {
        console.warn('⚠️ No se recibió evento, pero continuando...');
      }

      console.log('📝 Formulario de token enviado');
      console.log('📝 Valores:', {
        clientId: this.clientId ? this.clientId.substring(0, 5) + '...' : 'vacío',
        hasSecretId: !!this.secretId,
        isLoading: this.isLoading
      });

      // Validar que hay credenciales antes de intentar obtener token
      if (!this.clientId || !this.clientId.trim()) {
        this.mostrarResultado('Error: Ingresa el Client ID', 'error');
        return;
      }
      if (!this.secretId || !this.secretId.trim()) {
        this.mostrarResultado('Error: Ingresa el Secret ID', 'error');
        return;
      }

      this.obtenerToken();
    },

    async obtenerToken(forceRefresh = false) {
      console.log('🔐 obtenerToken llamado:', { forceRefresh, hasClientId: !!this.clientId, hasSecretId: !!this.secretId });

      let clientId = this.clientId.trim();
      let secretId = this.secretId.trim();

      // Si no hay en el formulario, intentar desde localStorage
      if (!clientId) {
        clientId = localStorage.getItem('xubio_clientId') || '';
        console.log('📦 ClientId obtenido de localStorage:', !!clientId);
      }
      if (!secretId) {
        secretId = localStorage.getItem('xubio_secretId') || '';
        console.log('📦 SecretId obtenido de localStorage:', !!secretId);
      }

      if (!clientId || !secretId) {
        console.error('❌ Credenciales faltantes:', { hasClientId: !!clientId, hasSecretId: !!secretId });
        this.mostrarResultado('Error: Completa Client ID y Secret ID', 'error');
        return;
      }

      // Verificar si el token actual es válido
      if (!forceRefresh && this.tokenValido) {
        this.mostrarResultado('✅ Token aún válido, no es necesario renovarlo', 'success');
        return;
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo token...';
      this.mostrarResultado('Obteniendo token...', 'info');

      try {
        console.log('📤 Enviando petición de autenticación a /api/auth...', { clientId: clientId.substring(0, 5) + '...', hasSecretId: !!secretId });

        // Agregar timeout para evitar que se quede colgado
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error('⏱️ Timeout: La petición tardó más de 30 segundos');
          controller.abort();
        }, 30000); // 30 segundos timeout

        let response;
        try {
          const fetchPromise = fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ clientId, secretId }),
            signal: controller.signal
          });

          console.log('⏳ Esperando respuesta del servidor...');
          response = await fetchPromise;
          clearTimeout(timeoutId);
          console.log('✅ Respuesta recibida del servidor');
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('❌ Error en fetch:', fetchError);
          if (fetchError.name === 'AbortError') {
            throw new Error('La petición de autenticación tardó demasiado (timeout de 30 segundos). Verifica tu conexión a internet y que el endpoint /api/auth esté disponible.');
          }
          throw fetchError;
        }

        console.log('📥 Token response:', response.status, response.statusText, response.ok);

        let data;
        try {
          data = await response.json();
          console.log('📄 Token response parsed:', data);
        } catch (parseError) {
          console.error('❌ Error parseando token response:', parseError);
          const errorText = await response.text().catch(() => 'Sin respuesta');
          throw new Error(`Error parseando respuesta del token: ${parseError.message}. Respuesta recibida: ${errorText.substring(0, 200)}`);
        }

        if (response.ok && data) {
          const token = data.access_token || data.token;

          // Validar que el token existe
          if (!token) {
            console.error('❌ Token no encontrado en la respuesta:', data);
            const errorMsg = `❌ Error: El servidor no devolvió un token válido.\n\nRespuesta recibida: ${JSON.stringify(data, null, 2)}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`;
            this.mostrarResultado(errorMsg, 'error');
            return;
          }

          this.accessToken = token;
          const expiresIn = parseInt(data.expires_in || 3600, 10);
          this.tokenExpiration = Date.now() + (expiresIn * 1000);

          console.log('✅ Token obtenido y guardado:', {
            tokenLength: this.accessToken.length,
            expiresIn,
            expiration: new Date(this.tokenExpiration).toLocaleString(),
            tokenValido: this.tokenValido
          });

          if (this.guardarCredenciales) {
            localStorage.setItem('xubio_clientId', clientId);
            localStorage.setItem('xubio_secretId', secretId);
            localStorage.setItem('xubio_token', this.accessToken);
            localStorage.setItem('xubio_tokenExpiration', this.tokenExpiration.toString());
          }

          // Validar que el token se guardó correctamente
          if (!this.accessToken) {
            console.error('❌ Error: Token no se guardó en this.accessToken');
            this.mostrarResultado('❌ Error: El token no se guardó correctamente. Revisa la consola (F12).', 'error');
            return;
          }

          this.mostrarResultado(
            `✅ Token obtenido exitosamente!\n\nToken: ${this.accessToken.substring(0, 50)}...\nExpira en: ${expiresIn} segundos\nVálido hasta: ${new Date(this.tokenExpiration).toLocaleString()}`,
            'success'
          );

          // Usar showToast para notificación
          this.showToast('Login exitoso', 'success');

          // Emitir evento login-success para que app.js maneje
          this.emitLoginSuccess();

        } else {
          console.error('❌ Error en respuesta de token:', {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          const errorMsg = `❌ Error obteniendo token:\n\nStatus: ${response.status} ${response.statusText}\n\n${data?.error || data?.message || 'Error desconocido'}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`;
          this.mostrarResultado(errorMsg, 'error');
        }
      } catch (error) {
        console.error('❌ Error completo en obtenerToken:', error);

        // Manejar diferentes tipos de errores
        let errorMessage = error.message || 'Error desconocido';

        if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
          errorMessage = 'La petición tardó demasiado. Verifica tu conexión a internet y que el servidor esté disponible.';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Error de red. Verifica tu conexión a internet y que el endpoint /api/auth esté disponible.';
        }

        this.mostrarResultado(
          `❌ Error obteniendo token:\n\n${errorMessage}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`,
          'error'
        );
        this.showToast(`Error: ${errorMessage}`, 'error');
      } finally {
        // Asegurar que siempre se limpien los estados
        this.isLoading = false;
        this.loadingContext = '';
        console.log('✅ Estados de loading limpiados');
      }
    },

    limpiarCredenciales() {
      // Usar el composable para limpiar
      const auth = useAuth();
      auth.limpiarCredenciales();

      // Sincronizar con el estado del componente
      this.clientId = '';
      this.secretId = '';
      this.accessToken = null;
      this.tokenExpiration = null;
      this.mostrarResultado('✅ Credenciales y token eliminados del almacenamiento local', 'success');
      this.showToast('Credenciales limpiadas', 'success');
    },

    mostrarResultado(message, type) {
      this.tokenResult = {
        message,
        type,
        visible: true
      };
    },

    formatoMensaje(mensaje) {
      if (!mensaje) return '';
      return mensaje.replace(/\n/g, '<br>');
    },

    emitLoginSuccess() {
      this.$emit('login-success', {
        token: this.accessToken,
        expiration: this.tokenExpiration,
        clientId: this.clientId,
        secretId: this.secretId
      });
    }
  }
}
</script>

<style scoped>
.tab-auth {
  padding: 2rem;
}

.section {
  margin-bottom: 2rem;
}

.info {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  border-left: 4px solid #2196F3;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-group {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

button {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 10px;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

button.btn-danger {
  background: #f44336;
}

button.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.result {
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
  white-space: pre-wrap;
  font-family: monospace;
}

.result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style>
