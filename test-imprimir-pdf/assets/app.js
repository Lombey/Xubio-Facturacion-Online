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

// Importar SDK
import { XubioClient } from '../sdk/xubioClient.js';

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
      xubioSdk: null // Instancia del SDK (se inicializa en handleLogin)
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
     * @param {Object} data - { token, expiration }
     */
    handleLogin(data) {
      this.accessToken = data.token;
      this.tokenExpiration = data.expiration;
      this.xubioSdk = new XubioClient(data.token);
      this.currentTab = 'factura'; // Cambiar a pestaña de facturación
      this.showToast('Login exitoso. Redirigiendo a Facturas...', 'success');
    }
  }
};

// Export por defecto para compatibilidad
export default appOptions;
