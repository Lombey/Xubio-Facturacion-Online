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
/**
 * @typedef {import('../types/models').Cliente} Cliente
 * @typedef {import('../types/models').ClienteRaw} ClienteRaw
 */

import { formatearCUIT } from '../utils/formatters.js';
import { filtrarClientes } from '../utils/domain-filters.js';
import BaseSelector from './BaseSelector.vue';

/**
 * Obtiene el label de un cliente para mostrar
 * @param {Cliente | ClienteRaw} cliente - Cliente normalizado o crudo
 * @returns {string} Label del cliente
 */
function getClienteLabel(cliente) {
  return cliente.razonSocial || cliente.nombre || 'Sin nombre';
}

/**
 * Obtiene la clave única de un cliente
 * @param {Cliente | ClienteRaw} cliente - Cliente normalizado o crudo
 * @returns {number | undefined} ID del cliente
 */
function getClienteKey(cliente) {
  return cliente.cliente_id || cliente.id || cliente.ID;
}

export default {
  name: 'ClienteSelector',
  components: {
    BaseSelector
  },
  props: {
    /** @type {import('vue').PropType<(Cliente | ClienteRaw)[]>} */
    clientes: {
      type: Array,
      default: () => []
    },
    /** @type {import('vue').PropType<Cliente | ClienteRaw | null>} */
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
    /**
     * Maneja la selección de un cliente
     * @param {Cliente | ClienteRaw} cliente - Cliente seleccionado
     */
    seleccionarCliente(cliente) {
      this.$emit('select-cliente', cliente);
    }
  }
};
</script>
