// @ts-nocheck - Vue desde CDN no tiene tipos completos
// Configuración para Vercel - siempre usar /api/proxy
const PROXY_BASE = '/api/proxy';

// @ts-ignore - Vue se carga desde CDN
const { createApp } = Vue;

/**
 * @typedef {Object} AppData
 * @property {string|null} accessToken
 * @property {number|null} tokenExpiration
 * @property {string} clientId
 * @property {string} secretId
 * @property {boolean} guardarCredenciales
 * @property {Object} tokenResult
 * @property {string} facturaClienteId
 * @property {string} facturaTipoimpresion
 * @property {string} facturaJson
 * @property {Object} facturaResult
 * @property {string} facturaPdfViewerHtml
 * @property {boolean} facturaPdfViewerVisible
 * @property {string} cobranzaClienteId
 * @property {string} cobranzaIdComprobante
 * @property {string} cobranzaImporte
 * @property {string} cobranzaTipoimpresion
 * @property {string} cobranzaJson
 * @property {Object} cobranzaResult
 * @property {string} cobranzaPdfViewerHtml
 * @property {boolean} cobranzaPdfViewerVisible
 * @property {string} transaccionId
 * @property {string} tipoimpresion
 * @property {Object} pdfResult
 * @property {string} pdfViewerHtml
 * @property {boolean} pdfViewerVisible
 * @property {Array} facturasList
 * @property {Object} facturasListResult
 * @property {number|null} facturaSeleccionada
 * @property {boolean} isLoading
 * @property {string} loadingContext
 */

/**
 * @typedef {Object} AppMethods
 * @property {() => boolean} tokenValido
 * @property {(mensaje: string) => string} formatoMensaje
 * @property {(seccion: string, mensaje: string, tipo: string) => void} mostrarResultado
 * @property {(forceRefresh?: boolean) => Promise<void>} obtenerToken
 * @property {() => void} limpiarCredenciales
 * @property {(endpoint: string, method?: string, payload?: any, queryParams?: any) => Promise<any>} requestXubio
 * @property {(transaccionId?: string, tipoimpresion?: string, seccion?: string) => Promise<void>} obtenerPDF
 * @property {(valor: number) => void} probarTipo
 * @property {() => Promise<void>} flujoCompletoFactura
 * @property {() => Promise<void>} soloCrearFactura
 * @property {() => Promise<void>} flujoCompletoCobranza
 * @property {() => Promise<void>} soloCrearCobranza
 * @property {() => Promise<void>} listarFacturasUltimoMes
 * @property {(factura: any) => void} seleccionarFactura
 */

