// @ts-nocheck - Vue desde CDN no tiene tipos completos
// Importar cache manager
import cacheManager from './utils/cache.js';
// Importar formatters
import { formatoMensaje as formatoMensajeUtil, formatearPrecio as formatearPrecioUtil, formatearCUIT as formatearCUITUtil } from './utils/formatters.js';
// Importar composable Xubio
import useXubio from './composables/useXubio.js';
// Importar composable Auth (para funciones auxiliares)
import useAuth from './composables/useAuth.js';
// Importar componentes
import ProductoSelector from './components/ProductoSelector.vue';
import ClienteSelector from './components/ClienteSelector.vue';
import PuntoVentaSelector from './components/PuntoVentaSelector.vue';

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
 * @property {string|number} facturaCotizacion
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
// Opciones del componente principal - exportadas para ser usadas en App.vue (SFC)
// Esto permite usar Vue sin el compilador de templates en runtime (~16KB menos)
export const appOptions = {
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
      facturaCotizacion: '1',
      facturaMoneda: '', // Moneda seleccionada para la factura (se selecciona DOLARES automáticamente al cargar)
      monedasList: [], // Lista de monedas disponibles desde la API
      facturaDescripcion: 'CC ARS 261-6044134-3 // CBU 0270261410060441340032 // ALIAS corvus.super// Razón Social CORVUSWEB SRL CUIT 30-71241712-5', // Descripción general de la factura (campo documentado en swagger)
      modoAvanzado: false, // Controla si se muestra el campo JSON manual
      facturaCondicionPago: 1, // 1 = Cuenta Corriente, 2 = Contado
      facturaFechaVto: '', // Fecha de vencimiento
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
      facturasPendientes: [],
      mostrarFacturasPendientes: false,
      facturaParaCobrar: null,
      cobranzaFormaPago: 'efectivo', // 'efectivo', 'cheque', 'transferencia'
      cobranzaCuentaId: null, // ID de la cuenta seleccionada
      cuentasDisponibles: [],
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
      
      // Productos y Lista de Precios
      productosList: [],
      productosListResult: { message: '', type: '', visible: false },
      listaPrecioAGDP: null,
      productosSeleccionados: [], // Array de { producto, cantidad, precio, producto_id }
      
      // Clientes
      clientesList: [],
      clientesListResult: { message: '', type: '', visible: false },
      
      // Puntos de Venta
      puntosDeVentaResult: { message: '', type: '', visible: false },
      puntoVentaSeleccionadoId: null, // ID del punto de venta seleccionado (similar a facturaMoneda)
      puntoVentaSeleccionadoParaFactura: null, // Punto de venta seleccionado para la factura
      clienteSeleccionado: null,
      clienteSeleccionadoParaFactura: null, // Cliente seleccionado para la factura
      
      // Cotización
      cotizacionActualizada: null, // Timestamp de última actualización
      
      // Valores de configuración (maestros)
      centrosDeCosto: [],
      depositos: [],
      vendedores: [],
      circuitosContables: [],
      puntosDeVenta: [],
      valoresCargados: false, // Flag para saber si ya se cargaron los valores

      // Diagnóstico de Punto de Venta
      mostrarDiagnosticoPV: false,
      mostrarDatosCrudosPV: false,
      campoIdActivo: 'auto', // 'auto', 'puntoVentaId', 'ID', 'id', 'puntoVenta_id', etc.
      campoEditableActivo: 'auto', // 'auto', 'editable+sugerido', 'editableSugerido', etc.
      logDiagnosticoPV: [],

      // Estados de carga y error
      isLoading: false,
      loadingContext: '',
      
      // Cliente Xubio (se inicializa en mounted)
      xubioClient: null
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
    },
    
    /**
     * Calcula el total de productos seleccionados
     */
    totalProductosSeleccionados() {
      return this.productosSeleccionados.reduce((total, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        return total + (cantidad * precio);
      }, 0);
    },
    
    /**
     * Obtiene el centro de costo seleccionado por defecto
     */
    centroDeCostoSeleccionado() {
      try {
        const centro = this.obtenerCentroDeCostoPorDefecto();
        return {
          id: centro.ID || centro.id,
          nombre: centro.nombre || 'No disponible',
          codigo: centro.codigo || ''
        };
      } catch (error) {
        // Si no hay centros disponibles, retornar valores por defecto para el template
        return {
          id: null,
          nombre: 'No disponible',
          codigo: ''
        };
      }
    },
    
    /**
     * Obtiene el depósito seleccionado por defecto
     */
    depositoSeleccionado() {
      const deposito = this.obtenerDepositoPorDefecto();
      if (!deposito) return { nombre: 'No disponible', codigo: '' };
      return {
        id: deposito.ID || deposito.id,
        nombre: deposito.nombre || 'No disponible',
        codigo: deposito.codigo || ''
      };
    },
    
    /**
     * Obtiene el vendedor seleccionado por defecto
     */
    vendedorSeleccionado() {
      const vendedor = this.obtenerVendedorPorDefecto();
      return {
        id: vendedor.ID || vendedor.id,
        nombre: vendedor.nombre || 'No disponible',
        codigo: vendedor.codigo || ''
      };
    },
    
    /**
     * Obtiene el punto de venta seleccionado por defecto (para mostrar en resumen)
     */
    puntoVentaSeleccionado() {
      // Si hay un punto de venta seleccionado manualmente, usarlo
      if (this.puntoVentaSeleccionadoParaFactura) {
        const pv = this.puntoVentaSeleccionadoParaFactura;
        return {
          id: pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id,
          nombre: pv.nombre || 'No disponible',
          codigo: pv.codigo || '',
          puntoVenta: pv.puntoVenta || pv.codigo || ''
        };
      }
      
      // Si no, usar el método por defecto
      const puntoVenta = this.obtenerPuntoVentaPorDefecto();
      return {
        id: puntoVenta.ID || puntoVenta.id,
        nombre: puntoVenta.nombre || 'No disponible',
        codigo: puntoVenta.codigo || ''
      };
    },
    
    /**
     * Obtiene el circuito contable seleccionado por defecto
     */
    circuitoContableSeleccionado() {
      const circuito = this.obtenerCircuitoContablePorDefecto();
      return {
        id: circuito.ID || circuito.id,
        nombre: circuito.nombre || 'No disponible',
        codigo: circuito.codigo || ''
      };
    },
    
    /**
     * Calcula el subtotal sin IVA
     */
    subtotalSinIVA() {
      return this.productosSeleccionados.reduce((total, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        const importe = cantidad * precio;
        // Asumiendo que el precio incluye IVA 21%
        const sinIVA = importe / 1.21;
        return total + sinIVA;
      }, 0);
    },
    
    /**
     * Calcula el total de IVA
     */
    totalIVA() {
      return this.productosSeleccionados.reduce((total, item) => {
        const cantidad = parseFloat(item.cantidad) || 0;
        const precio = parseFloat(item.precio) || 0;
        const importe = cantidad * precio;
        // IVA = importe - (importe / 1.21)
        const iva = importe - (importe / 1.21);
        return total + iva;
      }, 0);
    },
    
    /**
     * Fecha de vencimiento (por ahora igual a fecha actual)
     */
    fechaVencimiento() {
      return new Date().toISOString().split('T')[0];
    },
    
    /**
     * Valida si se puede crear una factura (todos los requisitos cumplidos)
     * @returns {boolean}
     */
    puedeCrearFactura() {
      // 1. Validar token válido
      if (!this.tokenValido) {
        return false;
      }
      
      // 2. Validar cliente seleccionado
      if (!this.clienteSeleccionadoParaFactura || !this.facturaClienteId) {
        return false;
      }
      
      // 3. Validar productos seleccionados o JSON manual
      if (!this.facturaJson.trim() && this.productosSeleccionados.length === 0) {
        return false;
      }
      
      // 4. Validar moneda seleccionada
      if (!this.facturaMoneda) {
        return false;
      }
      
      // 5. Validar punto de venta válido (editable-sugerido)
      // Puede estar seleccionado manualmente o automáticamente
      if (!this.puntoVentaValido) {
        return false;
      }
      
      // Verificar que haya un punto de venta seleccionado (manual o automático)
      const puntoVentaDefault = this.obtenerPuntoVentaPorDefecto();
      if (!this.puntoVentaSeleccionadoParaFactura && (!puntoVentaDefault.ID && !puntoVentaDefault.id)) {
        return false;
      }
      
      // 6. Validar cotización si es moneda extranjera
      if (this.facturaMoneda && 
          this.facturaMoneda !== 'ARS' && 
          this.facturaMoneda !== 'PESOS_ARGENTINOS') {
        const cotizacion = parseFloat(this.facturaCotizacion);
        if (!cotizacion || cotizacion <= 0) {
          return false;
        }
      }
      
      return true;
    },
    
    /**
     * Valida si el punto de venta es válido (activo, editable y sugerido)
     * Requerido por la API de Xubio para crear facturas.
     * @returns {boolean}
     */
    puntoVentaValido() {
      // Si hay un punto de venta seleccionado manualmente, validarlo
      if (this.puntoVentaSeleccionadoParaFactura) {
        const pv = this.puntoVentaSeleccionadoParaFactura;
        const puntoVentaId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
        // Debe estar activo Y ser editable Y ser sugerido
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        const esValidoXubio = pv.editable && pv.sugerido;
        return !!puntoVentaId && esActivo && esValidoXubio;
      }

      // Si no hay selección manual, validar el automático
      if (!this.puntosDeVenta || this.puntosDeVenta.length === 0) {
        return false;
      }

      // Verificar que haya puntos de venta activos y válidos (editable+sugerido)
      const puntosActivos = this.puntosDeVenta.filter(pv => {
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        const esValidoXubio = pv.editable && pv.sugerido;
        return esActivo && esValidoXubio;
      });

      if (puntosActivos.length === 0) {
        return false;
      }

      const puntoVenta = this.obtenerPuntoVentaPorDefecto();
      const puntoVentaId = puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVentaId;

      // Verificar que tenga ID válido
      return !!puntoVentaId;
    },

    /**
     * Lista de campos de ID posibles para probar en diagnóstico
     */
    camposIdPosibles() {
      const pv = this.puntoVentaSeleccionadoParaFactura || {};
      return [
        { campo: 'auto', label: 'Auto (actual)', valor: pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id },
        { campo: 'puntoVentaId', label: 'puntoVentaId', valor: pv.puntoVentaId },
        { campo: 'ID', label: 'ID (mayúscula)', valor: pv.ID },
        { campo: 'id', label: 'id (minúscula)', valor: pv.id },
        { campo: 'puntoVenta_id', label: 'puntoVenta_id', valor: pv.puntoVenta_id },
        { campo: 'punto_venta_id', label: 'punto_venta_id', valor: pv.punto_venta_id },
        { campo: 'pv_id', label: 'pv_id', valor: pv.pv_id },
        { campo: 'pvId', label: 'pvId', valor: pv.pvId },
        { campo: 'codigo', label: 'codigo (como ID)', valor: pv.codigo },
        { campo: 'puntoVenta', label: 'puntoVenta (campo)', valor: pv.puntoVenta }
      ];
    },

    /**
     * Lista de campos editable/sugerido posibles para probar
     */
    camposEditablePosibles() {
      const pv = this.puntoVentaSeleccionadoParaFactura || {};
      return [
        { campo: 'auto', label: 'Auto (actual)', valor: this.evaluarEditableSugeridoActual(pv) },
        { campo: 'editable+sugerido', label: 'editable + sugerido', valor: `${pv.editable} + ${pv.sugerido}` },
        { campo: 'editableSugerido', label: 'editableSugerido', valor: pv.editableSugerido },
        { campo: 'editable_sugerido', label: 'editable_sugerido', valor: pv.editable_sugerido },
        { campo: 'esEditable', label: 'esEditable', valor: pv.esEditable },
        { campo: 'esSugerido', label: 'esSugerido', valor: pv.esSugerido },
        { campo: 'activo', label: 'activo', valor: pv.activo },
        { campo: 'habilitado', label: 'habilitado', valor: pv.habilitado },
        { campo: 'estado', label: 'estado', valor: pv.estado },
        { campo: 'forzar-true', label: '🔧 Forzar TRUE', valor: 'forzado' }
      ];
    },

    /**
     * Resultado del diagnóstico actual
     */
    diagnosticoPVResultado() {
      const pv = this.puntoVentaSeleccionadoParaFactura;
      if (!pv) {
        return { valido: false, idEncontrado: null, campoIdUsado: null, esEditable: false, esSugerido: false, campoEditableUsado: null };
      }

      // Obtener ID según campo seleccionado
      let idEncontrado = null;
      let campoIdUsado = null;

      if (this.campoIdActivo === 'auto') {
        idEncontrado = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
        campoIdUsado = pv.puntoVentaId ? 'puntoVentaId' : (pv.ID ? 'ID' : (pv.id ? 'id' : (pv.puntoVenta_id ? 'puntoVenta_id' : 'ninguno')));
      } else {
        idEncontrado = pv[this.campoIdActivo];
        campoIdUsado = this.campoIdActivo;
      }

      // Evaluar editable/sugerido según campo seleccionado
      let esEditable = false;
      let esSugerido = false;
      let campoEditableUsado = null;

      if (this.campoEditableActivo === 'auto') {
        esEditable = this.evaluarBooleano(pv.editable) || this.evaluarBooleano(pv.editableSugerido);
        esSugerido = this.evaluarBooleano(pv.sugerido) || this.evaluarBooleano(pv.editableSugerido);
        campoEditableUsado = 'auto (editable+sugerido o editableSugerido)';
      } else if (this.campoEditableActivo === 'editable+sugerido') {
        esEditable = this.evaluarBooleano(pv.editable);
        esSugerido = this.evaluarBooleano(pv.sugerido);
        campoEditableUsado = 'editable + sugerido';
      } else if (this.campoEditableActivo === 'editableSugerido') {
        esEditable = this.evaluarBooleano(pv.editableSugerido);
        esSugerido = this.evaluarBooleano(pv.editableSugerido);
        campoEditableUsado = 'editableSugerido';
      } else if (this.campoEditableActivo === 'forzar-true') {
        esEditable = true;
        esSugerido = true;
        campoEditableUsado = 'FORZADO a true';
      } else {
        const valor = pv[this.campoEditableActivo];
        esEditable = this.evaluarBooleano(valor);
        esSugerido = this.evaluarBooleano(valor);
        campoEditableUsado = this.campoEditableActivo;
      }

      const valido = !!idEncontrado && esEditable && esSugerido;

      return { valido, idEncontrado, campoIdUsado, esEditable, esSugerido, campoEditableUsado };
    }
  },
  async mounted() {
    try {
      // Inicializar cliente Xubio
      this.xubioClient = useXubio(
        (forceRefresh) => this.obtenerToken(forceRefresh),
        () => this.tokenValido,
        () => this.accessToken
      );
      
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
        // Hacer esto de forma asíncrona para no bloquear la carga inicial
        setTimeout(async () => {
          try {
            await this.obtenerToken();
            // Después de obtener token, cargar productos, clientes y puntos de venta automáticamente
            if (this.accessToken && this.tokenValido) {
              await Promise.all([
                this.listarProductos(),
                this.listarClientes(),
                this.listarPuntosDeVenta()
              ]);
              console.log('✅ Productos, clientes y puntos de venta cargados después de obtener token');
            }
          } catch (error) {
            console.error('⚠️ Error obteniendo token automáticamente:', error);
            // No mostrar error al usuario, solo loguear
          }
        }, 500); // Esperar 500ms para que la UI se renderice primero
      } else {
        this.mostrarResultado('token',
          '⚠️ Ingresa tus credenciales de Xubio y haz clic en "Obtener Token"\n\n💡 Las credenciales están en el archivo .xubio-credentials.md', 
          'info'
        );
      }
      
      // Limpiar caches expirados al iniciar
      this.limpiarCachesExpirados();
      
      // Inicializar fecha de vencimiento con fecha actual
      this.facturaFechaVto = new Date().toISOString().split('T')[0];
      
      // Si ya hay token válido desde localStorage (sin necesidad de obtenerlo de nuevo),
      // cargar monedas, cotización, productos y clientes inmediatamente
      if (this.accessToken && this.tokenValido) {
        // El token ya está disponible, cargar datos inmediatamente
        this._initDataPromise = (async () => {
          try {
            // Asegurar que xubioClient esté inicializado
            if (!this.xubioClient) {
              this.xubioClient = useXubio(
                (forceRefresh) => this.obtenerToken(forceRefresh),
                () => this.tokenValido,
                () => this.accessToken
              );
            }
            
            // Verificar que el token sigue siendo válido antes de cargar
            if (!this.accessToken || !this.tokenValido) {
              console.warn('⚠️ Token no válido, saltando carga automática');
              return;
            }
            
            // Cargar valores de configuración primero (puntos de venta, vendedores, etc.)
            if (!this.valoresCargados) {
              await this.cargarValoresConfiguracion();
            }
            
            // Cargar datos esenciales en paralelo
            await Promise.all([
              this.obtenerMonedas(),
              this.obtenerCotizacionDolar(true), // true = silencioso
              this.listarProductos(),  // Carga desde cache si está disponible
              this.listarClientes()    // Carga desde cache si está disponible
            ]);
            
            // Si los puntos de venta no se cargaron en cargarValoresConfiguracion, intentar con listarPuntosDeVenta
            if (!this.puntosDeVenta || this.puntosDeVenta.length === 0) {
              await this.listarPuntosDeVenta(); // Carga desde cache si está disponible
            }
            
            console.log('✅ Datos iniciales cargados (monedas + cotización + productos + clientes + puntos de venta)');
          } catch (error) {
            console.warn('⚠️ No se pudieron cargar todos los datos iniciales:', error);
          }
        })();
      }
    } catch (error) {
      // Manejar errores de inicialización para evitar pantalla blanca
      console.error('🚨 Error en inicialización de la aplicación:', error);
      this.mostrarResultado('token',
        `❌ Error al inicializar la aplicación: ${error.message}\n\nPor favor, recarga la página. Si el problema persiste, verifica la consola del navegador.`,
        'error'
      );
    }
  },
  beforeUnmount() {
    // Cleanup: limpiar promesas pendientes (no hay cleanup necesario para promesas)
    this._initDataPromise = null;
  },
  components: {
    ProductoSelector,
    ClienteSelector,
    PuntoVentaSelector
  },
  methods: {
    /**
     * Sistema de Cache con TTL - Delegado a cacheManager
     * TTL por tipo de dato:
     * - Clientes: 24 horas
     * - Productos: 12 horas
     * - Lista de Precios: 6 horas
     * - Maestros: 7 días
     */
    
    /**
     * Obtiene datos del cache si no han expirado
     * @param {string} key - Clave del cache
     * @returns {any|null} Datos cacheados o null si expiró/no existe
     */
    getCachedData(key) {
      return cacheManager.getCachedData(key);
    },
    
    /**
     * Guarda datos en el cache con TTL
     * @param {string} key - Clave del cache
     * @param {any} data - Datos a cachear
     * @param {number} ttl - TTL en milisegundos (opcional)
     */
    setCachedData(key, data, ttl) {
      return cacheManager.setCachedData(key, data, ttl);
    },

    // ==========================================
    // MÉTODOS DE DIAGNÓSTICO DE PUNTO DE VENTA
    // ==========================================

    /**
     * Toggle para mostrar/ocultar datos crudos del PV
     */
    toggleDatosCrudosPV() {
      this.mostrarDatosCrudosPV = !this.mostrarDatosCrudosPV;
    },

    /**
     * Evalúa un valor como booleano (maneja strings, numbers, booleans)
     */
    evaluarBooleano(valor) {
      if (valor === true || valor === 1 || valor === '1' || valor === 'true' || valor === 'TRUE' || valor === 'True') {
        return true;
      }
      return false;
    },

    /**
     * Evalúa el estado editable-sugerido actual de un PV
     */
    evaluarEditableSugeridoActual(pv) {
      if (!pv) return 'N/A';
      const esEditable = this.evaluarBooleano(pv.editable) || this.evaluarBooleano(pv.editableSugerido);
      const esSugerido = this.evaluarBooleano(pv.sugerido) || this.evaluarBooleano(pv.editableSugerido);
      return `Editable: ${esEditable}, Sugerido: ${esSugerido}`;
    },

    /**
     * Prueba un campo ID específico
     */
    probarCampoId(campo) {
      this.campoIdActivo = campo;
      const pv = this.puntoVentaSeleccionadoParaFactura;
      const valor = campo === 'auto' ? (pv?.puntoVentaId || pv?.ID || pv?.id || pv?.puntoVenta_id) : pv?.[campo];

      this.logDiagnosticoPV.unshift({
        mensaje: `[${new Date().toLocaleTimeString()}] Probando campo ID: ${campo} = ${valor}`,
        exito: !!valor
      });

      console.log(`🔧 Diagnóstico PV - Probando campo ID: ${campo}`, { campo, valor, pv });
    },

    /**
     * Prueba un campo editable/sugerido específico
     */
    probarCampoEditable(campo) {
      this.campoEditableActivo = campo;
      const pv = this.puntoVentaSeleccionadoParaFactura;
      let valor;

      if (campo === 'auto') {
        valor = this.evaluarEditableSugeridoActual(pv);
      } else if (campo === 'editable+sugerido') {
        valor = `editable=${pv?.editable}, sugerido=${pv?.sugerido}`;
      } else if (campo === 'forzar-true') {
        valor = 'FORZADO a true';
      } else {
        valor = pv?.[campo];
      }

      this.logDiagnosticoPV.unshift({
        mensaje: `[${new Date().toLocaleTimeString()}] Probando campo Editable: ${campo} = ${valor}`,
        exito: campo === 'forzar-true' || this.evaluarBooleano(valor)
      });

      console.log(`🔧 Diagnóstico PV - Probando campo Editable: ${campo}`, { campo, valor, pv });
    },

    /**
     * Limpia el log de diagnóstico
     */
    limpiarLogDiagnostico() {
      this.logDiagnosticoPV = [];
    },

    /**
     * Aplica la configuración de diagnóstico encontrada como fix permanente
     */
    aplicarConfiguracionPV() {
      const resultado = this.diagnosticoPVResultado;
      if (!resultado.valido) {
        alert('La configuración actual no es válida. Encuentra primero una combinación que funcione.');
        return;
      }

      // Mostrar instrucciones para el fix
      const instrucciones = `
¡Configuración válida encontrada!

Campo ID: ${this.campoIdActivo} (valor: ${resultado.idEncontrado})
Campo Editable: ${this.campoEditableActivo}

Para aplicar este fix permanentemente, necesitamos actualizar:
1. La función puntoVentaValido() en app.js
2. La función filtrarPuntosDeVenta() en domain-filters.js

¿Quieres que muestre los detalles en la consola?
      `.trim();

      if (confirm(instrucciones)) {
        console.log('='.repeat(60));
        console.log('FIX PARA PUNTO DE VENTA');
        console.log('='.repeat(60));
        console.log('Configuración encontrada:');
        console.log('  Campo ID:', this.campoIdActivo);
        console.log('  Campo Editable:', this.campoEditableActivo);
        console.log('');
        console.log('Datos del punto de venta:');
        console.log(JSON.stringify(this.puntoVentaSeleccionadoParaFactura, null, 2));
        console.log('='.repeat(60));
      }

      this.logDiagnosticoPV.unshift({
        mensaje: `[${new Date().toLocaleTimeString()}] ✅ Configuración válida aplicada: ID=${this.campoIdActivo}, Editable=${this.campoEditableActivo}`,
        exito: true
      });
    },

    // ==========================================
    // FIN MÉTODOS DE DIAGNÓSTICO
    // ==========================================

    /**
     * Invalida un cache específico
     * @param {string} key - Clave del cache a invalidar
     */
    invalidarCache(key) {
      return cacheManager.invalidarCache(key);
    },
    
    /**
     * Limpia todos los caches expirados
     */
    limpiarCachesExpirados() {
      return cacheManager.limpiarCachesExpirados();
    },
    
    /**
     * Limpia todos los caches manualmente (útil para debugging)
     */
    limpiarTodosLosCaches() {
      // También limpiar datos en memoria
      this.clientesList = [];
      this.productosList = [];
      this.listaPrecioAGDP = null;
      
      return cacheManager.limpiarTodosLosCaches();
    },
    
    /**
     * Obtiene el TTL recomendado para un tipo de dato
     * @param {string} tipo - 'clientes', 'productos', 'listaPrecios', 'maestros'
     * @returns {number} TTL en milisegundos
     */
    getTTL(tipo) {
      return cacheManager.getTTL(tipo);
    },
    
    /**
     * Formatea mensajes con saltos de línea HTML
     * @param {string} mensaje
     * @returns {string}
     */
    formatoMensaje(mensaje) {
      return formatoMensajeUtil(mensaje);
    },

    /**
     * Formatea un precio a 2 decimales
     * @param {number|string} precio
     * @returns {string}
     */
    formatearPrecio(precio) {
      return formatearPrecioUtil(precio);
    },

    /**
     * Formatea un CUIT con guiones (formato: XX-XXXXXXXX-X)
     * @param {string} cuit - CUIT sin formato o con formato
     * @returns {string} CUIT formateado
     */
    formatearCUIT(cuit) {
      return formatearCUITUtil(cuit);
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
     * Maneja errores de forma centralizada
     * @param {Error} error
     * @param {string} context
     * @param {string} seccion
     */
    handleError(error, context, seccion) {
      console.error(`❌ Error en ${context}:`, error);
      const errorMessage = error.message || 'Error desconocido';
      this.mostrarResultado(seccion, 
        `❌ Error en ${context}:\n\n${errorMessage}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`, 
        'error'
      );
    },
    
    /**
     * Maneja el submit del formulario de token
     */
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
        this.mostrarResultado('token', 'Error: Ingresa el Client ID', 'error');
        return;
      }
      if (!this.secretId || !this.secretId.trim()) {
        this.mostrarResultado('token', 'Error: Ingresa el Secret ID', 'error');
        return;
      }
      
      this.obtenerToken();
    },

    /**
     * Obtiene un token de acceso de Xubio
     * @param {boolean} forceRefresh - Si es true, fuerza la renovación del token
     */
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
      this.mostrarResultado('token', 'Obteniendo token...', 'info');
      
      // Asegurar que Vue detecte el cambio (con timeout para evitar que se quede colgado)
      try {
        await Promise.race([
          this.$nextTick(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('nextTick timeout')), 1000))
        ]);
      } catch (nextTickError) {
        console.warn('⚠️ nextTick timeout o error (continuando de todas formas):', nextTickError);
      }

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
            this.mostrarResultado('token', errorMsg, 'error');
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
            this.mostrarResultado('token', '❌ Error: El token no se guardó correctamente. Revisa la consola (F12).', 'error');
            return;
          }

          this.mostrarResultado('token',
            `✅ Token obtenido exitosamente!\n\nToken: ${this.accessToken.substring(0, 50)}...\nExpira en: ${expiresIn} segundos\nVálido hasta: ${new Date(this.tokenExpiration).toLocaleString()}`,
            'success'
          );
          
          // Cargar valores de configuración después de obtener el token
          if (!this.valoresCargados) {
            await this.cargarValoresConfiguracion();
          }
          
          // Cargar monedas disponibles
          await this.obtenerMonedas();
          
          // Cargar cotización del dólar automáticamente (silencioso)
          try {
            await this.obtenerCotizacionDolar(true);
          } catch (cotizError) {
            console.warn('⚠️ No se pudo obtener cotización automáticamente:', cotizError);
          }
          
          // Cargar cuentas disponibles
          await this.obtenerCuentas();
        } else {
          console.error('❌ Error en respuesta de token:', {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          const errorMsg = `❌ Error obteniendo token:\n\nStatus: ${response.status} ${response.statusText}\n\n${data?.error || data?.message || 'Error desconocido'}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`;
          this.mostrarResultado('token', errorMsg, 'error');
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
        
        this.mostrarResultado('token', 
          `❌ Error obteniendo token:\n\n${errorMessage}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`, 
          'error'
        );
        this.handleError(error, 'Obtención de token', 'token');
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
      if (!this.xubioClient) {
        // Inicializar si no está inicializado
        this.xubioClient = useXubio(
          (forceRefresh) => this.obtenerToken(forceRefresh),
          () => this.tokenValido,
          () => this.accessToken
        );
      }
      return this.xubioClient.requestXubio(endpoint, method, payload, queryParams);
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

      let clienteId = this.facturaClienteId.trim();

      // Si el campo contiene un CUIT (formato XX-XXXXXXXX-X), buscar el cliente
      if (clienteId && clienteId.match(/^\d{2}-\d{8}-\d{1}$/)) {
        const cuitSinFormato = clienteId.replace(/\D/g, '');
        const clienteEncontrado = this.clientesList.find(c => {
          const cuitCliente = (c.cuit || c.identificacionTributaria?.numero || '').replace(/\D/g, '');
          return cuitCliente === cuitSinFormato;
        });
        
        if (clienteEncontrado) {
          clienteId = (clienteEncontrado.cliente_id || clienteEncontrado.id || clienteEncontrado.ID).toString();
          this.facturaClienteId = clienteId;
          this.clienteSeleccionado = clienteEncontrado;
          this.clienteSeleccionadoParaFactura = clienteEncontrado; // Actualizar el card
        } else {
          // Si no está en la lista cargada, intentar buscar en la API
          try {
            const { response, data } = await this.requestXubio('/clienteBean', 'GET', null, {
              activo: 1,
              numeroIdentificacion: cuitSinFormato
            });
            
            if (response.ok && Array.isArray(data) && data.length > 0) {
              const cliente = data[0];
              clienteId = (cliente.cliente_id || cliente.id || cliente.ID).toString();
              this.facturaClienteId = clienteId;
              this.clienteSeleccionado = cliente;
              this.clienteSeleccionadoParaFactura = cliente; // Actualizar el card
            } else {
              this.mostrarResultado('factura', 
                `Error: No se encontró un cliente con CUIT ${clienteId}. Asegúrate de haber listado los clientes primero.`, 
                'error'
              );
              return;
            }
          } catch (error) {
            this.mostrarResultado('factura', 
              `Error: No se pudo buscar el cliente con CUIT ${clienteId}. ${error.message}`, 
              'error'
            );
            return;
          }
        }
      }

      if (!clienteId) {
        this.mostrarResultado('factura', 'Error: Completa Cliente ID o selecciona un cliente de la lista', 'error');
        return;
      }

      // Validar que haya productos seleccionados si no se usa JSON manual
      if (!this.facturaJson.trim() && this.productosSeleccionados.length === 0) {
        this.mostrarResultado('factura', 'Error: Selecciona al menos un producto o proporciona un JSON de factura', 'error');
        return;
      }

      // Asegurar que los valores de configuración estén cargados (puntos de venta, vendedores, etc.)
      if (!this.valoresCargados) {
        this.isLoading = true;
        this.loadingContext = 'Cargando configuración...';
        this.mostrarResultado('factura', 'Cargando configuración necesaria...', 'info');
        try {
          await this.cargarValoresConfiguracion();
          // Resetear isLoading después de cargar configuración exitosamente
          this.isLoading = false;
          this.loadingContext = '';
        } catch (error) {
          this.mostrarResultado('factura', `Error cargando configuración: ${error.message}`, 'error');
          this.isLoading = false;
          this.loadingContext = '';
          return;
        }
      }

      // Validar que el punto de venta esté disponible y sea editable-sugerido
      if (!this.puntosDeVenta || this.puntosDeVenta.length === 0) {
        this.mostrarResultado('factura', 'Error: No hay puntos de venta cargados. Por favor, lista los puntos de venta desde la sección "2.6. Puntos de Venta" primero.', 'error');
        this.isLoading = false;
        this.loadingContext = '';
        return;
      }

      // Validar que haya centros de costo disponibles
      if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
        this.mostrarResultado('factura', 'Error: No hay centros de costo cargados. Por favor, asegúrate de que se carguen los valores de configuración.', 'error');
        this.isLoading = false;
        this.loadingContext = '';
        return;
      }
      
      // Verificar que haya puntos de venta activos
      // NOTA: Los campos editable/sugerido NO existen en la API (verificado en swagger.json)
      const puntosActivos = this.puntosDeVenta.filter(pv => {
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        return esActivo;
      });

      if (puntosActivos.length === 0) {
        this.mostrarResultado('factura',
          'Error: No se encontraron puntos de venta activos.\n\n' +
          'Verifica en Xubio que al menos un punto de venta esté activo.',
          'error'
        );
        this.isLoading = false;
        this.loadingContext = '';
        return;
      }

      // Validar punto de venta seleccionado (manual o automático)
      let puntoVentaValido = false;
      let puntoVentaId = null;

      // Si hay un punto de venta seleccionado manualmente, validarlo
      if (this.puntoVentaSeleccionadoParaFactura) {
        const pv = this.puntoVentaSeleccionadoParaFactura;
        puntoVentaId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        puntoVentaValido = !!puntoVentaId && esActivo;
      } else {
        // Si no hay selección manual, usar el método automático
        const puntoVenta = this.obtenerPuntoVentaPorDefecto();
        puntoVentaId = puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id;
        puntoVentaValido = !!puntoVentaId;
      }

      if (!puntoVentaValido) {
        this.mostrarResultado('factura',
          'Error: No se pudo obtener un punto de venta válido.\n\n' +
          'Verifica que hayas seleccionado un punto de venta activo.',
          'error'
        );
        this.isLoading = false;
        this.loadingContext = '';
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
          // Obtener datos necesarios
          const [datosCliente] = await Promise.all([
            this.obtenerDatosCliente(parseInt(clienteId))
          ]);

          // Validar provincia del cliente (requerido según Swagger)
          if (!datosCliente || !datosCliente.provincia) {
            this.mostrarResultado('factura', 
              'Error: El cliente seleccionado no tiene provincia configurada.\n\n' +
              'Por favor, configura la provincia del cliente en Xubio antes de crear la factura.', 
              'error'
            );
            this.isLoading = false;
            this.loadingContext = '';
            return;
          }

          // Asegurar lista de precios para el encabezado
          let listaDePrecioParaHeader = this.listaPrecioAGDP;
          if (!listaDePrecioParaHeader) {
            listaDePrecioParaHeader = await this.obtenerListaPrecioAGDP();
          }

          // Validar lista de precios (requerido según Swagger)
          if (!listaDePrecioParaHeader) {
            this.mostrarResultado('factura', 
              'Error: No se pudo obtener la lista de precios AGDP.\n\n' +
              'Por favor, verifica que exista una lista de precios con el código "AGDP" en Xubio.', 
              'error'
            );
            this.isLoading = false;
            this.loadingContext = '';
            return;
          }

          // Construir transaccionProductoItems desde productos seleccionados
          // Según Swagger: todos los campos son REQUERIDOS
          const transaccionProductoItems = this.productosSeleccionados.map(item => {
            const cantidad = parseFloat(item.cantidad) || 1;
            const precio = parseFloat(item.precio) || 0;
            const importe = cantidad * precio;
            
            // Obtener tasa IVA del producto (si está disponible)
            const tasaIVA = item.producto?.tasaIva?.porcentaje || 
                           item.producto?.tasaIVA?.porcentaje || 
                           item.producto?.porcentajeIVA || 
                           21; // Por defecto 21%
            
            // Calcular IVA (asumiendo que el precio ya incluye IVA)
            // Si el precio incluye IVA: iva = importe - (importe / (1 + tasaIVA/100))
            // Si el precio NO incluye IVA: iva = importe * (tasaIVA / 100)
            // Por defecto asumimos que el precio incluye IVA
            const iva = importe - (importe / (1 + tasaIVA / 100));
            const total = importe; // Total con IVA incluido
            
            // Obtener ID del producto (según Swagger: productoid es el campo correcto)
            const productoId = item.producto_id || item.producto?.productoid || item.producto?.id || item.producto?.ID;
            
            // Usar descripción personalizada si existe, sino la del producto
            const descripcionItem = item.descripcionPersonalizada?.trim() 
              || item.producto?.descripcion 
              || item.producto?.nombre 
              || 'Producto sin descripción';
            
            const detalle = {
              cantidad: cantidad,
              precio: precio,
              descripcion: descripcionItem,
              // Según Swagger: producto debe tener al menos ID e id
              producto: productoId ? { 
                ID: productoId, 
                id: productoId,
                nombre: item.producto?.nombre || '',
                codigo: item.producto?.codigo || ''
              } : undefined,
              // Campos requeridos según Swagger
              iva: parseFloat(iva.toFixed(2)),
              importe: parseFloat(importe.toFixed(2)),
              total: parseFloat(total.toFixed(2)),
              montoExento: 0, // Por defecto, todo está gravado
              porcentajeDescuento: 0, // Sin descuento por defecto
              centroDeCosto: this.obtenerCentroDeCostoPorDefecto() // Centro de costo (requerido)
            };
            
            // Agregar depósito si está disponible (opcional pero recomendado)
            const deposito = this.obtenerDepositoPorDefecto();
            if (deposito) {
              detalle.deposito = deposito;
            }
            
            return detalle;
          });

          // Construir payload completo
          const fecha = new Date();
          const fechaISO = fecha.toISOString().split('T')[0];
          
          payload = {
            circuitoContable: this.obtenerCircuitoContablePorDefecto(),
            comprobante: 1, // ID del comprobante (puede ser diferente de tipo)
            tipo: 1, // 1=Factura, 2=Nota de Débito, 3=Nota de Crédito, 4=Informe Z, 6=Recibo
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: fechaISO,
            fechaVto: this.facturaFechaVto || fechaISO, // Fecha de vencimiento (requerido según Swagger)
            condicionDePago: parseInt(this.facturaCondicionPago) || 1, // 1=Cuenta Corriente, 2=Contado (requerido según Swagger)
            puntoVenta: this.obtenerPuntoVentaPorDefecto(), // Requerido según Swagger
            vendedor: this.obtenerVendedorPorDefecto(), // Requerido según Swagger
            transaccionProductoItems: transaccionProductoItems,
            // Campos requeridos con valores por defecto
            cantComprobantesCancelados: 0,
            cantComprobantesEmitidos: 0,
            cbuinformada: false,
            cotizacionListaDePrecio: 1,
            descripcion: this.facturaDescripcion?.trim() || '', // Descripción del comprobante (campo documentado)
            externalId: '',
            facturaNoExportacion: false,
            listaDePrecio: listaDePrecioParaHeader ? {
              ID: listaDePrecioParaHeader.listaPrecioID || listaDePrecioParaHeader.id || listaDePrecioParaHeader.ID,
              id: listaDePrecioParaHeader.listaPrecioID || listaDePrecioParaHeader.id || listaDePrecioParaHeader.ID,
              nombre: listaDePrecioParaHeader.nombre || '',
              codigo: listaDePrecioParaHeader.codigo || ''
            } : null, // Agregar lista de precio (requerido según Swagger)
            mailEstado: '',
            nombre: '', // Nombre del comprobante
            numeroDocumento: '',
            porcentajeComision: 0,
            provincia: datosCliente?.provincia ? {
              ID: datosCliente.provincia.provincia_id || datosCliente.provincia.ID || datosCliente.provincia.id,
              id: datosCliente.provincia.provincia_id || datosCliente.provincia.ID || datosCliente.provincia.id,
              nombre: datosCliente.provincia.nombre || '',
              codigo: datosCliente.provincia.codigo || ''
            } : null, // Agregar provincia del cliente (requerido según Swagger)
            transaccionCobranzaItems: [],
            transaccionPercepcionItems: []
          };
          
          // Agregar depósito a nivel comprobante (requerido según Swagger)
          const depositoHeader = this.obtenerDepositoPorDefecto();
          if (!depositoHeader) {
            this.mostrarResultado('factura', 
              'Error: No hay depósitos disponibles.\n\n' +
              'Por favor, asegúrate de que existan depósitos activos en Xubio y que se hayan cargado los valores de configuración.', 
              'error'
            );
            this.isLoading = false;
            this.loadingContext = '';
            return;
          }
          payload.deposito = depositoHeader;

          // Agregar moneda si no es ARS/PESOS_ARGENTINOS (moneda extranjera)
          const esMonedaExtranjera = this.facturaMoneda && 
            this.facturaMoneda !== 'ARS' && 
            this.facturaMoneda !== 'PESOS_ARGENTINOS';
          
          if (esMonedaExtranjera) {
            const monedaSeleccionada = this.monedasList.find(m => 
              m.codigo === this.facturaMoneda
            ) || await this.obtenerMoneda(this.facturaMoneda);
            
            if (monedaSeleccionada) {
              payload.moneda = {
                ID: monedaSeleccionada.ID || monedaSeleccionada.id,
                codigo: monedaSeleccionada.codigo,
                nombre: monedaSeleccionada.nombre
              };
              const cotizacion = parseFloat(this.facturaCotizacion) || 1;
              payload.cotizacion = cotizacion > 0 ? cotizacion : 1;
              payload.utilizaMonedaExtranjera = 1;
            }
          }

          // Agregar CUIT del cliente si está disponible
          if (datosCliente && datosCliente.identificacionTributaria) {
            const cuit = datosCliente.identificacionTributaria.numero || datosCliente.cuit;
            if (cuit) {
              // El CUIT generalmente va en el objeto cliente o en identificacionTributaria
              if (!payload.cliente.identificacionTributaria) {
                payload.cliente.identificacionTributaria = {};
              }
              payload.cliente.identificacionTributaria.numero = cuit;
            }
          }
        }

        // Log específico del punto de venta para debugging
        console.log('🔍 Punto de venta que se enviará:', {
          ID: payload.puntoVenta?.ID,
          id: payload.puntoVenta?.id,
          nombre: payload.puntoVenta?.nombre,
          codigo: payload.puntoVenta?.codigo
        });
        
        console.log('📤 Payload de factura:', JSON.stringify(payload, null, 2));

        const { response, data } = await this.requestXubio('/comprobanteVentaBean', 'POST', payload);

        if (response.ok) {
          const transaccionId = data.transaccionId || data.transaccionid || data.id;
          let mensaje = `✅ Factura creada exitosamente!\n\n`;
          mensaje += `📋 Detalles:\n`;
          mensaje += `• Transaction ID: ${transaccionId}\n`;
          mensaje += `• Número: ${data.numeroComprobante || data.numero || 'N/A'}\n`;
          mensaje += `• Cliente: ${this.clienteSeleccionadoParaFactura?.razonSocial || this.clienteSeleccionadoParaFactura?.nombre || 'N/A'}\n`;
          mensaje += `• Total: $${formatearPrecioUtil(this.totalProductosSeleccionados)} ${this.facturaMoneda}\n`;
          mensaje += `• Moneda: ${this.facturaMoneda}\n\n`;
          mensaje += `Obteniendo PDF...\n\n`;

          this.mostrarResultado('factura', mensaje, 'success');
          await this.obtenerPDF(transaccionId, this.facturaTipoimpresion, 'factura');
        } else {
          // Mejorar el mensaje de error para casos comunes
          let mensajeError = `❌ Error ${response.status}: `;
          
          if (data && data.description) {
            // Error del servidor de Xubio
            if (data.description.includes('editable-sugerido') || data.description.includes('editable') && data.description.includes('sugerido')) {
              mensajeError += 'Punto de venta no es editable-sugerido.\n\n';
              mensajeError += '💡 Solución: La API de Xubio requiere que el punto de venta tenga:\n';
              mensajeError += '• editable: true\n';
              mensajeError += '• sugerido: true\n\n';
              mensajeError += 'Verifica en Xubio que al menos un punto de venta tenga estas propiedades activas.\n';
              mensajeError += 'El punto de venta que se intentó usar:\n';
              mensajeError += JSON.stringify(payload.puntoVenta, null, 2);
            } else if (data.description.includes('puntoVentaInstance') && data.description.includes('null')) {
              mensajeError += 'Punto de venta no válido.\n\n';
              mensajeError += '💡 Solución: Verifica que tengas puntos de venta configurados en Xubio y que estén activos.';
            } else {
              mensajeError += data.description;
            }
          } else if (data && data.error) {
            mensajeError += data.error;
            if (data.message) {
              mensajeError += `\n${data.message}`;
            }
            // Verificar si el error menciona editable-sugerido
            if (data.description && (data.description.includes('editable-sugerido') || (data.description.includes('editable') && data.description.includes('sugerido')))) {
              mensajeError += '\n\n💡 El punto de venta debe tener editable=true y sugerido=true en Xubio.';
            }
          } else {
            mensajeError += 'Error desconocido al crear la factura';
          }
          
          mensajeError += `\n\n📄 Detalles técnicos:\n${JSON.stringify(data, null, 2)}`;
          
          this.mostrarResultado('factura', mensajeError, 'error');
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

      let clienteId = this.facturaClienteId.trim();

      // Si el campo contiene un CUIT (formato XX-XXXXXXXX-X), buscar el cliente
      if (clienteId && clienteId.match(/^\d{2}-\d{8}-\d{1}$/)) {
        const cuitSinFormato = clienteId.replace(/\D/g, '');
        const clienteEncontrado = this.clientesList.find(c => {
          const cuitCliente = (c.cuit || c.identificacionTributaria?.numero || '').replace(/\D/g, '');
          return cuitCliente === cuitSinFormato;
        });
        
        if (clienteEncontrado) {
          clienteId = (clienteEncontrado.cliente_id || clienteEncontrado.id || clienteEncontrado.ID).toString();
          this.facturaClienteId = clienteId;
          this.clienteSeleccionadoParaFactura = clienteEncontrado; // Actualizar el card
        } else {
          // Si no está en la lista cargada, intentar buscar en la API
          try {
            const { response, data } = await this.requestXubio('/clienteBean', 'GET', null, {
              activo: 1,
              numeroIdentificacion: cuitSinFormato
            });
            
            if (response.ok && Array.isArray(data) && data.length > 0) {
              const cliente = data[0];
              clienteId = (cliente.cliente_id || cliente.id || cliente.ID).toString();
              this.facturaClienteId = clienteId;
              this.clienteSeleccionadoParaFactura = cliente; // Actualizar el card
            } else {
              this.mostrarResultado('factura', 
                `Error: No se encontró un cliente con CUIT ${clienteId}. Asegúrate de haber listado los clientes primero.`, 
                'error'
              );
              return;
            }
          } catch (error) {
            this.mostrarResultado('factura', 
              `Error: No se pudo buscar el cliente con CUIT ${clienteId}. ${error.message}`, 
              'error'
            );
            return;
          }
        }
      }

      if (!clienteId) {
        this.mostrarResultado('factura', 'Error: Completa Cliente ID o selecciona un cliente de la lista', 'error');
        return;
      }

      // Validar que el punto de venta esté disponible y sea editable-sugerido
      if (!this.puntosDeVenta || this.puntosDeVenta.length === 0) {
        this.mostrarResultado('factura', 'Error: No hay puntos de venta cargados. Por favor, lista los puntos de venta desde la sección "2.6. Puntos de Venta" primero.', 'error');
        return;
      }
      
      // Verificar que haya puntos de venta activos
      // NOTA: Los campos editable/sugerido NO existen en la API (verificado en swagger.json)
      const puntosActivos = this.puntosDeVenta.filter(pv => {
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        return esActivo;
      });

      if (puntosActivos.length === 0) {
        this.mostrarResultado('factura',
          'Error: No se encontraron puntos de venta activos.\n\n' +
          'Verifica en Xubio que al menos un punto de venta esté activo.',
          'error'
        );
        return;
      }

      const puntoVenta = this.obtenerPuntoVentaPorDefecto();
      const puntoVentaId = puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVentaId;
      if (!puntoVentaId) {
        this.mostrarResultado('factura',
          'Error: No se pudo obtener un punto de venta válido.\n\n' +
          'Verifica que hayas seleccionado un punto de venta activo.',
          'error'
        );
        return;
      }

      this.mostrarResultado('factura', 'Creando factura...', 'info');

      try {
        let payload;
        if (this.facturaJson.trim()) {
          payload = JSON.parse(this.facturaJson);
        } else {
          const fecha = new Date();
          const fechaISO = fecha.toISOString().split('T')[0];
          
          payload = {
            circuitoContable: this.obtenerCircuitoContablePorDefecto(),
            comprobante: 1,
            tipo: 1, // 1=Factura
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: fechaISO,
            fechaVto: fechaISO,
            condicionDePago: 1, // 1=Cuenta Corriente
            puntoVenta: this.obtenerPuntoVentaPorDefecto(),
            vendedor: this.obtenerVendedorPorDefecto(),
            transaccionProductoItems: [{
              cantidad: 1,
              precio: 100,
              descripcion: 'Producto de prueba',
              iva: parseFloat((100 - (100 / 1.21)).toFixed(2)), // IVA 21% incluido
              importe: 100,
              total: 100,
              montoExento: 0,
              porcentajeDescuento: 0,
              centroDeCosto: this.obtenerCentroDeCostoPorDefecto()
            }],
            // Campos requeridos con valores por defecto
            cantComprobantesCancelados: 0,
            cantComprobantesEmitidos: 0,
            cbuinformada: false,
            cotizacionListaDePrecio: 1,
            descripcion: '',
            externalId: '',
            facturaNoExportacion: false,
            listaDePrecio: null,
            mailEstado: '',
            nombre: '',
            numeroDocumento: '',
            porcentajeComision: 0,
            provincia: null,
            transaccionCobranzaItems: [],
            transaccionPercepcionItems: []
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

          // Según documentación: CobranzaBean requiere transaccionInstrumentoDeCobro (no mediosDePago)
          // detalleCobranzas puede ser un campo válido para asociar comprobantes, pero también necesitamos instrumentos de cobro
          payload = {
            circuitoContable: comp.circuitoContable || { ID: 1 },
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            monedaCtaCte: comp.moneda || { ID: 1 },
            cotizacion: comp.cotizacion || 1,
            utilizaMonedaExtranjera: (comp.moneda?.codigo && comp.moneda.codigo !== 'PESOS_ARGENTINOS') ? 1 : 0,
            // Según documentación: transaccionInstrumentoDeCobro es el campo correcto para medios de pago
            transaccionInstrumentoDeCobro: [{
              cuentaTipo: 1, // Tipo de cuenta (1 = Caja, ajustar según necesidad)
              cuenta: { ID: 1, id: 1 }, // Cuenta de caja por defecto
              moneda: comp.moneda || { ID: 1 },
              cotizacion: comp.cotizacion || 1,
              importe: parseFloat(importe),
              descripcion: `Cobranza de factura ${idComprobante}`
            }],
            // detalleCobranzas puede ser necesario para asociar el comprobante (verificar con API)
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

          // Según documentación: CobranzaBean requiere transaccionInstrumentoDeCobro (no mediosDePago)
          // detalleCobranzas puede ser un campo válido para asociar comprobantes, pero también necesitamos instrumentos de cobro
          payload = {
            circuitoContable: comp.circuitoContable || { ID: 1 },
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: new Date().toISOString().split('T')[0],
            monedaCtaCte: comp.moneda || { ID: 1 },
            cotizacion: comp.cotizacion || 1,
            utilizaMonedaExtranjera: (comp.moneda?.codigo && comp.moneda.codigo !== 'PESOS_ARGENTINOS') ? 1 : 0,
            // Según documentación: transaccionInstrumentoDeCobro es el campo correcto para medios de pago
            transaccionInstrumentoDeCobro: [{
              cuentaTipo: 1, // Tipo de cuenta (1 = Caja, ajustar según necesidad)
              cuenta: { ID: 1, id: 1 }, // Cuenta de caja por defecto
              moneda: comp.moneda || { ID: 1 },
              cotizacion: comp.cotizacion || 1,
              importe: parseFloat(importe),
              descripcion: `Cobranza de factura ${idComprobante}`
            }],
            // detalleCobranzas puede ser necesario para asociar el comprobante (verificar con API)
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
    },

    /**
     * Obtiene la lista de precios "AGDP" con sus precios (con cache)
     * @param {boolean} forceRefresh - Si es true, fuerza la actualización desde la API
     */
    async obtenerListaPrecioAGDP(forceRefresh = false) {
      if (!this.accessToken) {
        return null;
      }

      // Verificar cache en memoria
      if (!forceRefresh && this.listaPrecioAGDP) {
        return this.listaPrecioAGDP;
      }

      // Verificar cache en localStorage
      if (!forceRefresh) {
        const cached = this.getCachedData('listaPrecioAGDP');
        if (cached) {
          this.listaPrecioAGDP = cached;
          console.log('✅ Lista de precios AGDP cargada desde cache');
          return cached;
        }
      } else {
        this.invalidarCache('listaPrecioAGDP');
      }

      try {
        // Primero obtener todas las listas de precios
        const { response, data } = await this.requestXubio('/listaPrecioBean', 'GET');
        
        if (response.ok && Array.isArray(data)) {
          console.log('📋 Listas de precios disponibles:', data.map(lp => ({ 
            nombre: lp.nombre, 
            codigo: lp.codigo, 
            id: lp.id || lp.ID || lp.listaPrecioID 
          })));
          
          const listaAGDP = data.find(lp => 
            lp.nombre === 'AGDP' || 
            lp.codigo === 'AGDP' ||
            (lp.nombre && lp.nombre.toUpperCase().includes('AGDP')) ||
            (lp.codigo && lp.codigo.toUpperCase().includes('AGDP'))
          );
          
          if (listaAGDP) {
            // Según Swagger: el campo correcto es listaPrecioID (int64)
            const listaId = listaAGDP.listaPrecioID || listaAGDP.id || listaAGDP.ID;
            
            console.log('🔍 Lista AGDP encontrada:', {
              nombre: listaAGDP.nombre,
              codigo: listaAGDP.codigo,
              listaPrecioID: listaAGDP.listaPrecioID,
              id: listaAGDP.id,
              ID: listaAGDP.ID,
              listaIdUsado: listaId
            });
            
            // Intentar obtener los detalles de la lista (precios de productos)
            if (listaId) {
              try {
                console.log(`📥 Obteniendo detalles de lista de precios con ID: ${listaId}`);
                const { response: detalleResponse, data: detalleData } = await this.requestXubio(`/listaPrecioBean/${listaId}`, 'GET');
                
                if (detalleResponse.ok && detalleData) {
                  // Combinar la información de la lista con sus detalles
                  this.listaPrecioAGDP = { ...listaAGDP, ...detalleData };
                  
                  // Guardar en cache
                  this.setCachedData('listaPrecioAGDP', this.listaPrecioAGDP, this.getTTL('listaPrecios'));
                  
                  // Verificar que listaPrecioItem existe y tiene datos
                  const itemsCount = Array.isArray(this.listaPrecioAGDP.listaPrecioItem) 
                    ? this.listaPrecioAGDP.listaPrecioItem.length 
                    : 0;
                  
                  console.log('✅ Lista de precios AGDP con detalles obtenida desde la API:', {
                    nombre: this.listaPrecioAGDP.nombre,
                    listaPrecioID: this.listaPrecioAGDP.listaPrecioID,
                    itemsCount: itemsCount,
                    primerItem: itemsCount > 0 ? this.listaPrecioAGDP.listaPrecioItem[0] : null
                  });
                  
                  return this.listaPrecioAGDP;
                } else {
                  console.warn('⚠️ Error obteniendo detalles de la lista:', {
                    status: detalleResponse.status,
                    data: detalleData
                  });
                }
              } catch (error) {
                console.warn('⚠️ No se pudieron obtener detalles de la lista, usando lista básica:', error);
              }
            }
            
            // Si no se pudieron obtener detalles, usar la lista básica
            this.listaPrecioAGDP = listaAGDP;
            this.setCachedData('listaPrecioAGDP', listaAGDP, this.getTTL('listaPrecios'));
            console.log('✅ Lista de precios AGDP encontrada (sin detalles) desde la API:', listaAGDP);
            return listaAGDP;
          } else {
            console.warn('⚠️ Lista de precios AGDP no encontrada. Listas disponibles:', data.map(lp => ({
              nombre: lp.nombre,
              codigo: lp.codigo,
              id: lp.id || lp.ID || lp.listaPrecioID
            })));
            return null;
          }
        }
        return null;
      } catch (error) {
        console.error('❌ Error obteniendo lista de precios:', error);
        return null;
      }
    },

    /**
     * Lista productos de venta activos (con cache)
     * @param {boolean} forceRefresh - Si es true, fuerza la actualización desde la API
     */
    async listarProductos(forceRefresh = false) {
      if (!this.accessToken) {
        console.warn('⚠️ No hay token de acceso. Intentando obtener token...');
        this.mostrarResultado('productosList', '⚠️ No hay token de acceso. Obteniendo token...', 'info');
        try {
          await this.obtenerToken();
          if (!this.accessToken) {
            this.mostrarResultado('productosList', '❌ Error: No se pudo obtener el token. Por favor, obtén un token primero.', 'error');
            return;
          }
        } catch (error) {
          console.error('❌ Error obteniendo token:', error);
          this.mostrarResultado('productosList', `❌ Error obteniendo token: ${error.message}`, 'error');
          return;
        }
      }

      // 1. Verificar cache en memoria
      if (!forceRefresh && this.productosList.length > 0) {
        this.mostrarResultado('productosList', 
          `✅ ${this.productosList.length} productos ya cargados en memoria`, 
          'success'
        );
        return;
      }

      // 2. Verificar cache en localStorage
      if (!forceRefresh) {
        const cached = this.getCachedData('productos');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.productosList = cached;
          const edad = Math.floor((Date.now() - JSON.parse(localStorage.getItem('xubio_cache_productos')).timestamp) / 1000 / 60);
          this.mostrarResultado('productosList', 
            `✅ ${cached.length} productos cargados desde cache (actualizado hace ${edad} minutos)\n\n💡 Haz clic en "Actualizar" para obtener datos frescos de la API`, 
            'success'
          );
          
          // Actualizar en background
          this.actualizarProductosEnBackground();
          return;
        }
      } else {
        // Invalidar cache si se fuerza refresh
        this.invalidarCache('productos');
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo productos...';
      this.mostrarResultado('productosList', 'Obteniendo productos desde la API...', 'info');
      this.productosList = [];

      try {
        // 3. Consultar API
        const { response, data } = await this.requestXubio('/ProductoVentaBean', 'GET', null, {
          activo: 1
        });

        if (response.ok && Array.isArray(data)) {
          console.log(`📦 Se obtuvieron ${data.length} productos activos desde la API`);
          
          // Asegurar que la lista de precios AGDP esté cargada ANTES de enriquecer
          if (!this.listaPrecioAGDP) {
            console.log('🔄 Cargando lista de precios AGDP...');
            await this.obtenerListaPrecioAGDP();
          }
          
          // Enriquecer productos con precios de la lista AGDP
          const productosConPrecios = await this.enriquecerProductosConPrecios(data);
          this.productosList = productosConPrecios;
          
          // Guardar en cache
          this.setCachedData('productos', productosConPrecios, this.getTTL('productos'));
          
          const productosConPrecio = productosConPrecios.filter(p => p.precioAGDP && p.precioAGDP > 0);
          const mensaje = productosConPrecio.length > 0
            ? `✅ Se encontraron ${data.length} productos activos (${productosConPrecio.length} con precios de la lista AGDP) - Actualizados desde la API`
            : `✅ Se encontraron ${data.length} productos activos\n\n⚠️ No se encontraron precios en la lista AGDP. Verifica que:\n- La lista de precios "AGDP" existe\n- Los productos están incluidos en la lista\n- Revisa la consola (F12) para más detalles`;
          
          this.mostrarResultado('productosList', mensaje, productosConPrecio.length > 0 ? 'success' : 'info');
        } else {
          this.mostrarResultado('productosList',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('productosList', `❌ Error: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },
    
    /**
     * Actualiza productos en background sin bloquear la UI
     */
    async actualizarProductosEnBackground() {
      try {
        const { response, data } = await this.requestXubio('/ProductoVentaBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          // Asegurar lista de precios
          if (!this.listaPrecioAGDP) {
            await this.obtenerListaPrecioAGDP();
          }
          
          const productosConPrecios = await this.enriquecerProductosConPrecios(data);
          
          // Actualizar solo si hay cambios
          if (productosConPrecios.length !== this.productosList.length) {
            this.productosList = productosConPrecios;
            this.setCachedData('productos', productosConPrecios, this.getTTL('productos'));
            console.log('🔄 Productos actualizados en background');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error actualizando productos en background:', error);
      }
    },

    /**
     * Obtiene la cotización del dólar vendedor del día desde dolarapi.com
     * @param {boolean} silencioso - Si es true, no muestra mensajes (útil para carga automática)
     */
    async obtenerCotizacionDolar(silencioso = false) {
      if (!silencioso) {
        this.isLoading = true;
        this.loadingContext = 'Obteniendo cotización del dólar...';
        this.mostrarResultado('factura', 'Obteniendo cotización del dólar vendedor del día...', 'info');
      }

      try {
        // Usar dolarapi.com para obtener dólar OFICIAL vendedor
        const urlOficial = 'https://dolarapi.com/v1/dolares/oficial';
        
        console.log('🔍 Obteniendo cotización del dólar OFICIAL vendedor:', urlOficial);

        const response = await fetch(urlOficial, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo obtener la cotización del dólar oficial. ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 Respuesta de dolarapi.com (oficial):', data);

        // dolarapi.com devuelve un objeto con estructura: { moneda, casa, nombre, compra, venta, fechaActualizacion }
        // Usar el campo "venta" que es la cotización vendedor OFICIAL
        if (data && data.venta) {
          const precio = parseFloat(data.venta);
          if (!isNaN(precio) && precio > 0) {
            const fecha = data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleDateString('es-AR') : 'hoy';
            const hora = data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
            
            this.facturaCotizacion = precio.toFixed(2);
            this.cotizacionActualizada = `${fecha} ${hora}`;
            
            if (!silencioso) {
              this.mostrarResultado('factura', 
                `✅ Cotización OFICIAL vendedor obtenida: $${precio.toFixed(2)} (actualizada ${fecha} ${hora})`, 
                'success'
              );
            } else {
              console.log(`✅ Cotización actualizada automáticamente: $${precio.toFixed(2)}`);
            }
            return;
          }
        }

        throw new Error('No se pudo obtener la cotización vendedor. La respuesta no contiene el formato esperado.');
      } catch (error) {
        console.error('❌ Error obteniendo cotización del dólar:', error);
        if (!silencioso) {
          this.mostrarResultado('factura', 
            `❌ Error obteniendo cotización del dólar:\n\n${error.message}\n\n💡 Puedes ingresar la cotización manualmente.`, 
            'error'
          );
        }
      } finally {
        if (!silencioso) {
          this.isLoading = false;
          this.loadingContext = '';
        }
      }
    },

    /**
     * Obtiene la lista de monedas disponibles (con cache)
     * @param {boolean} forceRefresh - Si es true, ignora el cache
     */
    async obtenerMonedas(forceRefresh = false) {
      if (!this.accessToken) {
        return;
      }

      // 1. Si ya tenemos monedas en memoria y no es refresh forzado, usar eso
      if (!forceRefresh && this.monedasList && this.monedasList.length > 0) {
        console.log(`✅ ${this.monedasList.length} monedas ya cargadas en memoria`);
        return this.monedasList;
      }

      // 2. Verificar cache en localStorage
      if (!forceRefresh) {
        const cached = this.getCachedData('monedas');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.monedasList = cached;
          console.log(`✅ ${cached.length} monedas cargadas desde cache`);
          
          // Seleccionar DOLARES por defecto si no hay moneda seleccionada o es ARS
          this.seleccionarMonedaDolaresPorDefecto();
          
          return cached;
        }
      }

      // 3. Obtener de la API
      try {
        const { response, data } = await this.requestXubio('/monedaBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          this.monedasList = data;
          
          // Guardar en cache (7 días - datos estables)
          this.setCachedData('monedas', data, this.getTTL('monedas'));
          
          console.log(`✅ ${data.length} monedas cargadas desde API y cacheadas`);
          
          // Seleccionar DOLARES por defecto
          this.seleccionarMonedaDolaresPorDefecto();
          
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo monedas:', error);
        return [];
      }
    },
    
    /**
     * Selecciona el punto de venta por defecto (ID 212819 o valor 00004, editable-sugerido)
     * Similar a seleccionarMonedaDolaresPorDefecto()
     */
    seleccionarPuntoVentaPorDefecto() {
      if (!this.puntosDeVenta || this.puntosDeVenta.length === 0) {
        console.log('⚠️ No hay puntos de venta cargados para seleccionar');
        return;
      }
      
      // Filtrar solo puntos de venta activos
      // NOTA: Los campos editable/sugerido NO existen en la API (verificado en swagger.json)
      const puntosActivos = this.puntosDeVenta.filter(pv => {
        const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
        return esActivo;
      });

      if (puntosActivos.length === 0) {
        console.warn('⚠️ No se encontraron puntos de venta activos');
        this.puntoVentaSeleccionadoId = null;
        this.puntoVentaSeleccionadoParaFactura = null;
        return;
      }

      // Buscar primero por ID 212819
      let puntoVentaSeleccionado = puntosActivos.find(pv => {
        const pvId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
        return pvId === 212819 || pvId === '212819';
      });

      // Si no se encuentra por ID, buscar por campo "Punto de Venta" que contenga 00004
      if (!puntoVentaSeleccionado) {
        puntoVentaSeleccionado = puntosActivos.find(pv => {
          const puntoVenta = (pv.puntoVenta || '').toString().trim();
          return puntoVenta === '00004' || puntoVenta.includes('00004');
        });
      }

      // Si tampoco se encuentra, usar el primero disponible
      if (!puntoVentaSeleccionado) {
        puntoVentaSeleccionado = puntosActivos[0];
      }
      
      if (puntoVentaSeleccionado) {
        const puntoVentaId = puntoVentaSeleccionado.puntoVentaId || puntoVentaSeleccionado.ID || puntoVentaSeleccionado.id || puntoVentaSeleccionado.puntoVenta_id;
        const idAnterior = this.puntoVentaSeleccionadoId;
        this.puntoVentaSeleccionadoId = puntoVentaId;
        this.puntoVentaSeleccionadoParaFactura = puntoVentaSeleccionado;
        console.log(`🏪 Punto de venta seleccionado por defecto: ID ${puntoVentaId} (antes: ${idAnterior})`, puntoVentaSeleccionado);
      } else {
        console.warn('⚠️ No se pudo seleccionar un punto de venta por defecto');
        this.puntoVentaSeleccionadoId = null;
        this.puntoVentaSeleccionadoParaFactura = null;
      }
    },
    
    /**
     * Selecciona la moneda DOLARES por defecto si existe
     */
    seleccionarMonedaDolaresPorDefecto() {
      if (!this.monedasList || this.monedasList.length === 0) {
        console.log('⚠️ No hay monedas cargadas para seleccionar');
        return;
      }
      
      console.log('🔍 Buscando moneda DOLARES en:', this.monedasList.map(m => m.codigo));
      
      // Buscar la moneda DOLARES (puede venir como 'DOLARES' o 'USD')
      const monedaDolares = this.monedasList.find(m => 
        m.codigo === 'DOLARES' || 
        m.codigo === 'USD' ||
        m.nombre?.toUpperCase().includes('DÓLAR') ||
        m.nombre?.toUpperCase().includes('DOLAR')
      );
      
      if (monedaDolares) {
        const codigoAnterior = this.facturaMoneda;
        this.facturaMoneda = monedaDolares.codigo;
        console.log(`💵 Moneda DOLARES seleccionada por defecto: ${monedaDolares.codigo} (antes: ${codigoAnterior})`);
      } else {
        console.warn('⚠️ No se encontró moneda DOLARES/USD en la lista');
      }
    },

    /**
     * Obtiene una moneda por su código
     * @param {string} codigoMoneda - Código de la moneda (ej: 'USD', 'ARS')
     */
    async obtenerMoneda(codigoMoneda = 'USD') {
      if (!this.accessToken) {
        return null;
      }

      // Buscar primero en cache
      const monedaEnCache = this.monedasList.find(m => 
        m.codigo === codigoMoneda || 
        m.codigo?.toUpperCase() === codigoMoneda.toUpperCase()
      );
      
      if (monedaEnCache) {
        return monedaEnCache;
      }

      try {
        const { response, data } = await this.requestXubio('/monedaBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          const moneda = data.find(m => 
            m.codigo === codigoMoneda || 
            m.codigo?.toUpperCase() === codigoMoneda.toUpperCase() ||
            m.nombre?.toUpperCase().includes(codigoMoneda.toUpperCase())
          );
          if (moneda) {
            console.log('✅ Moneda encontrada:', moneda);
            return moneda;
          }
        }
        return null;
      } catch (error) {
        console.error('❌ Error obteniendo moneda:', error);
        return null;
      }
    },

    /**
     * Carga todos los valores de configuración necesarios (centros de costo, depósitos, etc.)
     */
    async cargarValoresConfiguracion() {
      if (!this.accessToken) {
        console.warn('⚠️ No hay token, no se pueden cargar valores de configuración');
        return;
      }

      console.log('🔄 Cargando valores de configuración...');
      
      try {
        // Cargar todos los valores en paralelo
        await Promise.all([
          this.obtenerCentrosDeCosto(),
          this.obtenerDepositos(),
          this.obtenerVendedores(),
          this.obtenerCircuitosContables(),
          this.obtenerPuntosDeVenta()
        ]);
        
        this.valoresCargados = true;
        console.log('✅ Valores de configuración cargados exitosamente');
      } catch (error) {
        console.error('❌ Error cargando valores de configuración:', error);
        // No bloqueamos el flujo si falla la carga de valores
      }
    },

    /**
     * Obtiene centros de costo activos
     */
    async obtenerCentrosDeCosto() {
      try {
        const { response, data } = await this.requestXubio('/centroDeCostoBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          this.centrosDeCosto = data;
          console.log(`✅ ${data.length} centros de costo cargados`);
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo centros de costo:', error);
        return [];
      }
    },

    /**
     * Obtiene depósitos activos
     */
    async obtenerDepositos() {
      try {
        const { response, data } = await this.requestXubio('/depositos', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          this.depositos = data;
          console.log(`✅ ${data.length} depósitos cargados`);
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo depósitos:', error);
        return [];
      }
    },

    /**
     * Obtiene vendedores activos
     */
    async obtenerVendedores() {
      try {
        const { response, data } = await this.requestXubio('/vendedorBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          this.vendedores = data;
          console.log(`✅ ${data.length} vendedores cargados`);
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo vendedores:', error);
        return [];
      }
    },

    /**
     * Obtiene circuitos contables activos
     */
    async obtenerCircuitosContables() {
      try {
        const { response, data } = await this.requestXubio('/circuitoContableBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          this.circuitosContables = data;
          console.log(`✅ ${data.length} circuitos contables cargados`);
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo circuitos contables:', error);
        return [];
      }
    },

    /**
     * Obtiene puntos de venta activos (método interno, sin UI)
     */
    async obtenerPuntosDeVenta() {
      try {
        const { response, data } = await this.requestXubio('/puntoVentaBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          console.log('🔍 RAW Puntos de Venta (API):', JSON.stringify(data, null, 2));
          this.puntosDeVenta = data;
          console.log(`✅ ${data.length} puntos de venta cargados`);
          return data;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo puntos de venta:', error);
        return [];
      }
    },

    /**
     * Lista puntos de venta activos (con cache y UI)
     * @param {boolean} forceRefresh - Si es true, fuerza la actualización desde la API
     */
    async listarPuntosDeVenta(forceRefresh = false) {
      if (!this.accessToken) {
        console.warn('⚠️ No hay token de acceso. Intentando obtener token...');
        this.mostrarResultado('puntosDeVentaResult', '⚠️ No hay token de acceso. Obteniendo token...', 'info');
        try {
          await this.obtenerToken();
          if (!this.accessToken) {
            this.mostrarResultado('puntosDeVentaResult', '❌ Error: No se pudo obtener el token. Por favor, obtén un token primero.', 'error');
            return;
          }
        } catch (error) {
          console.error('❌ Error obteniendo token:', error);
          this.mostrarResultado('puntosDeVentaResult', `❌ Error obteniendo token: ${error.message}`, 'error');
          return;
        }
      }

      this.isLoading = true;
      this.loadingContext = 'Listando puntos de venta...';
      this.mostrarResultado('puntosDeVentaResult', 'Cargando puntos de venta...', 'info');

      try {
        // Intentar cargar desde cache primero (si no se fuerza refresh)
        if (!forceRefresh) {
          const cached = cacheManager.getCachedData('puntosDeVenta');
          if (cached && Array.isArray(cached) && cached.length > 0) {
            this.puntosDeVenta = cached;
            // Preseleccionar punto de venta automáticamente
            this.seleccionarPuntoVentaPorDefecto();
            const mensaje = `✅ ${cached.length} punto(s) de venta cargado(s) desde cache\n\n💡 Usa "Actualizar desde API" para obtener datos frescos.`;
            this.mostrarResultado('puntosDeVentaResult', mensaje, 'success');
            this.isLoading = false;
            this.loadingContext = '';
            return;
          }
        }

        // Cargar desde la API
        const puntosDeVenta = await this.obtenerPuntosDeVenta();
        
        if (puntosDeVenta && puntosDeVenta.length > 0) {
          // Guardar en cache
          cacheManager.setCachedData('puntosDeVenta', puntosDeVenta, 3600000); // 1 hora
          
          const mensaje = `✅ ${puntosDeVenta.length} punto(s) de venta encontrado(s)\n\n`;
          
          // Preseleccionar punto de venta automáticamente (similar a moneda)
          this.seleccionarPuntoVentaPorDefecto();
          
          const puntoVentaSeleccionado = this.puntoVentaSeleccionadoParaFactura;
          if (puntoVentaSeleccionado) {
            const nombre = puntoVentaSeleccionado.nombre || puntoVentaSeleccionado.puntoVenta || 'N/A';
            const id = puntoVentaSeleccionado.puntoVentaId || puntoVentaSeleccionado.ID || puntoVentaSeleccionado.id;
            this.mostrarResultado('puntosDeVentaResult', mensaje + `⭐ Punto de venta ID ${id} (${nombre}) seleccionado por defecto`, 'success');
          } else {
            this.mostrarResultado('puntosDeVentaResult', mensaje + `⚠️ No se encontró punto de venta editable-sugerido válido. Selecciona uno manualmente.`, 'info');
          }
        } else {
          this.mostrarResultado('puntosDeVentaResult', '⚠️ No se encontraron puntos de venta activos', 'info');
        }
      } catch (error) {
        console.error('❌ Error listando puntos de venta:', error);
        this.mostrarResultado('puntosDeVentaResult', `❌ Error: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },

    /**
     * Obtiene el primer item de una lista o un valor por defecto
     * @param {Array} lista - Lista de items
     * @param {string} idField - Nombre del campo ID (default: 'ID')
     * @param {number} fallbackId - ID por defecto si la lista está vacía (default: 1)
     * @param {string} idFieldAlternativo - Campo ID alternativo para buscar (ej: 'centroDeCosto_id')
     * @returns {Object} Objeto con ID, id, nombre y codigo
     */
    obtenerPorDefecto(lista, idField = 'ID', fallbackId = 1, idFieldAlternativo = null) {
      if (lista && lista.length > 0) {
        const item = lista[0];
        const itemId = item[idField] || item.id || (idFieldAlternativo ? item[idFieldAlternativo] : null) || fallbackId;
        return {
          [idField]: itemId,
          id: item.id || item[idField] || itemId,
          nombre: item.nombre || '',
          codigo: item.codigo || ''
        };
      }
      // Fallback si no hay items
      return { 
        [idField]: fallbackId, 
        id: fallbackId,
        nombre: '',
        codigo: ''
      };
    },

    /**
     * Obtiene el primer centro de costo disponible o uno por defecto
     * @throws {Error} Si no hay centros de costo disponibles
     */
    obtenerCentroDeCostoPorDefecto() {
      if (!this.centrosDeCosto || this.centrosDeCosto.length === 0) {
        console.error('❌ No hay centros de costo disponibles');
        throw new Error('No hay centros de costo disponibles. Por favor, carga los centros de costo primero.');
      }
      return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1, 'centroDeCosto_id');
    },

    /**
     * Obtiene el primer depósito disponible o uno por defecto
     */
    obtenerDepositoPorDefecto() {
      const resultado = this.obtenerPorDefecto(this.depositos, 'ID', 1, 'deposito_id');
      // Depósito es opcional, retornar null si no hay items
      if (!this.depositos || this.depositos.length === 0) {
        return null;
      }
      return resultado;
    },

    /**
     * Obtiene el primer circuito contable disponible o uno por defecto
     */
    obtenerCircuitoContablePorDefecto() {
      return this.obtenerPorDefecto(this.circuitosContables, 'ID', 1, 'circuitoContable_id');
    },

    /**
     * Obtiene el punto de venta seleccionado (por ID) o el por defecto
     * Si hay un puntoVentaSeleccionadoId, lo usa; sino busca automáticamente
     */
    obtenerPuntoVentaPorDefecto() {
      // Si hay un punto de venta seleccionado manualmente, usarlo
      if (this.puntoVentaSeleccionadoId && this.puntoVentaSeleccionadoParaFactura) {
        const pv = this.puntoVentaSeleccionadoParaFactura;
        // Obtener ID del punto de venta (PuntoVentaBean usa puntoVentaId, pero también acepta ID/id como fallback)
        const puntoVentaId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
        if (puntoVentaId) {
          // Mapear a PuntoVentaBeanSelector según Swagger: requiere ID, id, nombre, codigo
          // PuntoVentaBean (de la API) tiene: puntoVentaId -> se mapea a ID e id
          return {
            ID: puntoVentaId,
            id: puntoVentaId,
            nombre: pv.nombre || '',
            codigo: pv.codigo || ''
          };
        }
      }
      
      // Si no hay selección manual, usar la lógica automática
      if (this.puntosDeVenta && this.puntosDeVenta.length > 0) {
        // Filtrar solo puntos de venta activos
        // NOTA: Los campos editable/sugerido NO existen en la API (verificado en swagger.json)
        const puntosActivos = this.puntosDeVenta.filter(pv => {
          const esActivo = pv.activo === undefined || pv.activo === 1 || pv.activo === '1' || pv.activo === true;
          return esActivo;
        });

        if (puntosActivos.length === 0) {
          console.error('❌ No se encontraron puntos de venta activos');
          return { ID: null, id: null, nombre: '', codigo: '' };
        }

        // Buscar primero por ID 212819, luego por campo "Punto de Venta" 00004
        let puntoVenta = puntosActivos.find(pv => {
          const pvId = pv.puntoVentaId || pv.ID || pv.id || pv.puntoVenta_id;
          return pvId === 212819 || pvId === '212819';
        });

        if (!puntoVenta) {
          puntoVenta = puntosActivos.find(pv => {
            const puntoVenta = (pv.puntoVenta || '').toString().trim();
            return puntoVenta === '00004' || puntoVenta.includes('00004');
          });
        }

        if (!puntoVenta) {
          puntoVenta = puntosActivos[0];
        }
        
        if (puntoVenta) {
          // Obtener ID del punto de venta (PuntoVentaBean usa puntoVentaId, pero también acepta ID/id como fallback)
          const puntoVentaId = puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVenta_id;
          if (puntoVentaId) {
            // Mapear a PuntoVentaBeanSelector según Swagger: requiere ID, id, nombre, codigo
            // PuntoVentaBean (de la API) tiene: puntoVentaId -> se mapea a ID e id
            return {
              ID: puntoVentaId,
              id: puntoVentaId,
              nombre: puntoVenta.nombre || '',
              codigo: puntoVenta.codigo || ''
            };
          }
        }
        
        return { ID: null, id: null, nombre: '', codigo: '' };
      }
      
      return { ID: null, id: null, nombre: '', codigo: '' };
    },
    
    /**
     * Maneja la selección manual de un punto de venta
     * @param {Object} puntoVenta - Punto de venta seleccionado
     */
    seleccionarPuntoVentaDelDropdown(puntoVenta) {
      const puntoVentaId = puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVenta_id;
      this.puntoVentaSeleccionadoId = puntoVentaId;
      this.puntoVentaSeleccionadoParaFactura = puntoVenta;
      console.log('🏪 Punto de venta seleccionado manualmente:', puntoVenta);
    },

    /**
     * Obtiene el primer vendedor disponible o uno por defecto
     */
    obtenerVendedorPorDefecto() {
      return this.obtenerPorDefecto(this.vendedores, 'ID', 1, 'vendedor_id');
    },

    /**
     * Obtiene datos del cliente (incluyendo CUIT)
     */
    async obtenerDatosCliente(clienteId) {
      if (!this.accessToken || !clienteId) {
        return null;
      }

      try {
        const { response, data } = await this.requestXubio(`/clienteBean/${clienteId}`, 'GET');
        
        if (response.ok && data) {
          console.log('✅ Datos del cliente obtenidos:', data);
          return data;
        }
        return null;
      } catch (error) {
        console.error('❌ Error obteniendo datos del cliente:', error);
        return null;
      }
    },

    /**
     * Enriquece los productos con precios de la lista AGDP
     * @param {Array} productos - Array de productos sin precios
     * @returns {Array} Array de productos con precios agregados
     */
    async enriquecerProductosConPrecios(productos) {
      if (!productos || !Array.isArray(productos)) {
        return productos;
      }

      // Asegurar que tenemos la lista de precios AGDP cargada
      if (!this.listaPrecioAGDP) {
        await this.obtenerListaPrecioAGDP();
      }

      // Enriquecer cada producto con su precio
      return productos.map(producto => {
        const precio = this.obtenerPrecioProducto(producto);
        return {
          ...producto,
          precioAGDP: precio > 0 ? precio : null, // Agregar precio si existe
          precio: precio > 0 ? precio : null // También en campo precio para compatibilidad
        };
      });
    },

    /**
     * Obtiene el precio de un producto desde la lista AGDP
     * Intenta múltiples estructuras posibles de la API
     */
    obtenerPrecioProducto(producto) {
      if (!this.listaPrecioAGDP || !producto) {
        return 0;
      }
      
      // Según Swagger: ProductoVentaBean tiene campo "productoid" (no "id")
      const productoId = producto.productoid || producto.id || producto.ID || producto.producto_id;
      if (!productoId) {
        console.warn('⚠️ Producto sin ID:', producto);
        return 0;
      }
      
      // Normalizar IDs a número para comparación (la API puede devolver strings o números)
      const productoIdNum = Number(productoId);
      
      // Según Swagger: ListaPrecioBean tiene listaPrecioItem (array)
      // Estructura correcta: listaPrecioItem con { producto: { id, ID, productoid }, precio, codigo, referencia }
      if (Array.isArray(this.listaPrecioAGDP.listaPrecioItem)) {
        const item = this.listaPrecioAGDP.listaPrecioItem.find(i => {
          if (i.producto) {
            // El producto en listaPrecioItem puede tener id, ID, o productoid
            const itemProductoId = i.producto.productoid || i.producto.id || i.producto.ID;
            if (!itemProductoId) {
              return false;
            }
            // Comparar tanto como número como string para mayor compatibilidad
            const itemProductoIdNum = Number(itemProductoId);
            return itemProductoIdNum === productoIdNum || 
                   String(itemProductoId) === String(productoId) ||
                   itemProductoId === productoId;
          }
          return false;
        });
        
        if (item) {
          const precio = parseFloat(item.precio);
          if (precio && precio > 0) {
            console.log(`✅ Precio encontrado para producto ${productoId}:`, precio);
            return precio;
          }
        } else {
          // Log solo si hay items pero no se encontró match (para debug)
          if (this.listaPrecioAGDP.listaPrecioItem.length > 0) {
            const primerItem = this.listaPrecioAGDP.listaPrecioItem[0];
            console.debug(`🔍 Producto ${productoId} no encontrado en lista. Primer item ejemplo:`, {
              productoId: primerItem.producto?.productoid || primerItem.producto?.id || primerItem.producto?.ID,
              precio: primerItem.precio
            });
          }
        }
      } else {
        console.warn('⚠️ listaPrecioItem no es un array o no existe:', {
          tieneListaPrecioItem: !!this.listaPrecioAGDP.listaPrecioItem,
          tipo: typeof this.listaPrecioAGDP.listaPrecioItem,
          keys: Object.keys(this.listaPrecioAGDP)
        });
      }
      
      // Fallback: Intentar otras estructuras posibles (por compatibilidad)
      // Estructura 1: listaPrecioAGDP.precios[productoId]
      if (this.listaPrecioAGDP.precios && this.listaPrecioAGDP.precios[productoId]) {
        const precio = this.listaPrecioAGDP.precios[productoId];
        return typeof precio === 'number' ? precio : (precio.precio || precio.valor || 0);
      }
      
      // Estructura 2: listaPrecioAGDP.items (array con objetos que tienen producto y precio)
      if (Array.isArray(this.listaPrecioAGDP.items)) {
        const item = this.listaPrecioAGDP.items.find(i => {
          if (i.producto) {
            const itemProductoId = i.producto.productoid || i.producto.id || i.producto.ID;
            const itemProductoIdNum = Number(itemProductoId);
            return itemProductoIdNum === productoIdNum || 
                   String(itemProductoId) === String(productoId) ||
                   itemProductoId === productoId;
          }
          return i.producto_id === productoId || i.idProducto === productoId;
        });
        if (item) {
          return item.precio || item.valor || item.importe || 0;
        }
      }
      
      // Estructura 3: listaPrecioAGDP.detalle (array similar a items)
      if (Array.isArray(this.listaPrecioAGDP.detalle)) {
        const item = this.listaPrecioAGDP.detalle.find(i => {
          if (i.producto) {
            const itemProductoId = i.producto.productoid || i.producto.id || i.producto.ID;
            const itemProductoIdNum = Number(itemProductoId);
            return itemProductoIdNum === productoIdNum || 
                   String(itemProductoId) === String(productoId) ||
                   itemProductoId === productoId;
          }
          return i.producto_id === productoId || i.idProducto === productoId;
        });
        if (item) {
          return item.precio || item.valor || item.importe || 0;
        }
      }
      
      // Estructura 4: Precio directamente en el producto si viene de la lista
      if (producto.precio) {
        return producto.precio;
      }
      
      // Si no se encuentra, retornar 0 (se puede editar manualmente)
      return 0;
    },

    /**
     * Formatea el precio para mostrar
     */
    
    /**
     * Calcula el IVA de un item de producto
     * @param {Object} item - Item con cantidad y precio
     * @returns {number} IVA calculado
     */
    calcularIVA(item) {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precio = parseFloat(item.precio) || 0;
      const importe = cantidad * precio;
      // Asumiendo precio con IVA incluido al 21%
      const iva = importe - (importe / 1.21);
      return parseFloat(iva.toFixed(2));
    },

    /**
     * Selecciona un producto del dropdown y lo agrega
     */
    seleccionarProductoDelDropdown(producto) {
      this.agregarProducto(producto);
    },

    /**
     * Agrega un producto a la lista de seleccionados
     */
    agregarProducto(producto) {
      // Verificar si el producto ya está en la lista
      // Según Swagger: ProductoVentaBean tiene campo "productoid"
      const productoId = producto.productoid || producto.id || producto.ID || producto.producto_id;
      const yaExiste = this.productosSeleccionados.some(item => {
        const itemProductoId = item.producto_id || 
                              (item.producto && (item.producto.productoid || item.producto.id || item.producto.ID));
        return itemProductoId === productoId;
      });
      
      if (yaExiste) {
        this.mostrarResultado('productosList', 
          `⚠️ El producto "${producto.nombre || producto.codigo || 'Sin nombre'}" ya está en la lista`, 
          'info'
        );
        return;
      }
      
      // Usar precio enriquecido si está disponible, sino intentar obtenerlo
      const precio = producto.precioAGDP || producto.precio || this.obtenerPrecioProducto(producto) || 0;
      const item = {
        producto: producto,
        cantidad: 1,
        precio: precio > 0 ? precio : 0, // Si no hay precio, dejar en 0 para edición manual
        producto_id: productoId,
        descripcionPersonalizada: '' // Descripción personalizada editable por el usuario
      };
      
      this.productosSeleccionados.push(item);
      const mensaje = precio > 0 
        ? `✅ Producto "${producto.nombre || producto.codigo || 'Sin nombre'}" agregado con precio $${formatearPrecioUtil(precio)}`
        : `✅ Producto "${producto.nombre || producto.codigo || 'Sin nombre'}" agregado (precio: $0.00 - editar manualmente)`;
      
      this.mostrarResultado('productosList', mensaje, 'success');
    },

    /**
     * Elimina un producto de la lista de seleccionados
     */
    eliminarProducto(index) {
      this.productosSeleccionados.splice(index, 1);
    },


    /**
     * Lista clientes activos (con cache)
     * @param {boolean} forceRefresh - Si es true, fuerza la actualización desde la API
     */
    async listarClientes(forceRefresh = false) {
      if (!this.accessToken) {
        console.warn('⚠️ No hay token de acceso. Intentando obtener token...');
        this.mostrarResultado('clientesList', '⚠️ No hay token de acceso. Obteniendo token...', 'info');
        try {
          await this.obtenerToken();
          if (!this.accessToken) {
            this.mostrarResultado('clientesList', '❌ Error: No se pudo obtener el token. Por favor, obtén un token primero.', 'error');
            return;
          }
        } catch (error) {
          console.error('❌ Error obteniendo token:', error);
          this.mostrarResultado('clientesList', `❌ Error obteniendo token: ${error.message}`, 'error');
          return;
        }
      }

      // 1. Verificar cache en memoria (si ya está cargado y no se fuerza refresh)
      if (!forceRefresh && this.clientesList.length > 0) {
        this.mostrarResultado('clientesList', 
          `✅ ${this.clientesList.length} clientes ya cargados en memoria`, 
          'success'
        );
        return;
      }

      // 2. Verificar cache en localStorage
      if (!forceRefresh) {
        const cached = this.getCachedData('clientes');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.clientesList = cached;
          const edad = Math.floor((Date.now() - JSON.parse(localStorage.getItem('xubio_cache_clientes')).timestamp) / 1000 / 60);
          this.mostrarResultado('clientesList', 
            `✅ ${cached.length} clientes cargados desde cache (actualizado hace ${edad} minutos)\n\n💡 Haz clic en "Actualizar" para obtener datos frescos de la API`, 
            'success'
          );
          
          // Actualizar en background sin bloquear UI
          this.actualizarClientesEnBackground();
          return;
        }
      } else {
        // Invalidar cache si se fuerza refresh
        this.invalidarCache('clientes');
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo clientes...';
      this.mostrarResultado('clientesList', 'Obteniendo clientes desde la API...', 'info');

      try {
        // 3. Consultar API
        const { response, data } = await this.requestXubio('/clienteBean', 'GET', null, {
          activo: 1
        });

        if (response.ok && Array.isArray(data)) {
          console.log(`👥 Se obtuvieron ${data.length} clientes activos desde la API`);
          
          // Normalizar estructura de clientes
          const clientesNormalizados = data.map(cliente => {
            const clienteId = cliente.cliente_id || cliente.id || cliente.ID;
            const cuit = cliente.cuit || 
                        cliente.identificacionTributaria?.numero || 
                        cliente.CUIT ||
                        '';
            
            return {
              ...cliente,
              cliente_id: clienteId,
              cuit: cuit,
              razonSocial: cliente.razonSocial || cliente.nombre || '',
              nombre: cliente.nombre || cliente.razonSocial || ''
            };
          });
          
          this.clientesList = clientesNormalizados;
          
          // Guardar en cache
          this.setCachedData('clientes', clientesNormalizados, this.getTTL('clientes'));
          
          this.mostrarResultado('clientesList', 
            `✅ Se encontraron ${data.length} clientes activos (actualizados desde la API)`, 
            'success'
          );
        } else {
          this.mostrarResultado('clientesList',
            `❌ Error ${response.status}:\n${JSON.stringify(data, null, 2)}`, 
            'error'
          );
        }
      } catch (error) {
        this.mostrarResultado('clientesList', `❌ Error: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },
    
    /**
     * Actualiza clientes en background sin bloquear la UI
     */
    async actualizarClientesEnBackground() {
      try {
        const { response, data } = await this.requestXubio('/clienteBean', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          const clientesNormalizados = data.map(cliente => {
            const clienteId = cliente.cliente_id || cliente.id || cliente.ID;
            const cuit = cliente.cuit || 
                        cliente.identificacionTributaria?.numero || 
                        cliente.CUIT ||
                        '';
            
            return {
              ...cliente,
              cliente_id: clienteId,
              cuit: cuit,
              razonSocial: cliente.razonSocial || cliente.nombre || '',
              nombre: cliente.nombre || cliente.razonSocial || ''
            };
          });
          
          // Actualizar cache y memoria solo si hay cambios
          if (clientesNormalizados.length !== this.clientesList.length) {
            this.clientesList = clientesNormalizados;
            this.setCachedData('clientes', clientesNormalizados, this.getTTL('clientes'));
            console.log('🔄 Clientes actualizados en background');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error actualizando clientes en background:', error);
      }
    },


    /**
     * Selecciona un cliente del dropdown y lo asigna al campo de factura
     */
    seleccionarClienteDelDropdown(cliente) {
      const clienteId = cliente.cliente_id || cliente.id || cliente.ID;
      if (clienteId) {
        this.facturaClienteId = clienteId.toString();
        this.cobranzaClienteId = clienteId.toString();
        this.clienteSeleccionado = cliente;
        this.clienteSeleccionadoParaFactura = cliente; // Para mostrar en el card de factura
        
        this.mostrarResultado('clientesList', 
          `✅ Cliente seleccionado: ${cliente.razonSocial || cliente.nombre || 'Sin nombre'}\nCUIT: ${formatearCUITUtil(cliente.cuit || cliente.identificacionTributaria?.numero || '') || 'N/A'}\nID: ${clienteId}\n\n💡 El cliente se asignó a la factura.`, 
          'success'
        );
      }
    },
    
    /**
     * Limpia el cliente seleccionado para la factura
     */
    limpiarClienteFactura() {
      this.clienteSeleccionadoParaFactura = null;
      this.facturaClienteId = '';
      this.clienteSeleccionado = null;
    },

    /**
     * Formatea un CUIT con guiones (formato: XX-XXXXXXXX-X)
     * @param {string} cuit - CUIT sin formato o con formato
     * @returns {string} CUIT formateado
     */


    /**
     * Obtiene facturas pendientes de un cliente
     * @param {number} clienteId - ID del cliente
     */
    async obtenerFacturasPendientes(clienteId) {
      if (!this.accessToken || !clienteId) {
        this.mostrarResultado('cobranza', 'Error: Cliente ID requerido', 'error');
        return;
      }

      this.isLoading = true;
      this.loadingContext = 'Obteniendo facturas pendientes...';

      try {
        const { response, data } = await this.requestXubio('/comprobantesAsociados', 'GET', null, {
          clienteId: parseInt(clienteId),
          tipoComprobante: 1 // 1 = Factura
        });

        if (response.ok && Array.isArray(data)) {
          this.facturasPendientes = data.filter(f => {
            // Filtrar solo facturas con saldo pendiente
            const saldo = parseFloat(f.saldo || f.saldoPendiente || f.importeTotal || 0);
            return saldo > 0;
          });
          
          this.mostrarFacturasPendientes = true;
          this.mostrarResultado('cobranza', 
            `✅ Se encontraron ${this.facturasPendientes.length} facturas pendientes`, 
            'success'
          );
          return this.facturasPendientes;
        } else {
          this.mostrarResultado('cobranza', 
            `❌ Error obteniendo facturas: ${JSON.stringify(data, null, 2)}`, 
            'error'
          );
          return [];
        }
      } catch (error) {
        this.handleError(error, 'Obtención de facturas pendientes', 'cobranza');
        return [];
      } finally {
        this.isLoading = false;
        this.loadingContext = '';
      }
    },
    
    /**
     * Selecciona una factura pendiente y llena los campos
     * @param {Event} event - Evento del select
     */
    seleccionarFacturaPendiente(event) {
      const facturaStr = event.target.value;
      if (!facturaStr) {
        this.facturaParaCobrar = null;
        return;
      }
      
      try {
        const factura = JSON.parse(facturaStr);
        this.cobranzaIdComprobante = (factura.id || factura.ID || factura.transaccionId).toString();
        this.cobranzaImporte = (factura.saldo || factura.saldoPendiente || factura.importeTotal || 0).toString();
        
        // Cargar datos completos de la factura
        this.obtenerDatosFactura(this.cobranzaIdComprobante);
        
        this.mostrarResultado('cobranza', 
          `✅ Factura seleccionada: ${factura.numeroComprobante || factura.numero}\nSaldo: $${formatearPrecioUtil(parseFloat(this.cobranzaImporte))}`, 
          'success'
        );
      } catch (error) {
        console.error('Error parseando factura:', error);
      }
    },
    
    /**
     * Obtiene los datos completos de una factura
     * @param {number|string} idComprobante - ID del comprobante
     */
    async obtenerDatosFactura(idComprobante) {
      if (!this.accessToken || !idComprobante) {
        return null;
      }

      try {
        const { response, data } = await this.requestXubio(`/comprobanteVentaBean/${idComprobante}`, 'GET');
        
        if (response.ok && data) {
          this.facturaParaCobrar = data;
          console.log('✅ Datos de factura obtenidos:', data);
          return data;
        } else {
          this.facturaParaCobrar = null;
          return null;
        }
      } catch (error) {
        console.error('❌ Error obteniendo datos de factura:', error);
        this.facturaParaCobrar = null;
        return null;
      }
    },
    
    /**
     * Obtiene las cuentas disponibles (caja/banco)
     */
    async obtenerCuentas() {
      if (!this.accessToken) {
        return [];
      }

      try {
        const { response, data } = await this.requestXubio('/cuenta', 'GET', null, {
          activo: 1
        });
        
        if (response.ok && Array.isArray(data)) {
          // Filtrar solo cuentas de caja/banco (ajustar según estructura de la API)
          this.cuentasDisponibles = data.filter(c => 
            c.tipo === 'CAJA' || 
            c.tipo === 'BANCO' || 
            c.tipoCuenta === 1 || // 1 = Caja según documentación
            c.nombre?.toUpperCase().includes('CAJA')
          );
          console.log(`✅ ${this.cuentasDisponibles.length} cuentas cargadas`);
          return this.cuentasDisponibles;
        }
        return [];
      } catch (error) {
        console.error('❌ Error obteniendo cuentas:', error);
        return [];
      }
    },
    
    /**
     * Formatea el input de CUIT mientras el usuario escribe
     * @param {Event} event - Evento del input
     */
    formatearCUITInput(event) {
      const input = event.target;
      const valor = input.value;
      
      // Si el campo es facturaClienteId o cobranzaClienteId y parece ser un CUIT
      if ((input.id === 'facturaClienteId' || input.id === 'cobranzaClienteId') && valor) {
        // Si contiene solo números o números con guiones, formatear como CUIT
        if (/^[\d-]+$/.test(valor)) {
          const soloNumeros = valor.replace(/\D/g, '');
          
          // Si tiene más de 2 dígitos, formatear
          if (soloNumeros.length > 2 && soloNumeros.length <= 11) {
            let formateado = '';
            
            if (soloNumeros.length <= 2) {
              formateado = soloNumeros;
            } else if (soloNumeros.length <= 10) {
              formateado = `${soloNumeros.substring(0, 2)}-${soloNumeros.substring(2)}`;
            } else {
              formateado = `${soloNumeros.substring(0, 2)}-${soloNumeros.substring(2, 10)}-${soloNumeros.substring(10, 11)}`;
            }
            
            // Actualizar el valor solo si es diferente (evitar loops)
            if (formateado !== valor) {
              this.$nextTick(() => {
                if (input.id === 'facturaClienteId') {
                  this.facturaClienteId = formateado;
                } else if (input.id === 'cobranzaClienteId') {
                  this.cobranzaClienteId = formateado;
                }
              });
            }
          }
        }
      }
    }
  }
};

// Manejar errores no capturados de Promises (solo una vez, no por cada instancia)
// Este handler se registra globalmente y no necesita cleanup ya que es para toda la app
if (typeof window !== 'undefined' && !window.__vueErrorHandlersInitialized) {
  window.__vueErrorHandlersInitialized = true;
  const unhandledRejectionHandler = (event) => {
    console.error('🚨 Promise rechazada no manejada:', event.reason);
  };
  window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  // Guardar referencia para posible cleanup futuro si es necesario
  window.__vueUnhandledRejectionHandler = unhandledRejectionHandler;
}

// Export por defecto para compatibilidad
export default appOptions;
