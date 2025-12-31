<template>
  <div class="tab-api-rest">
    <h2>🔬 Experimento: API REST + Bearer Token</h2>

    <div class="warning-box">
      ⚠️ <strong>EXPERIMENTAL</strong>: Este método está en fase de prueba.
      <br>El método XML Legacy ya está validado y funciona al 100%.
    </div>

    <!-- Sección 1: Obtener Bearer Token -->
    <div class="section">
      <h3>1️⃣ Obtener Bearer Token</h3>

      <div class="info">
        💡 El Bearer token se genera automáticamente al hacer login con Visma Connect.
        <br>Podés usar el token de tu sesión actual o hacer login programático.
      </div>

      <div class="token-options">
        <!-- Opción A: Token de sesión actual -->
        <div class="option-box">
          <h4>Opción A: Usar Token de Sesión Actual</h4>
          <p>Copiá el Bearer token de Network tab (cualquier request a /api/*):</p>

          <div class="form-group">
            <label for="bearerToken">Bearer Token:</label>
            <input
              type="text"
              id="bearerToken"
              v-model="bearerToken"
              placeholder="Pegá el Bearer token acá"
            >
          </div>

          <button @click="testBearerToken" :disabled="!bearerToken || isLoading">
            {{ isLoading ? '⏳ Verificando...' : '✅ Verificar Token' }}
          </button>
        </div>

        <!-- Opción B: Login programático (pendiente) -->
        <div class="option-box disabled">
          <h4>Opción B: Login Programático</h4>
          <p>⏳ Pendiente de implementar (requiere replicar flujo Visma Connect)</p>
        </div>
      </div>

      <!-- Resultado de verificación -->
      <div v-if="tokenVerified" class="result success">
        ✅ Token válido. Empresa: {{ empresaInfo.nombre }}
      </div>
      <div v-else-if="tokenError" class="result error">
        ❌ {{ tokenError }}
      </div>
    </div>

    <!-- Sección 2: Crear Factura con API REST -->
    <div v-if="tokenVerified" class="section">
      <h3>2️⃣ Crear Factura con API REST</h3>

      <!-- Selector de Cliente -->
      <div class="form-group">
        <label for="cliente">Cliente:</label>
        <select id="cliente" v-model="selectedCliente">
          <option value="">Seleccioná un cliente</option>
          <option v-for="cliente in clientes" :key="cliente.clienteId" :value="cliente.clienteId">
            {{ cliente.nombre }} (ID: {{ cliente.clienteId }})
          </option>
        </select>
      </div>

      <!-- Selector de Productos -->
      <div class="form-group">
        <label>Productos:</label>
        <div v-for="(item, index) in items" :key="index" class="item-row">
          <select v-model="item.productoId">
            <option value="">Seleccioná producto</option>
            <option v-for="prod in productos" :key="prod.id" :value="prod.id">
              {{ prod.nombre }} - ${{ prod.precio }}
            </option>
          </select>
          <input type="number" v-model="item.cantidad" min="1" placeholder="Cant" style="width: 80px">
          <button @click="removeItem(index)" class="btn-danger-small">❌</button>
        </div>
        <button @click="addItem" class="btn-secondary">➕ Agregar Producto</button>
      </div>

      <!-- Botón Crear Factura -->
      <button @click="crearFacturaApiRest" :disabled="!canCreateInvoice || isLoading" class="btn-primary">
        {{ isLoading ? '⏳ Creando factura...' : '🚀 Crear Factura con API REST' }}
      </button>
    </div>

    <!-- Debug Panel -->
    <div v-if="debugData.request || debugData.response" class="section debug-section">
      <h3>🔍 Debug - API REST</h3>

      <!-- Request -->
      <div v-if="debugData.request" class="debug-box">
        <div class="debug-box-header">
          <h4>📤 Request Payload</h4>
          <button @click="copyToClipboard(debugData.request)" class="btn-copy">📋 Copiar</button>
        </div>
        <pre class="json-code">{{ debugData.request }}</pre>
      </div>

      <!-- Response -->
      <div v-if="debugData.response" class="debug-box">
        <div class="debug-box-header">
          <h4>📥 Response</h4>
          <button @click="copyToClipboard(debugData.response)" class="btn-copy">📋 Copiar</button>
        </div>
        <pre
          class="json-code"
          :class="{ 'json-error': debugData.responseStatus >= 400 }"
        >{{ debugData.response }}</pre>
      </div>

      <!-- Comparación con XML Legacy -->
      <div v-if="facturaCreada" class="comparison-box">
        <h4>📊 Comparación: API REST vs XML Legacy</h4>
        <table class="comparison-table">
          <tr>
            <th>Aspecto</th>
            <th>API REST</th>
            <th>XML Legacy</th>
          </tr>
          <tr>
            <td>Factura creada</td>
            <td>{{ facturaCreada ? '✅' : '❌' }}</td>
            <td>✅</td>
          </tr>
          <tr>
            <td>TransaccionID en response</td>
            <td>{{ transaccionIdEnResponse ? '✅' : '❌' }}</td>
            <td>❌ (DOM scraping)</td>
          </tr>
          <tr>
            <td>PDF URL en response</td>
            <td>{{ pdfUrlEnResponse ? '✅' : '❌' }}</td>
            <td>❌ (construir manualmente)</td>
          </tr>
          <tr>
            <td>Velocidad</td>
            <td>{{ tiempoRespuesta }}ms</td>
            <td>~3000ms (espera DOM)</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Resultado Final -->
    <div v-if="resultado" class="section">
      <h3>✅ Resultado</h3>
      <div :class="['result', resultado.success ? 'success' : 'error']">
        <div v-html="resultado.mensaje"></div>
        <div v-if="resultado.numeroComprobante">
          <strong>Comprobante:</strong> {{ resultado.numeroComprobante }}
        </div>
        <div v-if="resultado.pdfUrl">
          <strong>PDF:</strong> <a :href="resultado.pdfUrl" target="_blank">Ver PDF</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabApiRest',
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
  data() {
    return {
      // Token
      bearerToken: '',
      tokenVerified: false,
      tokenError: null,
      empresaInfo: {},

      // Datos
      clientes: [],
      productos: [],
      selectedCliente: '',
      items: [{ productoId: '', cantidad: 1 }],

      // Estado
      isLoading: false,
      debugData: {
        request: null,
        response: null,
        responseStatus: null
      },

      // Resultado
      resultado: null,
      facturaCreada: false,
      transaccionIdEnResponse: false,
      pdfUrlEnResponse: false,
      tiempoRespuesta: 0
    };
  },
  computed: {
    canCreateInvoice() {
      return this.selectedCliente &&
             this.items.some(item => item.productoId && item.cantidad > 0);
    }
  },
  methods: {
    async testBearerToken() {
      if (!this.bearerToken.trim()) {
        this.tokenError = 'Ingresá el Bearer token';
        return;
      }

      this.isLoading = true;
      this.tokenError = null;

      try {
        const response = await fetch('https://xubio.com/api/dashboard/datosUsuario', {
          headers: {
            'Authorization': `Bearer ${this.bearerToken.trim()}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.empresaInfo = data;
          this.tokenVerified = true;
          this.showToast('Token válido', 'success');

          // Cargar datos
          await this.cargarDatos();
        } else {
          this.tokenError = `Token inválido (${response.status})`;
        }
      } catch (error) {
        this.tokenError = `Error: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },

    async cargarDatos() {
      const sdk = this.sdk();
      if (!sdk) {
        console.warn('SDK no disponible');
        return;
      }

      try {
        // Usar el SDK para cargar clientes y productos
        this.clientes = await sdk.getClientes();
        this.productos = await sdk.getProductos();
      } catch (error) {
        console.error('Error cargando datos:', error);
        this.showToast('Error cargando datos', 'error');
      }
    },

    addItem() {
      this.items.push({ productoId: '', cantidad: 1 });
    },

    removeItem(index) {
      this.items.splice(index, 1);
    },

    async crearFacturaApiRest() {
      this.isLoading = true;
      this.resultado = null;
      this.debugData = { request: null, response: null, responseStatus: null };

      const startTime = Date.now();

      try {
        // Construir payload
        const payload = {
          puntoVenta: { id: 212819 }, // corvusweb srl
          cliente: { id: parseInt(this.selectedCliente, 10) },
          items: this.items
            .filter(item => item.productoId && item.cantidad > 0)
            .map(item => {
              const producto = this.productos.find(p => p.id === item.productoId);
              return {
                producto: { id: item.productoId },
                cantidad: item.cantidad,
                precio: producto?.precio || 0
              };
            }),
          condicionPago: 1, // Cuenta Corriente
          moneda: { id: -2 } // Pesos Argentinos
        };

        this.debugData.request = JSON.stringify(payload, null, 2);

        // Hacer request
        const response = await fetch('https://xubio.com/api/argentina/comprobanteVentaBean', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken.trim()}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        this.tiempoRespuesta = Date.now() - startTime;
        this.debugData.responseStatus = response.status;

        const responseData = await response.json();
        this.debugData.response = JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }, null, 2);

        if (response.ok) {
          this.facturaCreada = true;
          this.transaccionIdEnResponse = !!responseData.id || !!responseData.transaccionId;
          this.pdfUrlEnResponse = !!responseData.pdfUrl;

          this.resultado = {
            success: true,
            mensaje: '✅ Factura creada exitosamente con API REST',
            numeroComprobante: responseData.numeroComprobante || 'N/A',
            pdfUrl: responseData.pdfUrl || null
          };

          this.showToast('Factura creada con API REST', 'success');
        } else {
          this.resultado = {
            success: false,
            mensaje: `❌ Error: ${responseData.error || responseData.message || 'Error desconocido'}`
          };
        }
      } catch (error) {
        this.debugData.response = JSON.stringify({
          error: error.message,
          stack: error.stack
        }, null, 2);

        this.resultado = {
          success: false,
          mensaje: `❌ Error: ${error.message}`
        };
      } finally {
        this.isLoading = false;
      }
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
        .then(() => this.showToast('Copiado al portapapeles', 'success'))
        .catch(() => this.showToast('Error copiando', 'error'));
    }
  }
};
</script>

<style scoped>
.tab-api-rest {
  padding: 2rem;
}

.warning-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 14px;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info {
  background: #e3f2fd;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 15px;
  border-left: 4px solid #2196F3;
  font-size: 14px;
}

.token-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.option-box {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #dee2e6;
}

.option-box.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.option-box h4 {
  margin-top: 0;
  color: #495057;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #495057;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.item-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.item-row select {
  flex: 1;
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

.btn-primary {
  background: #007bff;
  font-weight: bold;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
}

.btn-danger-small {
  background: #dc3545;
  padding: 5px 10px;
  font-size: 0.9rem;
  margin: 0;
}

.btn-copy {
  background: #17a2b8;
  padding: 5px 15px;
  font-size: 0.85rem;
  margin: 0;
}

.debug-section {
  background: #f1f3f5;
}

.debug-box {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.debug-box-header {
  background: #343a40;
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

.json-code {
  background: #282c34;
  color: #abb2bf;
  padding: 15px;
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 400px;
}

.json-code.json-error {
  background: #3d1f1f;
  color: #ff6b6b;
}

.comparison-box {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  border: 1px solid #dee2e6;
  padding: 10px;
  text-align: left;
}

.comparison-table th {
  background: #343a40;
  color: white;
  font-weight: bold;
}

.comparison-table tr:nth-child(even) {
  background: #f8f9fa;
}

.result {
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
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
</style>
