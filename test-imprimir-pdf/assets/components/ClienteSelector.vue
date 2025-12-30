<template>
  <BaseSelector
    :items="clientes"
    :selectedItems="clienteSeleccionado ? [clienteSeleccionado] : []"
    label="🔍 Buscar Cliente:"
    placeholder="Buscar por CUIT, razón social o nombre..."
    input-id="selectorCliente"
    :get-item-label="getClienteLabel"
    :get-item-key="getClienteKey"
    :filter-fn="filtrarClientes"
    @select-item="seleccionarCliente">
    
    <template #item="{ item: cliente }">
      <div>
        <strong>{{ getClienteLabel(cliente) }}</strong>
        <div style="font-size: 12px; color: #666;">
          CUIT: {{ formatearCUIT(cliente.cuit || cliente.identificacionTributaria?.numero || '') || 'N/A' }}
          <span v-if="getClienteKey(cliente)" style="margin-left: 10px;">
            | ID: {{ getClienteKey(cliente) }}
          </span>
        </div>
      </div>
    </template>

    <template #selected="{ selectedItems }">
      <div v-if="clienteSeleccionado" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px; border: 1px solid #4caf50;">
        <strong>✅ Cliente Seleccionado:</strong>
        <div style="margin-top: 5px;">
          <strong>{{ getClienteLabel(clienteSeleccionado) }}</strong>
          <div style="font-size: 12px; color: #666; margin-top: 3px;">
            CUIT: {{ formatearCUIT(clienteSeleccionado.cuit || clienteSeleccionado.identificacionTributaria?.numero || '') || 'N/A' }}
            <span v-if="getClienteKey(clienteSeleccionado)" style="margin-left: 10px;">
              | ID: {{ getClienteKey(clienteSeleccionado) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </BaseSelector>
</template>

<script>
import { formatearCUIT } from '../utils/formatters.js';
import { filtrarClientes } from '../utils/domain-filters.js';
import BaseSelector from './BaseSelector.vue';

function getClienteLabel(cliente) {
  return cliente.razonSocial || cliente.nombre || 'Sin nombre';
}

function getClienteKey(cliente) {
  return cliente.cliente_id || cliente.id || cliente.ID;
}

export default {
  name: 'ClienteSelector',
  components: {
    BaseSelector
  },
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
  methods: {
    formatearCUIT,
    getClienteLabel,
    getClienteKey,
    filtrarClientes,
    seleccionarCliente(cliente) {
      this.$emit('select-cliente', cliente);
    }
  }
};
</script>
