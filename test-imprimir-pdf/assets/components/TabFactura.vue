<template>
  <div class="tab-factura">
    <h2>🧾 Crear Factura</h2>

    <!--Mensaje: SDK necesario -->
    <div v-if="!sdk" class="info error">
      ❌ SDK no disponible. Por favor, inicia sesión primero.
    </div>

    <!-- Sección: Productos -->
    <div class="section" v-if="sdk">
      <h3>📦 1. Productos</h3>
      <div class="info">
        💡 Productos cargados: {{ productosList.length }}. Selecciona los que quieras incluir.
      </div>

      <button @click="cargarProductos" :disabled="isLoading" class="btn-primary">
        🔄 Cargar Productos
      </button>

      <div v-if="productosListResult.visible" :class="['result', productosListResult.type]">
        {{ productosListResult.message }}
      </div>

      <!-- Selector de productos desde la lista cargada -->
      <div v-if="productosList.length > 0" class="form-inline" style="margin-top: 1rem;">
        <select v-model="productoIdTemp" class="select" style="flex: 2;">
          <option value="">-- Seleccionar producto de la lista --</option>
          <option v-for="producto in productosList"
                  :key="producto.id"
                  :value="producto.id">
            {{ producto.nombre }} - ${{ formatearPrecio(producto.precio) }}
          </option>
        </select>
        <input
          v-model.number="cantidadTemp"
          type="number"
          min="1"
          placeholder="Cantidad"
          class="input-small">
        <button @click="agregarProductoDesdeLista" :disabled="!productoIdTemp" class="btn-secondary">
          ➕ Agregar
        </button>
      </div>

      <!-- Card de Productos Seleccionados -->
      <div v-if="productosSeleccionados.length > 0" class="card">
        <h4>📦 Productos Seleccionados ({{ productosSeleccionados.length }})</h4>
        <ul>
          <li v-for="(item, idx) in productosSeleccionados" :key="idx">
            {{ item.nombre }} - Cant: {{ item.cantidad }} - ${{ formatearPrecio(item.precio * item.cantidad) }}
            <button @click="removerProducto(idx)" class="btn-small">✕</button>
          </li>
        </ul>
        <div class="total">
          <strong>Total: ${{ formatearPrecio(totalProductos) }}</strong>
        </div>
      </div>

    </div>

    <!-- Sección: Cliente -->
    <div class="section" v-if="sdk">
      <h3>👥 2. Cliente</h3>
      <div class="info">
        💡 Clientes cargados: {{ clientesList.length }}
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

    <!-- Sección: Configuración Factura -->
    <div class="section" v-if="sdk && clienteSeleccionado && productosSeleccionados.length > 0">
      <h3>⚙️ 3. Configuración</h3>

      <!-- Selector de Punto de Venta -->
      <div class="form-group">
        <label>Punto de Venta:</label>
        <select v-model="puntoVentaSeleccionado" class="select">
          <option :value="null">-- Automático (primer punto de venta) --</option>
          <option v-for="pv in puntosDeVenta"
                  :key="pv.ID || pv.id"
                  :value="pv">
            {{ pv.nombre }} (ID: {{ pv.ID || pv.id }})
            {{ pv.tipoAsignacion ? ` - ${pv.tipoAsignacion}` : '' }}
          </option>
        </select>
        <small v-if="puntosDeVenta.length > 0" style="color: #666; display: block; margin-top: 5px;">
          💡 {{ puntosDeVenta.length }} punto(s) de venta disponible(s).
          <span v-if="puntoVentaSeleccionado">
            Usando: <strong>{{ puntoVentaSeleccionado.nombre }}</strong>
          </span>
          <span v-else>
            Usando: <strong>{{ puntosDeVenta[0]?.nombre || 'N/A' }}</strong> (automático)
          </span>
        </small>
      </div>

      <div class="form-group">
        <label>Moneda:</label>
        <select v-model="facturaMoneda" class="select">
          <option value="ARS">ARS - Pesos Argentinos</option>
          <option value="USD">USD - Dólar Estadounidense</option>
        </select>
      </div>

      <div class="form-group" v-if="facturaMoneda !== 'ARS'">
        <label>Cotización:</label>
        <input v-model.number="facturaCotizacion" type="number" step="0.01" class="input">
      </div>

      <div class="form-group">
        <label>Condición de Pago:</label>
        <select v-model="facturaCondicionPago" class="select">
          <option :value="1">Cuenta Corriente</option>
          <option :value="2">Contado</option>
        </select>
      </div>

      <div class="form-group">
        <label>Fecha de Vencimiento:</label>
        <input v-model="facturaFechaVto" type="date" class="input">
      </div>

      <div class="form-group">
        <label>Descripción (opcional):</label>
        <input v-model="facturaDescripcion"
               placeholder="Ej: Servicios de consultoría"
               class="input">
      </div>
    </div>

    <!-- Botón Crear Factura -->
    <div class="section" v-if="puedeCrearFactura">
      <button @click="crearFactura"
              :disabled="isLoading"
              class="btn-create">
        🚀 Crear Factura
      </button>

      <div v-if="facturaResult.visible" :class="['result', facturaResult.type]">
        {{ facturaResult.message }}
      </div>
    </div>

    <!-- Mensaje de ayuda -->
    <div v-if="sdk && !puedeCrearFactura" class="info warning">
      ⚠️ Para crear una factura necesitas:
      <ul>
        <li v-if="!clienteSeleccionado">✓ Seleccionar un cliente</li>
        <li v-if="productosSeleccionados.length === 0">✓ Agregar al menos un producto</li>
      </ul>
    </div>

    <!-- Panel de Debug -->
    <div class="section debug-section" v-if="puedeCrearFactura">
      <div class="debug-header" @click="showDebugPanel = !showDebugPanel" style="cursor: pointer;">
        <h3>🔍 Debug - Pinpointing API {{ showDebugPanel ? '▼' : '▶' }}</h3>
        <p style="margin: 0; font-size: 12px; color: #666;">
          Haz clic para ver/ocultar el payload y la respuesta del servidor
        </p>
      </div>

      <div v-if="showDebugPanel" class="debug-content">
        <!-- Resumen Visual -->
        <div class="debug-summary">
          <h4>📋 Resumen de Datos a Enviar:</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <strong>Cliente:</strong>
              <span>{{ clienteSeleccionado.nombre || clienteSeleccionado.razonSocial }} (ID: {{ obtenerClienteId(clienteSeleccionado) }})</span>
            </div>
            <div class="summary-item">
              <strong>Productos:</strong>
              <span>{{ productosSeleccionados.length }} items - Total: ${{ formatearPrecio(totalProductos) }}</span>
            </div>
            <div class="summary-item">
              <strong>Moneda:</strong>
              <span>{{ facturaMoneda }}</span>
            </div>
            <div class="summary-item">
              <strong>Condición Pago:</strong>
              <span>{{ facturaCondicionPago === 1 ? 'Cuenta Corriente' : 'Contado' }}</span>
            </div>
            <div class="summary-item">
              <strong>Punto de Venta:</strong>
              <span v-if="puntoVentaSeleccionado || puntosDeVenta.length > 0">
                {{ (puntoVentaSeleccionado || puntosDeVenta[0]).nombre }}
                (ID: {{ (puntoVentaSeleccionado || puntosDeVenta[0]).puntoVentaId || (puntoVentaSeleccionado || puntosDeVenta[0]).ID }})
                <br>
                <small style="color: #666;">
                  Tipo: {{ (puntoVentaSeleccionado || puntosDeVenta[0]).tipoAsignacion || (puntoVentaSeleccionado || puntosDeVenta[0]).tipo || 'N/A' }}
                </small>
              </span>
              <span v-else style="color: red;">⚠️ Sin punto de venta</span>
            </div>
          </div>

          <!-- Lista de productos detallada -->
          <div class="products-detail">
            <strong>Detalle de Productos:</strong>
            <ul>
              <li v-for="(p, idx) in productosSeleccionados" :key="idx">
                <code>ID: {{ p.id }}</code> - {{ p.nombre }} - Cant: {{ p.cantidad }} - Precio Unit: ${{ formatearPrecio(p.precio) }} - Subtotal: ${{ formatearPrecio(p.precio * p.cantidad) }}
              </li>
            </ul>
          </div>
        </div>

        <!-- JSON del Payload (Request) -->
        <div v-if="debugPayload" class="debug-box">
          <div class="debug-box-header">
            <h4>📤 JSON Request (Payload enviado a Xubio)</h4>
            <button @click="copiarAlPortapapeles(debugPayload)" class="btn-copy">📋 Copiar JSON</button>
          </div>
          <pre class="json-code">{{ debugPayload }}</pre>
        </div>

        <!-- JSON de la Respuesta (Response) -->
        <div v-if="debugResponse" class="debug-box">
          <div class="debug-box-header">
            <h4>📥 JSON Response (Respuesta de Xubio)</h4>
            <button @click="copiarAlPortapapeles(debugResponse)" class="btn-copy">📋 Copiar JSON</button>
          </div>
          <pre class="json-code" :class="{ 'json-error': debugResponse.includes('error') || debugResponse.includes('Error') }">{{ debugResponse }}</pre>
        </div>

        <div v-if="!debugPayload && !debugResponse" class="info">
          💡 Presiona "🚀 Crear Factura" para ver el JSON del payload y la respuesta del servidor
        </div>
      </div>
    </div>
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
  emits: ['show-pdf'],
  data() {
    return {
      isLoading: false,

      // Productos
      productosList: [],
      productosSeleccionados: [],
      productosListResult: { message: '', type: '', visible: false },
      productoIdTemp: '',
      cantidadTemp: 1,

      // Clientes
      clientesList: [],
      clienteSeleccionado: null,
      clienteIdTemp: '',
      clientesListResult: { message: '', type: '', visible: false },

      // Puntos de Venta
      puntosDeVenta: [],
      puntoVentaSeleccionado: null,

      // Factura
      facturaMoneda: 'ARS',
      facturaCotizacion: 1,
      facturaCondicionPago: 2,
      facturaFechaVto: '',
      facturaDescripcion: '',
      facturaResult: { message: '', type: '', visible: false },

      // Debug
      debugPayload: null,
      debugResponse: null,
      showDebugPanel: false
    };
  },
  computed: {
    totalProductos() {
      return this.productosSeleccionados.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    },
    puedeCrearFactura() {
      return this.clienteSeleccionado &&
             this.productosSeleccionados.length > 0 &&
             !this.isLoading;
    }
  },
  mounted() {
    console.log('✅ TabFactura montado - SDK disponible:', !!this.sdk);
    if (this.sdk) {
      this.inicializar();
    }
  },
  methods: {
    async inicializar() {
      // Auto-cargar datos
      await Promise.all([
        this.cargarProductos(),
        this.cargarClientes(),
        this.cargarPuntosDeVenta()
      ]);
    },

    async cargarPuntosDeVenta() {
      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        console.log('🏪 Cargando puntos de venta...');
        const todosPuntosVenta = await sdk.getPuntosVenta(1);

        console.log('🏪 ESTRUCTURA COMPLETA DE PUNTOS DE VENTA:', JSON.stringify(todosPuntosVenta, null, 2));

        // Filtrar solo puntos de venta "editable-sugerido"
        // Campos posibles: tipoAsignacion, tipo, editable, sugerido
        this.puntosDeVenta = todosPuntosVenta.filter(pv => {
          const tipoAsignacion = pv.tipoAsignacion || pv.tipo || pv.tipoAsignacionPuntoVenta || '';
          const esEditable = pv.editable === true || pv.editable === 1;
          const esSugerido = pv.sugerido === true || pv.sugerido === 1;

          console.log(`🔍 Punto de venta: ${pv.nombre} (ID: ${pv.ID || pv.id}) - Tipo: ${tipoAsignacion}, Editable: ${esEditable}, Sugerido: ${esSugerido}`);

          // Intentar detectar "editable-sugerido" de varias formas
          const esEditableSugerido =
            tipoAsignacion.toLowerCase().includes('editable') && tipoAsignacion.toLowerCase().includes('sugerido') ||
            (esEditable && esSugerido);

          return esEditableSugerido;
        });

        console.log(`🏪 ${this.puntosDeVenta.length} puntos de venta tipo "editable-sugerido" encontrados de ${todosPuntosVenta.length} totales`);

        // Si no hay puntos de venta editable-sugerido, usar todos (para debug)
        if (this.puntosDeVenta.length === 0) {
          console.warn('⚠️ No se encontraron puntos de venta "editable-sugerido". Usando todos los puntos de venta disponibles.');
          this.puntosDeVenta = todosPuntosVenta;
        }
      } catch (error) {
        console.error('❌ Error cargando puntos de venta:', error);
        this.puntosDeVenta = [];
      }
    },

    async cargarProductos() {
      this.isLoading = true;
      this.mostrarResultado('productosList', 'Cargando productos con precios desde la API...', 'info');

      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        // Paso 1: Obtener listas de precios disponibles
        const { response: listasResponse, data: listas } = await sdk.request('/listaPrecioBean', 'GET');

        if (!listasResponse.ok) {
          throw new Error(`Error obteniendo listas de precios: ${listasResponse.status}`);
        }

        if (!Array.isArray(listas) || listas.length === 0) {
          throw new Error('No hay listas de precios disponibles');
        }

        // Usar la primera lista de precios disponible (o buscar la activa/por defecto)
        const listaPrecioId = listas[0].ID || listas[0].listaPrecioID || listas[0].id;
        const listaPrecioNombre = listas[0].nombre || 'Lista Principal';

        console.log(`📋 Usando lista de precios: ${listaPrecioNombre} (ID: ${listaPrecioId})`);

        // Paso 2: Obtener items de la lista con precios
        const { response: itemsResponse, data: listaDetalle } = await sdk.request(`/listaPrecioBean/${listaPrecioId}`, 'GET');

        if (!itemsResponse.ok) {
          throw new Error(`Error obteniendo items de lista de precios: ${itemsResponse.status}`);
        }

        const items = listaDetalle.listaPrecioItem || [];

        if (!Array.isArray(items)) {
          throw new Error('Respuesta inválida: no se encontraron items en la lista de precios');
        }

        // Mapear productos con precios
        this.productosList = items.map(item => {
          const producto = item.producto || {};
          const productoId = producto.ID || producto.id || producto.productoid;

          return {
            id: productoId,
            nombre: producto.nombre || producto.descripcion || 'Sin nombre',
            precio: item.precio || 0,
            descripcion: producto.descripcion || '',
            codigo: producto.codigo || '',
            listaPrecioId: listaPrecioId,
            listaPrecioNombre: listaPrecioNombre,
            listaPrecioItemId: item.listaPrecioID
          };
        }).filter(p => p.id && p.precio > 0); // Filtrar productos sin ID o precio

        console.log(`📦 ${this.productosList.length} productos con precios cargados desde la API`);
        this.mostrarResultado('productosList', `✅ ${this.productosList.length} productos con precios cargados`, 'success');
        this.showToast(`${this.productosList.length} productos cargados`, 'success');
      } catch (error) {
        console.error('❌ Error cargando productos:', error);
        this.mostrarResultado('productosList', `❌ Error: ${error.message}`, 'error');
        this.showToast(`Error: ${error.message}`, 'error');
        this.productosList = [];
      } finally {
        this.isLoading = false;
      }
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

        // Normalizar estructura de clientes (según app.js líneas 3232-3246)
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

    agregarProductoDesdeLista() {
      const producto = this.productosList.find(p => p.id === parseInt(this.productoIdTemp));

      if (!producto) {
        this.showToast('Error: Producto no encontrado', 'error');
        return;
      }

      if (this.cantidadTemp <= 0) {
        this.showToast('La cantidad debe ser mayor a 0', 'error');
        return;
      }

      this.productosSeleccionados.push({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: this.cantidadTemp,
        precio: producto.precio
      });

      this.showToast(`Producto agregado: ${producto.nombre} x${this.cantidadTemp}`, 'success');

      // Reset
      this.productoIdTemp = '';
      this.cantidadTemp = 1;
    },

    removerProducto(index) {
      const producto = this.productosSeleccionados[index];
      this.productosSeleccionados.splice(index, 1);
      this.showToast(`Producto eliminado: ${producto.nombre}`, 'success');
    },

    seleccionarClientePorId() {
      const cliente = this.clientesList.find(c =>
        this.obtenerClienteId(c) === parseInt(this.clienteIdTemp)
      );
      if (cliente) {
        this.clienteSeleccionado = cliente;
        this.showToast(`Cliente seleccionado: ${cliente.nombre || cliente.razonSocial}`, 'success');
      }
    },

    limpiarCliente() {
      this.clienteSeleccionado = null;
      this.clienteIdTemp = '';
      this.showToast('Cliente deseleccionado', 'info');
    },

    async crearFactura() {
      this.isLoading = true;
      this.mostrarResultado('factura', 'Creando factura...', 'info');

      try {
        const sdk = this.sdk();
        if (!sdk) throw new Error('SDK no disponible');

        // Validaciones
        if (!this.clienteSeleccionado) {
          throw new Error('Debes seleccionar un cliente');
        }
        if (this.productosSeleccionados.length === 0) {
          throw new Error('Debes agregar al menos un producto');
        }
        if (this.puntosDeVenta.length === 0) {
          throw new Error('No hay puntos de venta disponibles');
        }

        // Obtener punto de venta (seleccionado o primero por defecto)
        const puntoVenta = this.puntoVentaSeleccionado || this.puntosDeVenta[0];
        const puntoVentaId = puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id;

        console.log('🏪 Usando punto de venta:', {
          id: puntoVentaId,
          nombre: puntoVenta.nombre,
          codigo: puntoVenta.codigo,
          tipoAsignacion: puntoVenta.tipoAsignacion || puntoVenta.tipo || 'N/A',
          esSeleccionado: !!this.puntoVentaSeleccionado
        });

        // Construir fechas
        const fecha = new Date();
        const fechaISO = fecha.toISOString().split('T')[0];
        const fechaVto = this.facturaFechaVto || fechaISO;

        // Construir items de productos
        const transaccionProductoItems = this.productosSeleccionados.map(p => {
          const subtotal = p.precio * p.cantidad;
          const iva = parseFloat((subtotal - (subtotal / 1.21)).toFixed(2)); // IVA 21%

          return {
            cantidad: p.cantidad,
            precio: p.precio,
            descripcion: p.nombre,
            iva: iva,
            importe: subtotal,
            total: subtotal,
            montoExento: 0,
            porcentajeDescuento: 0,
            centroDeCosto: { ID: 1 } // Valor por defecto
          };
        });

        // Construir payload completo
        const payload = {
          circuitoContable: { ID: 1 }, // Valor por defecto
          comprobante: 1,
          tipo: 1, // 1=Factura
          comprobanteAsociado: 1,
          tienePeriodoServicio: false,
          fechaFacturacionServicioDesde: null,
          fechaFacturacionServicioHasta: null,
          cliente: {
            cliente_id: parseInt(this.obtenerClienteId(this.clienteSeleccionado))
          },
          fecha: fechaISO,
          fechaVto: fechaVto,
          condicionDePago: this.facturaCondicionPago,
          puntoVenta: {
            ID: puntoVentaId,
            id: puntoVentaId,
            nombre: puntoVenta.nombre || '',
            codigo: puntoVenta.codigo || ''
          },
          vendedor: { ID: 1 }, // Valor por defecto
          transaccionProductoItems: transaccionProductoItems,
          cantComprobantesCancelados: 0,
          cantComprobantesEmitidos: 0,
          cbuinformada: false,
          cotizacionListaDePrecio: this.facturaCotizacion,
          descripcion: this.facturaDescripcion || '',
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

        console.log('📤 Payload factura completo:', payload);

        // Guardar payload en debug (formatted)
        this.debugPayload = JSON.stringify(payload, null, 2);
        this.showDebugPanel = true; // Auto-abrir el panel al crear factura

        // Llamada real al SDK
        const { response, data } = await sdk.crearFactura(payload);

        // Guardar respuesta en debug (formatted)
        this.debugResponse = JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: data
        }, null, 2);

        if (!response.ok) {
          const errorMsg = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
          throw new Error(errorMsg);
        }

        console.log('✅ Factura creada:', data);

        // Construir mensaje de éxito
        const transaccionId = data.ID || data.id || data.transaccionId;
        const numeroComprobante = data.numeroComprobante || data.numero || 'N/A';

        this.mostrarResultado('factura',
          `✅ Factura creada exitosamente!\n\nNúmero: ${numeroComprobante}\nID: ${transaccionId}`,
          'success'
        );
        this.showToast('Factura creada exitosamente', 'success');

        // Obtener PDF si hay transacción ID
        if (transaccionId) {
          await this.obtenerPDF(transaccionId);
        }

      } catch (error) {
        console.error('❌ Error creando factura:', error);
        this.mostrarResultado('factura', `❌ Error: ${error.message}`, 'error');
        this.showToast(`Error: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
      }
    },

    async obtenerPDF(transaccionId) {
      try {
        const sdk = this.sdk();
        if (!sdk) return;

        console.log('📄 Obteniendo PDF para transacción:', transaccionId);

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
      return precio ? precio.toFixed(2) : '0.00';
    },

    async copiarAlPortapapeles(texto) {
      try {
        await navigator.clipboard.writeText(texto);
        this.showToast('JSON copiado al portapapeles', 'success');
      } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        this.showToast('Error copiando al portapapeles', 'error');
      }
    }
  }
}
</script>

<style scoped>
.tab-factura {
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

.btn-primary, .btn-secondary, .btn-create {
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
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

.card ul {
  list-style: none;
  padding: 0;
}

.card ul li {
  padding: 8px;
  border-bottom: 1px solid #dee2e6;
}

.card .total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #28a745;
  text-align: right;
  font-size: 18px;
  color: #28a745;
}

.form-inline {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
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

.input, .select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.input-small {
  width: 100px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
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

/* Debug Panel */
.debug-section {
  background: #f8f9fa;
  border: 2px solid #6c757d;
}

.debug-header {
  padding: 0;
}

.debug-header h3 {
  margin-bottom: 5px;
}

.debug-content {
  margin-top: 1rem;
}

.debug-summary {
  background: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  border: 1px solid #dee2e6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.summary-item {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #2196F3;
}

.summary-item strong {
  display: block;
  color: #495057;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item span {
  color: #212529;
  font-size: 14px;
}

.products-detail {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.products-detail ul {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
}

.products-detail li {
  padding: 6px;
  background: #fff;
  margin-bottom: 5px;
  border-radius: 3px;
  border: 1px solid #e9ecef;
  font-size: 13px;
}

.products-detail code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #d63384;
}

.debug-box {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  margin-bottom: 15px;
  overflow: hidden;
}

.debug-box-header {
  background: #212529;
  color: white;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-box-header h4 {
  margin: 0;
  font-size: 14px;
}

.btn-copy {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-copy:hover {
  background: #218838;
}

.json-code {
  background: #f8f9fa;
  padding: 15px;
  margin: 0;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #212529;
  max-height: 500px;
  overflow-y: auto;
  border-top: 1px solid #dee2e6;
}

.json-code.json-error {
  background: #f8d7da;
  color: #721c24;
}
</style>
