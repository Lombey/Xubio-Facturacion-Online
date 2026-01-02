<template>
  <div class="tab-cobranza">
    <h2>💰 Crear Cobranza</h2>

    <!-- Mensaje: SDK necesario -->
    <div v-if="!sdk" class="info error">
      ❌ SDK no disponible. Por favor, inicia sesión primero.
    </div>

    <!-- Sección: Cliente -->
    <div class="section" v-if="sdk">
      <h3>👥 1. Cliente</h3>
      <div class="info">
        💡 Selecciona un cliente para ver sus facturas pendientes
      </div>

      <button @click="cargarClientes" :disabled="isLoading" class="btn-primary">
        🔄 Cargar Clientes
      </button>

      <div v-if="clientesListResult.visible" :class="['result', clientesListResult.type]">
        {{ clientesListResult.message }}
      </div>

      <!-- Cliente Seleccionado -->
      <div v-if="clienteSeleccionado" class="card-cliente">
        <h4>Cliente Seleccionado:</h4>
        <p><strong>{{ clienteSeleccionado.nombre || clienteSeleccionado.razonSocial }}</strong></p>
        <p>ID: {{ obtenerClienteId(clienteSeleccionado) }}</p>
        <button @click="limpiarCliente" class="btn-small">✕ Cambiar</button>
      </div>

      <!-- Selector simple -->
      <select v-if="!clienteSeleccionado && clientesList.length > 0"
              v-model="clienteIdTemp"
              @change="seleccionarClientePorId"
              class="select">
        <option value="">-- Seleccionar cliente --</option>
        <option v-for="cliente in clientesList"
                :key="obtenerClienteId(cliente)"
                :value="obtenerClienteId(cliente)">
          {{ cliente.nombre || cliente.razonSocial }} (ID: {{ obtenerClienteId(cliente) }})
        </option>
      </select>
    </div>

    <!-- Sección: Facturas Pendientes -->
    <div class="section" v-if="sdk && clienteSeleccionado">
      <h3>📄 2. Factura a Cobrar</h3>
      <div class="info">
        💡 Facturas con saldo pendiente: {{ facturasPendientes.length }}
      </div>

      <button @click="cargarFacturasPendientes" :disabled="isLoading" class="btn-primary">
        🔄 Cargar Facturas Pendientes
      </button>

      <div v-if="facturasListResult.visible" :class="['result', facturasListResult.type]">
        {{ facturasListResult.message }}
      </div>

      <!-- Factura Seleccionada -->
      <div v-if="facturaSeleccionada" class="card">
        <h4>Factura Seleccionada:</h4>
        <p><strong>Número:</strong> {{ facturaSeleccionada.numeroComprobante || facturaSeleccionada.numero }}</p>
        <p><strong>ID:</strong> {{ facturaSeleccionada.id || facturaSeleccionada.ID }}</p>
        <p><strong>Saldo:</strong> ${{ formatearPrecio(facturaSeleccionada.saldo || facturaSeleccionada.saldoPendiente || facturaSeleccionada.importeTotal) }}</p>
        <button @click="limpiarFactura" class="btn-small">✕ Cambiar</button>
      </div>

      <!-- Selector de facturas -->
      <select v-if="!facturaSeleccionada && facturasPendientes.length > 0"
              v-model="facturaIdTemp"
              @change="seleccionarFacturaPorId"
              class="select">
        <option value="">-- Seleccionar factura --</option>
        <option v-for="factura in facturasPendientes"
                :key="factura.id || factura.ID"
                :value="factura.id || factura.ID">
          {{ factura.numeroComprobante || factura.numero }} - Saldo: ${{ formatearPrecio(factura.saldo || factura.saldoPendiente || factura.importeTotal) }}
        </option>
      </select>
    </div>

    <!-- Sección: Configuración Cobranza -->
    <div class="section" v-if="sdk && clienteSeleccionado && facturaSeleccionada">
      <h3>⚙️ 3. Configuración</h3>

      <div class="form-group">
        <label>Importe a Cobrar:</label>
        <input v-model.number="cobranzaImporte"
               type="number"
               step="0.01"
               class="input"
               :max="facturaSeleccionada.saldo || facturaSeleccionada.saldoPendiente || facturaSeleccionada.importeTotal">
        <small>Máximo: ${{ formatearPrecio(facturaSeleccionada.saldo || facturaSeleccionada.saldoPendiente || facturaSeleccionada.importeTotal) }}</small>
      </div>

      <div class="form-group">
        <label>Forma de Pago:</label>
        <select v-model="formaPago" class="select">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div class="form-group">
        <label>Descripción (opcional):</label>
        <input v-model="descripcion"
               placeholder="Ej: Cobranza parcial"
               class="input">
      </div>
    </div>

    <!-- Botón Crear Cobranza -->
    <div class="section" v-if="puedeCrearCobranza">
      <button @click="crearCobranza"
              :disabled="isLoading"
              class="btn-create">
        🚀 Crear Cobranza
      </button>

      <div v-if="cobranzaResult.visible" :class="['result', cobranzaResult.type]">
        {{ cobranzaResult.message }}
      </div>
    </div>

    <!-- Mensaje de ayuda -->
    <div v-if="sdk && !puedeCrearCobranza" class="info warning">
      ⚠️ Para crear una cobranza necesitas:
      <ul>
        <li v-if="!clienteSeleccionado">✓ Seleccionar un cliente</li>
        <li v-if="!facturaSeleccionada">✓ Seleccionar una factura pendiente</li>
        <li v-if="cobranzaImporte <= 0">✓ Ingresar un importe válido</li>
      </ul>
    </div>
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
  emits: ['show-pdf'],
  data() {
    return {
      isLoading: false,

      // Clientes
      clientesList: [],
      clienteSeleccionado: null,
      clienteIdTemp: '',
      clientesListResult: { message: '', type: '', visible: false },

      // Facturas Pendientes
      facturasPendientes: [],
      facturaSeleccionada: null,
      facturaIdTemp: '',
      facturasListResult: { message: '', type: '', visible: false },

      // Cobranza
      cobranzaImporte: 0,
      formaPago: 'efectivo',
      descripcion: '',
      cobranzaResult: { message: '', type: '', visible: false }
    };
  },
  computed: {
    puedeCrearCobranza() {
      return this.clienteSeleccionado &&
             this.facturaSeleccionada &&
             this.cobranzaImporte > 0 &&
             !this.isLoading;
    }
  },
  mounted() {
    console.log('✅ TabCobranza montado - SDK disponible:', !!this.sdk);
    if (this.sdk) {
      this.inicializar();
    }
  },
  methods: {
    async inicializar() {
      // Auto-cargar clientes
      await this.cargarClientes();
    },

    async cargarClientes() {
      this.isLoading = true;
      this.mostrarResultado('clientesList', 'Cargando clientes desde la API...', 'info');

      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        // Llamada real al SDK
        const { response, data } = await sdk.request('/clienteBean', 'GET', null, { activo: 1 });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Respuesta inválida: se esperaba un array de clientes');
        }

        // Normalizar estructura de clientes
        this.clientesList = data.map(cliente => {
          const clienteId = cliente.cliente_id || cliente.id || cliente.ID;
          const cuit = cliente.cuit ||
                      cliente.identificacionTributaria?.numero ||
                      cliente.CUIT ||
                      '';

          return {
            ...cliente,
            cliente_id: clienteId,
            ID: clienteId,
            cuit: cuit,
            razonSocial: cliente.razonSocial || cliente.nombre || '',
            nombre: cliente.nombre || cliente.razonSocial || ''
          };
        });

        console.log(`👥 ${this.clientesList.length} clientes cargados desde la API`);
        this.mostrarResultado('clientesList', `✅ ${this.clientesList.length} clientes cargados desde la API`, 'success');
        this.showToast(`${this.clientesList.length} clientes cargados`, 'success');
      } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        this.mostrarResultado('clientesList', `❌ Error: ${error.message}`, 'error');
        this.showToast(`Error: ${error.message}`, 'error');
        this.clientesList = [];
      } finally {
        this.isLoading = false;
      }
    },

    async cargarFacturasPendientes() {
      if (!this.clienteSeleccionado) {
        this.showToast('Selecciona un cliente primero', 'error');
        return;
      }

      this.isLoading = true;
      this.mostrarResultado('facturasList', 'Cargando facturas pendientes...', 'info');

      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        const clienteId = this.obtenerClienteId(this.clienteSeleccionado);

        // Llamada real al SDK
        const { response, data } = await sdk.request('/comprobantesAsociados', 'GET', null, {
          clienteId: parseInt(clienteId),
          tipoComprobante: 1 // 1 = Factura
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Respuesta inválida: se esperaba un array de facturas');
        }

        // Filtrar solo facturas con saldo pendiente
        this.facturasPendientes = data.filter(f => {
          const saldo = parseFloat(f.saldo || f.saldoPendiente || f.importeTotal || 0);
          return saldo > 0;
        });

        console.log(`📄 ${this.facturasPendientes.length} facturas pendientes encontradas`);
        this.mostrarResultado('facturasList', `✅ ${this.facturasPendientes.length} facturas pendientes`, 'success');
        this.showToast(`${this.facturasPendientes.length} facturas pendientes`, 'success');
      } catch (error) {
        console.error('❌ Error cargando facturas pendientes:', error);
        this.mostrarResultado('facturasList', `❌ Error: ${error.message}`, 'error');
        this.showToast(`Error: ${error.message}`, 'error');
        this.facturasPendientes = [];
      } finally {
        this.isLoading = false;
      }
    },

    seleccionarClientePorId() {
      const cliente = this.clientesList.find(c =>
        this.obtenerClienteId(c) === parseInt(this.clienteIdTemp)
      );
      if (cliente) {
        this.clienteSeleccionado = cliente;
        this.showToast(`Cliente seleccionado: ${cliente.nombre || cliente.razonSocial}`, 'success');

        // Auto-cargar facturas pendientes
        this.cargarFacturasPendientes();
      }
    },

    seleccionarFacturaPorId() {
      const factura = this.facturasPendientes.find(f =>
        (f.id || f.ID) === parseInt(this.facturaIdTemp)
      );
      if (factura) {
        this.facturaSeleccionada = factura;

        // Pre-rellenar importe con saldo pendiente
        this.cobranzaImporte = parseFloat(factura.saldo || factura.saldoPendiente || factura.importeTotal || 0);

        this.showToast(`Factura seleccionada: ${factura.numeroComprobante || factura.numero}`, 'success');
      }
    },

    limpiarCliente() {
      this.clienteSeleccionado = null;
      this.clienteIdTemp = '';
      this.facturasPendientes = [];
      this.facturaSeleccionada = null;
      this.facturaIdTemp = '';
      this.showToast('Cliente deseleccionado', 'info');
    },

    limpiarFactura() {
      this.facturaSeleccionada = null;
      this.facturaIdTemp = '';
      this.cobranzaImporte = 0;
      this.showToast('Factura deseleccionada', 'info');
    },

    async crearCobranza() {
      this.isLoading = true;
      this.mostrarResultado('cobranza', 'Creando cobranza...', 'info');

      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        // Validaciones
        if (!this.clienteSeleccionado) {
          throw new Error('Debes seleccionar un cliente');
        }
        if (!this.facturaSeleccionada) {
          throw new Error('Debes seleccionar una factura');
        }
        if (this.cobranzaImporte <= 0) {
          throw new Error('El importe debe ser mayor a 0');
        }

        const clienteId = this.obtenerClienteId(this.clienteSeleccionado);
        const facturaId = this.facturaSeleccionada.id || this.facturaSeleccionada.ID;

        // Obtener datos completos de la factura
        console.log('📄 Obteniendo datos de factura:', facturaId);
        const { response: compResponse, data: comprobante } = await sdk.request(`/comprobanteVentaBean/${facturaId}`, 'GET');

        if (!compResponse.ok) {
          throw new Error('No se pudo obtener los datos de la factura');
        }

        // Construir payload completo
        const fecha = new Date().toISOString().split('T')[0];

        const payload = {
          circuitoContable: comprobante.circuitoContable || { ID: 1 },
          cliente: { cliente_id: parseInt(clienteId) },
          fecha: fecha,
          monedaCtaCte: comprobante.moneda || { ID: 1 },
          cotizacion: comprobante.cotizacion || 1,
          utilizaMonedaExtranjera: (comprobante.moneda?.codigo && comprobante.moneda.codigo !== 'ARS') ? 1 : 0,
          // Instrumento de cobro (medio de pago)
          transaccionInstrumentoDeCobro: [{
            cuentaTipo: 1, // 1 = Caja
            cuenta: { ID: 1, id: 1 }, // Cuenta por defecto
            moneda: comprobante.moneda || { ID: 1 },
            cotizacion: comprobante.cotizacion || 1,
            importe: parseFloat(this.cobranzaImporte),
            descripcion: this.descripcion || `Cobranza de factura ${comprobante.numeroComprobante || facturaId}`
          }],
          // Asociar factura
          detalleCobranzas: [{
            idComprobante: parseInt(facturaId),
            importe: parseFloat(this.cobranzaImporte)
          }]
        };

        console.log('📤 Payload cobranza completo:', payload);

        // Llamada real al SDK
        const { response, data } = await sdk.crearCobranza(payload);

        if (!response.ok) {
          const errorMsg = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log('✅ Cobranza creada:', data);

        // Construir mensaje de éxito
        const transaccionId = data.transaccionId || data.transaccionid || data.id || data.ID;
        const numero = data.numeroComprobante || data.numero || 'N/A';

        this.mostrarResultado('cobranza',
          `✅ Cobranza creada exitosamente!\n\nNúmero: ${numero}\nID: ${transaccionId}\nImporte: $${this.cobranzaImporte}`,
          'success'
        );
        this.showToast('Cobranza creada exitosamente', 'success');

        // Obtener PDF si hay transacción ID
        if (transaccionId) {
          await this.obtenerPDF(transaccionId);
        }

        // Limpiar formulario
        this.limpiarFactura();

      } catch (error) {
        console.error('❌ Error creando cobranza:', error);
        this.mostrarResultado('cobranza', `❌ Error: ${error.message}`, 'error');
        this.showToast(`Error: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
      }
    },

    async obtenerPDF(transaccionId) {
      try {
        const sdk = this.sdk();
        if (!sdk) return;

        console.log('📄 Obteniendo PDF para cobranza:', transaccionId);

        const { response, data } = await sdk.obtenerPDF(transaccionId, '1');

        if (response.ok && data) {
          console.log('✅ PDF obtenido:', data);

          // Emitir evento para mostrar PDF
          const pdfUrl = data.url || data.pdfUrl || data.link;
          if (pdfUrl) {
            this.$emit('show-pdf', pdfUrl);
            this.showToast('PDF generado', 'success');
          }
        }
      } catch (error) {
        console.error('⚠️ Error obteniendo PDF:', error);
        // No mostrar error al usuario, el PDF es opcional
      }
    },

    obtenerClienteId(cliente) {
      return cliente.ID || cliente.id || cliente.cliente_id;
    },

    mostrarResultado(key, message, type) {
      const resultKey = `${key}Result`;
      if (this[resultKey]) {
        this[resultKey] = { message, type, visible: true };
      }
    },

    formatearPrecio(precio) {
      return precio ? parseFloat(precio).toFixed(2) : '0.00';
    }
  }
}
</script>

<style scoped>
.tab-cobranza {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h3 {
  margin-top: 0;
  color: #2196F3;
}

.info {
  background: #e3f2fd;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 15px;
  border-left: 4px solid #2196F3;
  font-size: 14px;
}

.info.error {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.info.warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.btn-primary, .btn-create {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-create {
  background: #4CAF50;
  color: white;
  font-size: 16px;
  padding: 15px 30px;
}

.btn-create:hover:not(:disabled) {
  background: #45a049;
}

.btn-small {
  background: #dc3545;
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}

.btn-small:hover {
  background: #c82333;
}

button:disabled {
  background: #cccccc !important;
  cursor: not-allowed;
}

.card, .card-cliente {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
  border: 1px solid #dee2e6;
}

.card h4, .card-cliente h4 {
  margin-top: 0;
  color: #495057;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #495057;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #6c757d;
  font-size: 12px;
}

.input, .select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.result {
  padding: 12px;
  border-radius: 5px;
  margin-top: 10px;
  font-size: 13px;
  white-space: pre-wrap;
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

ul {
  margin: 10px 0;
  padding-left: 20px;
}
</style>
