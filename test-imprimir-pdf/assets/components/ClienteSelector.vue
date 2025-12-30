<template>
  <div class="cliente-selector">
    <div class="form-group">
      <label for="selectorCliente">🔍 Buscar Cliente:</label>
      <div style="position: relative;">
        <input 
          type="text" 
          id="selectorCliente" 
          v-model="busquedaCliente" 
          @input="mostrarDropdown = true"
          @focus="mostrarDropdown = true"
          @blur="ocultarDropdown"
          placeholder="Buscar por CUIT, razón social o nombre..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        
        <!-- Dropdown de clientes -->
        <div 
          v-if="mostrarDropdown && clientesFiltrados.length > 0"
          class="dropdown-clientes">
          <div 
            v-for="cliente in clientesFiltrados" 
            :key="cliente.cliente_id || cliente.id || cliente.ID"
            @click="seleccionarCliente(cliente)"
            class="dropdown-item">
            <div>
              <strong>{{ cliente.razonSocial || cliente.nombre || 'Sin nombre' }}</strong>
              <div style="font-size: 12px; color: #666;">
                CUIT: {{ formatearCUIT(cliente.cuit || cliente.identificacionTributaria?.numero || '') || 'N/A' }}
                <span v-if="cliente.cliente_id || cliente.id || cliente.ID" style="margin-left: 10px;">
                  | ID: {{ cliente.cliente_id || cliente.id || cliente.ID }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          v-if="mostrarDropdown && clientesFiltrados.length === 0 && busquedaCliente.trim()"
          class="dropdown-empty">
          <div style="color: #666; text-align: center;">No se encontraron clientes</div>
        </div>
      </div>
    </div>

    <!-- Cliente seleccionado -->
    <div v-if="clienteSeleccionado" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px; border: 1px solid #4caf50;">
      <strong>✅ Cliente Seleccionado:</strong>
      <div style="margin-top: 5px;">
        <strong>{{ clienteSeleccionado.razonSocial || clienteSeleccionado.nombre || 'Sin nombre' }}</strong>
        <div style="font-size: 12px; color: #666; margin-top: 3px;">
          CUIT: {{ formatearCUIT(clienteSeleccionado.cuit || clienteSeleccionado.identificacionTributaria?.numero || '') || 'N/A' }}
          <span v-if="clienteSeleccionado.cliente_id || clienteSeleccionado.id || clienteSeleccionado.ID" style="margin-left: 10px;">
            | ID: {{ clienteSeleccionado.cliente_id || clienteSeleccionado.id || clienteSeleccionado.ID }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatearCUIT } from '../utils/formatters.js';

export default {
  name: 'ClienteSelector',
  props: {
    clientes: {
      type: Array,
      default: () => []
    },
    clienteSeleccionado: {
      type: Object,
      default: null
    }
  },
  emits: ['select-cliente'],
  data() {
    return {
      busquedaCliente: '',
      mostrarDropdown: false
    };
  },
  computed: {
    clientesFiltrados() {
      if (!this.busquedaCliente.trim()) {
        return this.clientes;
      }
      
      const busqueda = this.busquedaCliente.toLowerCase().replace(/[-\s]/g, '');
      return this.clientes.filter(c => {
        const razonSocial = (c.razonSocial || '').toLowerCase();
        const nombre = (c.nombre || '').toLowerCase();
        const cuit = formatearCUIT(c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
        const cuitSinFormato = (c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
        
        return razonSocial.includes(busqueda) || 
               nombre.includes(busqueda) || 
               cuit.includes(busqueda) ||
               cuitSinFormato.includes(busqueda);
      });
    }
  },
  methods: {
    formatearCUIT,
    seleccionarCliente(cliente) {
      this.$emit('select-cliente', cliente);
      this.busquedaCliente = '';
      this.mostrarDropdown = false;
    },
    ocultarDropdown() {
      setTimeout(() => {
        this.mostrarDropdown = false;
      }, 200);
    }
  }
};
</script>

<style scoped>
.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 2px;
}

.dropdown-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-empty {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  z-index: 1000;
  margin-top: 2px;
}
</style>

