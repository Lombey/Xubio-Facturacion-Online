<template>
  <BaseSelector
    :items="puntosDeVenta"
    :selectedItems="puntoVentaSeleccionado ? [puntoVentaSeleccionado] : []"
    label="🏪 Seleccionar Punto de Venta:"
    placeholder="Buscar por nombre, código, punto de venta o ID..."
    input-id="selectorPuntoVenta"
    :get-item-label="getPuntoVentaLabel"
    :get-item-key="getPuntoVentaKey"
    :filter-fn="filtrarPuntosDeVenta"
    @select-item="seleccionarPuntoVenta">
    
    <template #item="{ item: puntoVenta }">
      <div>
        <strong>{{ getPuntoVentaLabel(puntoVenta) }}</strong>
        <div style="font-size: 12px; color: #666;">
          <span v-if="puntoVenta.puntoVenta">Punto de Venta: {{ puntoVenta.puntoVenta }}</span>
          <span v-if="puntoVenta.codigo" :style="puntoVenta.puntoVenta ? 'margin-left: 10px;' : ''">
            Código: {{ puntoVenta.codigo }}
          </span>
          <span v-if="getPuntoVentaKey(puntoVenta)" style="margin-left: 10px;">
            | ID: {{ getPuntoVentaKey(puntoVenta) }}
          </span>
        </div>
        <div v-if="puntoVenta.editable && puntoVenta.sugerido" style="font-size: 11px; color: #4caf50; margin-top: 3px;">
          ✅ Editable-Sugerido ({{ puntoVenta.modoNumeracion || 'manual' }})
        </div>
        <div v-else style="font-size: 11px; color: #dc3545; margin-top: 3px;">
          ❌ No válido (Modo: {{ puntoVenta.modoNumeracion || 'N/A' }})
        </div>
      </div>
    </template>

    <template #selected="{ selectedItems }">
      <div v-if="puntoVentaSeleccionado" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px; border: 1px solid #4caf50;">
        <strong>✅ Punto de Venta Seleccionado:</strong>
        <div style="margin-top: 5px;">
          <strong>{{ getPuntoVentaLabel(puntoVentaSeleccionado) }}</strong>
          <div style="font-size: 12px; color: #666; margin-top: 3px;">
            <span v-if="puntoVentaSeleccionado.puntoVenta">Punto de Venta: {{ puntoVentaSeleccionado.puntoVenta }}</span>
            <span v-if="puntoVentaSeleccionado.codigo" :style="puntoVentaSeleccionado.puntoVenta ? 'margin-left: 10px;' : ''">
              Código: {{ puntoVentaSeleccionado.codigo }}
            </span>
            <span v-if="getPuntoVentaKey(puntoVentaSeleccionado)" style="margin-left: 10px;">
              | ID: {{ getPuntoVentaKey(puntoVentaSeleccionado) }}
            </span>
          </div>
          <div v-if="puntoVentaSeleccionado.editable && puntoVentaSeleccionado.sugerido" style="font-size: 11px; color: #4caf50; margin-top: 3px;">
            ✅ Editable: true | Sugerido: true
          </div>
          <div v-else style="font-size: 11px; color: #dc3545; margin-top: 3px;">
            ❌ Inválido: Editable={{ puntoVentaSeleccionado.editable }}, Sugerido={{ puntoVentaSeleccionado.sugerido }}
          </div>
        </div>
      </div>
      <div v-else style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107; color: #856404;">
        <strong>⚠️ No hay punto de venta seleccionado</strong>
        <div style="font-size: 12px; margin-top: 3px;">
          Selecciona un punto de venta editable-sugerido para crear facturas.
        </div>
      </div>
    </template>
  </BaseSelector>
</template>

<script>
/**
 * @typedef {import('../types/models').PuntoVenta} PuntoVenta
 * @typedef {import('../types/models').PuntoVentaRaw} PuntoVentaRaw
 */

import { filtrarPuntosDeVenta } from '../utils/domain-filters.js';
import BaseSelector from './BaseSelector.vue';

/**
 * Obtiene el label de un punto de venta para mostrar
 * @param {PuntoVenta | PuntoVentaRaw} puntoVenta - Punto de venta normalizado o crudo
 * @returns {string} Label del punto de venta
 */
function getPuntoVentaLabel(puntoVenta) {
  return puntoVenta.nombre || puntoVenta.puntoVenta || puntoVenta.codigo || 'Sin nombre';
}

/**
 * Obtiene la clave única de un punto de venta
 * @param {PuntoVenta | PuntoVentaRaw} puntoVenta - Punto de venta normalizado o crudo
 * @returns {number | undefined} ID del punto de venta
 */
function getPuntoVentaKey(puntoVenta) {
  return puntoVenta.puntoVentaId || puntoVenta.ID || puntoVenta.id || puntoVenta.puntoVenta_id;
}

export default {
  name: 'PuntoVentaSelector',
  components: {
    BaseSelector
  },
  props: {
    /** @type {import('vue').PropType<(PuntoVenta | PuntoVentaRaw)[]>} */
    puntosDeVenta: {
      type: Array,
      default: () => []
    },
    /** @type {import('vue').PropType<PuntoVenta | PuntoVentaRaw | null>} */
    puntoVentaSeleccionado: {
      type: Object,
      default: null
    }
  },
  emits: ['select-punto-venta'],
  methods: {
    getPuntoVentaLabel,
    getPuntoVentaKey,
    filtrarPuntosDeVenta,
    /**
     * Maneja la selección de un punto de venta
     * @param {PuntoVenta | PuntoVentaRaw} puntoVenta - Punto de venta seleccionado
     */
    seleccionarPuntoVenta(puntoVenta) {
      this.$emit('select-punto-venta', puntoVenta);
    }
  }
};
</script>
