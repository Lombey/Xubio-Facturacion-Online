// @ts-nocheck - Vue desde CDN no tiene tipos completos

/**
 * app.js Simplificado - Fase 6: Divide y Vencerás
 *
 * Este archivo contiene SOLO la lógica esencial para orquestar los componentes Tab.
 * Toda la lógica de negocio (facturas, cobranzas, auth) está en los componentes Tab respectivos.
 *
 * Responsabilidades:
 * - Navegación entre pestañas (currentTab)
 * - Visor PDF global (pdfUrl, pdfVisible)
 * - Proveer SDK y showToast a componentes hijos
 * - Handlers de eventos de componentes Tab
 */

// Importar servicio de API
import { createXubioApiClient } from './services/xubioApi.js';

// Importar componentes de pestañas
import TabAuth from './components/TabAuth.vue';
import TabFactura from './components/TabFactura.vue';
import TabCobranza from './components/TabCobranza.vue';
import PdfViewer from './components/PdfViewer.vue';

/**
 * Opciones del componente principal - exportadas para ser usadas en App.vue (SFC)
 * Esto permite usar Vue sin el compilador de templates en runtime (~16KB menos)
 */
export const appOptions = {
  data() {
    return {
      // Sistema de Pestañas
      currentTab: 'auth', // Pestaña activa: 'auth', 'factura', 'cobranza'

      // Visor PDF Global
      pdfUrl: null, // URL del PDF a mostrar
      pdfVisible: false, // Controla visibilidad del PdfViewer global

      // Autenticación (solo para mantener token y SDK)
      accessToken: null,
      tokenExpiration: null,
      clientId: null,
      secretId: null,
      xubioSdk: null // Instancia del API client (se inicializa en handleLogin)
    };
  },

  /**
   * Sistema provide/inject para componentes Tab
   * Provee SDK y showToast a todos los componentes hijos
   */
  provide() {
    return {
      sdk: () => this.xubioSdk,
      showToast: this.showToast
    };
  },

  components: {
    TabAuth,
    TabFactura,
    TabCobranza,
    PdfViewer
  },

  methods: {
    /**
     * Muestra notificación tipo toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     */
    showToast(message, type = 'info') {
      const emoji = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      console.log(`${emoji[type] || 'ℹ️'} ${message}`);
    },

    /**
     * Verifica si el token actual es válido
     * @returns {boolean} true si el token es válido
     */
    isTokenValid() {
      return this.accessToken &&
             this.tokenExpiration &&
             Date.now() < this.tokenExpiration - 60000;
    },

    /**
     * Obtiene el token actual (sin renovación automática)
     * @returns {string|null} Token de acceso actual
     */
    getAccessToken() {
      return this.accessToken;
    },

    /**
     * Renueva el token de acceso
     * @returns {Promise<string>} Token renovado
     */
    async renewToken() {
      if (!this.clientId || !this.secretId) {
        throw new Error('Credenciales no disponibles para renovar token');
      }

      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: this.clientId,
            secretId: this.secretId
          })
        });

        if (!response.ok) {
          throw new Error('Error renovando token');
        }

        const data = await response.json();
        this.accessToken = data.access_token || data.token;
        const expiresIn = parseInt(data.expires_in || 3600, 10);
        this.tokenExpiration = Date.now() + (expiresIn * 1000);

        return this.accessToken;
      } catch (error) {
        console.error('❌ Error renovando token:', error);
        throw error;
      }
    },

    /**
     * Maneja la visualización del PDF global
     * @param {string} url - URL del PDF a mostrar
     */
    handleShowPdf(url) {
      this.pdfUrl = url;
      this.pdfVisible = true;
    },

    /**
     * Cierra el visor de PDF global
     */
    closePdf() {
      this.pdfVisible = false;
      this.pdfUrl = null;
    },

    /**
     * Maneja el login exitoso desde TabAuth
     * @param {Object} data - { token, expiration, clientId, secretId }
     */
    handleLogin(data) {
      // Guardar credenciales y token
      this.accessToken = data.token;
      this.tokenExpiration = data.expiration;
      this.clientId = data.clientId;
      this.secretId = data.secretId;

      // Crear API client con las funciones necesarias
      this.xubioSdk = createXubioApiClient(
        () => this.renewToken(),
        () => this.isTokenValid(),
        () => this.getAccessToken()
      );

      // Cambiar a pestaña de facturación
      this.currentTab = 'factura';
      this.showToast('Login exitoso. Redirigiendo a Facturas...', 'success');
    }
  }
};

// Export por defecto para compatibilidad
export default appOptions;