// @ts-ignore - Vue component definition
const app = createApp({
  data() {
    return {
      // Autenticación
      accessToken: null,
      tokenExpiration: null,
      clientId: '',
      secretId: '',
      guardarCredenciales: true,
      tokenResult: { message: '', type: '', visible: false },
      
      // Facturas
      facturaClienteId: '',
      facturaTipoimpresion: '1',
      facturaJson: '',
      facturaResult: { message: '', type: '', visible: false },
      facturaPdfViewerHtml: '',
      facturaPdfViewerVisible: false,
      
      // Cobranzas
      cobranzaClienteId: '',
      cobranzaIdComprobante: '',
      cobranzaImporte: '',
      cobranzaTipoimpresion: '1',
      cobranzaJson: '',
      cobranzaResult: { message: '', type: '', visible: false },
      cobranzaPdfViewerHtml: '',
      cobranzaPdfViewerVisible: false,
      
      // PDF Comprobante Existente
      transaccionId: '',
      tipoimpresion: '1',
      pdfResult: { message: '', type: '', visible: false },
      pdfViewerHtml: '',
      pdfViewerVisible: false,
      
      // Lista de Facturas
      facturasList: [],
      facturasListResult: { message: '', type: '', visible: false },
      facturaSeleccionada: null,
      
      // Estados de carga y error
      isLoading: false,
      loadingContext: ''
    };
  },
  computed: {
    /** @returns {boolean} */
    tokenValido() {
      // @ts-ignore - Vue instance context
      return this.accessToken && 
             // @ts-ignore
             this.tokenExpiration && 
             // @ts-ignore
             Date.now() < this.tokenExpiration - 60000;
    }
  },
  async mounted() {
    // Cargar credenciales guardadas
    const savedClientId = localStorage.getItem('xubio_clientId');
    const savedSecretId = localStorage.getItem('xubio_secretId');
    
    if (savedClientId) {
      this.clientId = savedClientId;
    }
    if (savedSecretId) {
      this.secretId = savedSecretId;
    }

    // Intentar cargar token guardado primero
    const savedToken = localStorage.getItem('xubio_token');
    const savedExpiration = localStorage.getItem('xubio_tokenExpiration');

    if (savedToken && savedExpiration && Date.now() < parseInt(savedExpiration) - 60000) {
      this.accessToken = savedToken;
      this.tokenExpiration = parseInt(savedExpiration);
      this.mostrarResultado('token', 
        `✅ Token cargado desde localStorage (válido hasta ${new Date(this.tokenExpiration).toLocaleString()})\n\n💡 Si el token expiró, haz clic en "Obtener Token" para renovarlo.`, 
        'success'
      );
    } else if (savedClientId && savedSecretId) {
      // Si hay credenciales guardadas pero no hay token válido, obtener uno nuevo automáticamente
      await this.obtenerToken();
    } else {
      this.mostrarResultado('token',
        '⚠️ Ingresa tus credenciales de Xubio y haz clic en "Obtener Token"\n\n💡 Las credenciales están en el archivo .xubio-credentials.md', 
        'info'
      );
    }
  },
  methods: {
    /**
     * @param {string} mensaje
     * @returns {string}
     */
    formatoMensaje(mensaje) {
      return mensaje ? mensaje.replace(/\n/g, '<br>') : '';
    },
    
    /**
     * @param {string} seccion
     * @param {string} mensaje
     * @param {string} tipo
     */
    mostrarResultado(seccion, mensaje, tipo) {
      // @ts-ignore - Dynamic property access
      const result = this[`${seccion}Result`];
      result.message = mensaje;
      result.type = tipo;
      result.visible = true;
    },
    
    /**
     * Obtiene un token de acceso de Xubio
     * @param {boolean} forceRefresh - Si es true, fuerza la renovación del token
     */
    async obtenerToken(forceRefresh = false) {
      let clientId = this.clientId.trim();
      let secretId = this.secretId.trim();
      
      // Si no hay en el formulario, intentar desde localStorage
      if (!clientId) {
        clientId = localStorage.getItem('xubio_clientId') || '';
      }
      if (!secretId) {
        secretId = localStorage.getItem('xubio_secretId') || '';
      }

      if (!clientId || !secretId) {
        this.mostrarResultado('token', 'Error: Completa Client ID y Secret ID', 'error');
        return;
      }

      // Verificar si el token actual es válido
      if (!forceRefresh && this.tokenValido) {
        this.mostrarResultado('token', '✅ Token aún válido, no es necesario renovarlo', 'success');
        return;
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo token...';
      this.isLoading = true;
      this.loadingContext = 'Obteniendo token...';
      this.mostrarResultado('token', 'Obteniendo token...', 'info');

      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ clientId, secretId })
        });

        console.log('📥 Token response:', response.status, response.statusText);

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
          this.accessToken = data.access_token || data.token;
          const expiresIn = parseInt(data.expires_in || 3600, 10);
          this.tokenExpiration = Date.now() + (expiresIn * 1000);

          if (this.guardarCredenciales) {
            localStorage.setItem('xubio_clientId', clientId);
            localStorage.setItem('xubio_secretId', secretId);
            localStorage.setItem('xubio_token', this.accessToken);
            localStorage.setItem('xubio_tokenExpiration', this.tokenExpiration.toString());
          }

          this.mostrarResultado('token',
            `✅ Token obtenido exitosamente!\n\nToken: ${this.accessToken.substring(0, 50)}...\nExpira en: ${expiresIn} segundos\nVálido hasta: ${new Date(this.tokenExpiration).toLocaleString()}`,
            'success'
          );
        } else {
          const errorMsg = `❌ Error obteniendo token:\n\nStatus: ${response.status} ${response.statusText}\n\n${data.error || data.message || 'Error desconocido'}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`;
          this.mostrarResultado('token', errorMsg, 'error');
        }
      } catch (error) {
        this.handleError(error, 'Obtención de token', 'token');
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },

    limpiarCredenciales() {
      localStorage.removeItem('xubio_clientId');
      localStorage.removeItem('xubio_secretId');
      localStorage.removeItem('xubio_token');
      localStorage.removeItem('xubio_tokenExpiration');
      this.clientId = '';
      this.secretId = '';
      this.accessToken = null;
      this.tokenExpiration = null;
      this.mostrarResultado('token', '✅ Credenciales y token eliminados del almacenamiento local', 'success');
    },

    /**
     * Realiza una petición a la API de Xubio a través del proxy
     * @param {string} endpoint - Endpoint de la API (ej: '/comprobanteVentaBean')
     * @param {string} method - Método HTTP ('GET', 'POST', etc.)
     * @param {object|null} payload - Payload para POST/PUT
     * @param {object|null} queryParams - Parámetros de query string
     * @returns {Promise<{response: Response, data: object}>}
     */
    async requestXubio(endpoint, method = 'GET', payload = null, queryParams = null) {
      // Verificar y renovar token si es necesario
      if (!this.tokenValido) {
        await this.obtenerToken(true);
      }

      // Construir URL usando el proxy
      let url = `${PROXY_BASE}${endpoint}`;
      
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        url += '?' + params.toString();
      }

      const options = {
        method: method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      };

      if (method !== 'GET' && payload) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(payload);
      }

      console.log('🔍 Request Xubio:', { url, method, payload: payload ? JSON.stringify(payload).substring(0, 200) : null });

      try {
        const response = await fetch(url, options);
        
        console.log('📥 Response recibida:', response.status, response.statusText);

        let data;
        try {
          const text = await response.text();
          console.log('📄 Response body (primeros 500 chars):', text.substring(0, 500));
          data = text ? JSON.parse(text) : null;
        } catch (parseError) {
          console.error('❌ Error parseando JSON:', parseError);
          throw new Error(`Error parseando respuesta JSON: ${parseError.message}`);
        }

        // Si el token expiró, renovar y reintentar
        if (response.status === 401) {
          console.log('🔄 Token expirado, renovando...');
          await this.obtenerToken(true);
          options.headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, options);
          const retryText = await retryResponse.text();
          const retryData = retryText ? JSON.parse(retryText) : null;
          return { response: retryResponse, data: retryData };
        }

        return { response, data };
      } catch (error) {
        console.error('❌ Error en fetch:', error);
        throw error;
      }
    },

    /**
     * Obtiene el PDF de un comprobante
     * @param {string|null} transaccionId - ID de transacción
     * @param {string|null} tipoimpresion - Tipo de impresión
     * @param {string} seccion - Sección donde mostrar el resultado ('pdf', 'factura', 'cobranza')
     */
    async obtenerPDF(transaccionId = null, tipoimpresion = null, seccion = 'pdf') {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      const transIdStr = transaccionId || this.transaccionId.trim();
      const tipoStr = tipoimpresion || this.tipoimpresion.trim();
      const resultKey = seccion === 'factura' ? 'factura' : seccion === 'cobranza' ? 'cobranza' : 'pdf';
      const viewerKey = `${resultKey}PdfViewer`;

      if (!transIdStr || !tipoStr) {
        this.mostrarResultado(resultKey, 'Error: Completa Transaction ID y Tipo Impresión', 'error');
        return;
      }

      // Convertir a enteros y validar que sean mayores a 0
      const transId = parseInt(transIdStr, 10);
      const tipo = parseInt(tipoStr, 10);

      if (isNaN(transId) || transId <= 0) {
        this.mostrarResultado(resultKey, 'Error: Transaction ID debe ser un número mayor a 0', 'error');
        return;
      }

      if (isNaN(tipo) || tipo <= 0) {
        this.mostrarResultado(resultKey, 'Error: Tipo Impresión debe ser un número mayor a 0', 'error');
        return;
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo PDF...';
      this.mostrarResultado(resultKey, 'Obteniendo PDF...', 'info');
      this[`${viewerKey}Visible`] = false;

      try {
        const { response, data } = await this.requestXubio('/imprimirPDF', 'GET', null, {
          idtransaccion: transId,
          tipoimpresion: tipo
        });

        if (response.ok && data.urlPdf) {
          let mensaje = `✅ PDF obtenido exitosamente!\n\n`;
          mensaje += `URL PDF: ${data.urlPdf}\n`;
          mensaje += `Nombre XML: ${data.nombrexml || 'N/A'}\n`;
          mensaje += `DataSource: ${data.datasource || 'N/A'}\n\n`;
          mensaje += `Respuesta completa:\n${JSON.stringify(data, null, 2)}`;

          this.mostrarResultado(resultKey, mensaje, 'success');

          // Mostrar PDF en iframe
          this[`${viewerKey}Html`] = `
            <div style="padding: 10px; background: #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
              <strong>Vista previa del PDF</strong>
              <div>
                <a href="${data.urlPdf}" download style="margin-right: 10px; color: #2196F3; text-decoration: none;">⬇️ Descargar</a>
                <a href="${data.urlPdf}" target="_blank" style="color: #2196F3; text-decoration: none;">🔗 Abrir en nueva pestaña</a>
              </div>
            </div>
            <iframe src="${data.urlPdf}"></iframe>
          `;
          this[`${viewerKey}Visible`] = true;
        } else {
          this.mostrarResultado(resultKey,
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.handleError(error, 'Obtención de PDF', resultKey);
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },

    probarTipo(valor) {
      this.tipoimpresion = valor.toString();
      this.obtenerPDF();
    },

    async flujoCompletoFactura() {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      const clienteId = this.facturaClienteId.trim();

      if (!clienteId) {
        this.mostrarResultado('factura', 'Error: Completa Cliente ID', 'error');
        return;
      }

      this.isLoading = true;
      this.loadingContext = 'Creando factura...';
      this.mostrarResultado('factura', 'Creando factura...', 'info');
      this.facturaPdfViewerVisible = false;

      try {
        let payload;
        if (this.facturaJson.trim()) {
          payload = JSON.parse(this.facturaJson);
        } else {
          payload = {
            circuitoContable: { ID: 1 },
            comprobante: 1,
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            detalleComprobantes: [{
              cantidad: 1,
              precio: 100
            }]
          };
        }

        const { response, data } = await this.requestXubio('/comprobanteVentaBean', 'POST', payload);

        if (response.ok) {
          const transaccionId = data.transaccionId || data.transaccionid || data.id;
          let mensaje = `✅ Factura creada exitosamente!\n\n`;
          mensaje += `Transaction ID: ${transaccionId}\n`;
          mensaje += `ID: ${data.id || data.ID || 'N/A'}\n\n`;
          mensaje += `Obteniendo PDF...\n\n`;

          this.mostrarResultado('factura', mensaje, 'success');
          await this.obtenerPDF(transaccionId, this.facturaTipoimpresion, 'factura');
        } else {
          this.mostrarResultado('factura',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.handleError(error, 'Flujo completo factura', 'factura');
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },

    async soloCrearFactura() {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      const clienteId = this.facturaClienteId.trim();

      if (!clienteId) {
        this.mostrarResultado('factura', 'Error: Completa Cliente ID', 'error');
        return;
      }

      this.mostrarResultado('factura', 'Creando factura...', 'info');

      try {
        let payload;
        if (this.facturaJson.trim()) {
          payload = JSON.parse(this.facturaJson);
        } else {
          payload = {
            circuitoContable: { ID: 1 },
            comprobante: 1,
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            detalleComprobantes: [{ cantidad: 1, precio: 100 }]
          };
        }

        const { response, data } = await this.requestXubio('/comprobanteVentaBean', 'POST', payload);

        if (response.ok) {
          const transaccionId = data.transaccionId || data.transaccionid || data.id;
          let mensaje = `✅ Factura creada exitosamente!\n\n`;
          mensaje += `Transaction ID: ${transaccionId}\n`;
          mensaje += `ID: ${data.id || data.ID || 'N/A'}\n\n`;
          mensaje += `Respuesta completa:\n${JSON.stringify(data, null, 2)}`;

          if (transaccionId) {
            this.transaccionId = transaccionId.toString();
            mensaje += `\n\n💡 Transaction ID copiado al campo de "Obtener PDF de Comprobante Existente"`;
          }

          this.mostrarResultado('factura', mensaje, 'success');
        } else {
          this.mostrarResultado('factura',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('factura', `❌ Error: ${error.message}`, 'error');
      }
    },

    async flujoCompletoCobranza() {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      const clienteId = this.cobranzaClienteId.trim();
      const idComprobante = this.cobranzaIdComprobante.trim();
      const importe = this.cobranzaImporte.trim();

      if (!clienteId || !idComprobante || !importe) {
        this.mostrarResultado('cobranza', 'Error: Completa Cliente ID, ID Comprobante e Importe', 'error');
        return;
      }

      this.mostrarResultado('cobranza', 'Creando cobranza...', 'info');
      this.cobranzaPdfViewerVisible = false;

      try {
        let payload;
        if (this.cobranzaJson.trim()) {
          payload = JSON.parse(this.cobranzaJson);
        } else {
          const compResponse = await this.requestXubio(`/comprobanteVentaBean/${idComprobante}`, 'GET');
          if (!compResponse.response.ok) {
            throw new Error('No se pudo obtener el comprobante. Verifica el ID.');
          }
          const comp = compResponse.data;

          payload = {
            circuitoContable: comp.circuitoContable || { ID: 1 },
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            monedaCtaCte: comp.moneda || { ID: 1 },
            cotizacion: comp.cotizacion || 1,
            utilizaMonedaExtranjera: (comp.moneda?.codigo && comp.moneda.codigo !== 'PESOS_ARGENTINOS') ? 1 : 0,
            mediosDePago: [],
            detalleCobranzas: [{
              idComprobante: parseInt(idComprobante),
              importe: parseFloat(importe)
            }]
          };
        }

        const { response, data } = await this.requestXubio('/cobranzaBean', 'POST', payload);

        if (response.ok) {
          const transaccionId = data.transaccionId || data.transaccionid || data.id;
          let mensaje = `✅ Cobranza creada exitosamente!\n\n`;
          mensaje += `Transaction ID: ${transaccionId}\n`;
          mensaje += `ID: ${data.id || data.ID || 'N/A'}\n\n`;
          mensaje += `Obteniendo PDF...\n\n`;

          this.mostrarResultado('cobranza', mensaje, 'success');
          await this.obtenerPDF(transaccionId, this.cobranzaTipoimpresion, 'cobranza');
        } else {
          this.mostrarResultado('cobranza',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('cobranza', `❌ Error: ${error.message}`, 'error');
      }
    },

    async soloCrearCobranza() {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      const clienteId = this.cobranzaClienteId.trim();
      const idComprobante = this.cobranzaIdComprobante.trim();
      const importe = this.cobranzaImporte.trim();

      if (!clienteId || !idComprobante || !importe) {
        this.mostrarResultado('cobranza', 'Error: Completa Cliente ID, ID Comprobante e Importe', 'error');
        return;
      }

      this.mostrarResultado('cobranza', 'Creando cobranza...', 'info');

      try {
        let payload;
        if (this.cobranzaJson.trim()) {
          payload = JSON.parse(this.cobranzaJson);
        } else {
          const compResponse = await this.requestXubio(`/comprobanteVentaBean/${idComprobante}`, 'GET');
          if (!compResponse.response.ok) {
            throw new Error('No se pudo obtener el comprobante. Verifica el ID.');
          }
          const comp = compResponse.data;

          payload = {
            circuitoContable: comp.circuitoContable || { ID: 1 },
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            monedaCtaCte: comp.moneda || { ID: 1 },
            cotizacion: comp.cotizacion || 1,
            utilizaMonedaExtranjera: (comp.moneda?.codigo && comp.moneda.codigo !== 'PESOS_ARGENTINOS') ? 1 : 0,
            mediosDePago: [],
            detalleCobranzas: [{
              idComprobante: parseInt(idComprobante),
              importe: parseFloat(importe)
            }]
          };
        }

        const { response, data } = await this.requestXubio('/cobranzaBean', 'POST', payload);

        if (response.ok) {
          const transaccionId = data.transaccionId || data.transaccionid || data.id;
          let mensaje = `✅ Cobranza creada exitosamente!\n\n`;
          mensaje += `Transaction ID: ${transaccionId}\n`;
          mensaje += `ID: ${data.id || data.ID || 'N/A'}\n\n`;
          mensaje += `Respuesta completa:\n${JSON.stringify(data, null, 2)}`;

          if (transaccionId) {
            this.transaccionId = transaccionId.toString();
            mensaje += `\n\n💡 Transaction ID copiado al campo de "Obtener PDF de Comprobante Existente"`;
          }

          this.mostrarResultado('cobranza', mensaje, 'success');
        } else {
          this.mostrarResultado('cobranza',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('cobranza', `❌ Error: ${error.message}`, 'error');
      }
    },

    async listarFacturasUltimoMes() {
      if (!this.accessToken) {
        alert('Primero obtén un token de acceso');
        return;
      }

      this.mostrarResultado('facturasList', 'Obteniendo facturas del último mes...', 'info');
      this.facturasList = [];

      try {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(haceUnMes.getMonth() - 1);

        const fechaDesde = haceUnMes.toISOString().split('T')[0];
        const fechaHasta = hoy.toISOString().split('T')[0];

        const { response, data } = await this.requestXubio('/comprobanteVentaBean', 'GET', null, {
          fechaDesde: fechaDesde,
          fechaHasta: fechaHasta
        });

        if (response.ok && Array.isArray(data)) {
          if (data.length === 0) {
            this.mostrarResultado('facturasList', 'No se encontraron facturas en el último mes', 'info');
            return;
          }

          // Procesar facturas para la tabla
          this.facturasList = data.map(factura => {
            const id = factura.id || factura.ID || factura.transaccionId || factura.transaccionid || '';
            const cliente = factura.cliente || {};
            return {
              id,
              numero: factura.numeroComprobante || factura.numero || '',
              fecha: factura.fecha || '',
              cuit: cliente.cuit || cliente.CUIT || cliente.identificacionTributaria?.numero || '',
              razonSocial: cliente.razonSocial || cliente.nombre || '',
              monto: factura.importetotal || factura.importeTotal || factura.total || '0',
              transaccionId: factura.transaccionId || factura.transaccionid || id
            };
          });

          this.mostrarResultado('facturasList', `✅ Se encontraron ${data.length} facturas del último mes`, 'success');
        } else {
          this.mostrarResultado('facturasList',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('facturasList', `❌ Error: ${error.message}`, 'error');
      }
    },

    seleccionarFactura(factura) {
      this.transaccionId = factura.transaccionId.toString();
      this.cobranzaIdComprobante = factura.id.toString();
      this.facturaSeleccionada = factura.id;
      
      this.mostrarResultado('facturasList',
        `✅ Factura seleccionada:\nID: ${factura.id}\nTransaction ID: ${factura.transaccionId}\nCliente: ${factura.razonSocial}\nCUIT: ${factura.cuit}\nMonto: $${parseFloat(factura.monto).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n\n💡 El ID se copió a los campos correspondientes.`, 
        'success'
      );
    }
  }
});

app.mount('#app');
