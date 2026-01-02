<template>
  <BaseSelector
    :items="productos"
    :selectedItems="productosSeleccionados.map(item => item.producto)"
    label="➕ Agregar Producto:"
    placeholder="Buscar producto por nombre, código o descripción..."
    input-id="selectorProducto"
    :get-item-label="getProductoLabel"
    :get-item-key="getProductoKey"
    :filter-fn="filtrarProductos"
    @select-item="seleccionarProducto">
    
    <template #item="{ item: producto }">
      <div>
        <strong>{{ getProductoLabel(producto) }}</strong>
        <div style="font-size: 12px; color: #666;">
          Código: {{ producto.codigo || 'N/A' }}
        </div>
      </div>
      <div style="font-weight: bold; color: #2196F3;">
        <span v-if="producto.precioAGDP || producto.precio">
          ${{ formatearPrecio(producto.precioAGDP || producto.precio) }}
        </span>
        <span v-else style="color: #999; font-size: 11px;">
          Sin precio
        </span>
      </div>
    </template>

    <template #selected="{ selectedItems }">
      <div v-if="productosSeleccionados.length > 0" class="productos-seleccionados">
        <h3>Productos Seleccionados:</h3>
        <table class="facturas-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in productosSeleccionados" :key="index">
              <td>{{ getProductoLabel(item.producto) }}</td>
              <td>
                <input 
                  type="text" 
                  v-model="item.descripcionPersonalizada" 
                  :placeholder="item.producto.descripcion || item.producto.nombre || 'Descripción del ítem'"
                  style="width: 200px; padding: 4px; font-size: 12px;"
                  title="Descripción personalizada para este ítem en la factura">
              </td>
              <td>
                <input type="number" v-model.number="item.cantidad" min="0.01" step="0.01" style="width: 80px;">
              </td>
              <td>
                <input type="number" v-model.number="item.precio" min="0" step="0.01" style="width: 100px;">
              </td>
              <td>${{ (item.cantidad * item.precio).toFixed(2) }}</td>
              <td>
                <button class="test-btn" @click="$emit('remove-producto', index)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">
          📝 Puedes personalizar la descripción de cada ítem. Si lo dejas vacío, se usará la descripción original del producto.
        </div>
      </div>
    </template>
  </BaseSelector>
</template>

<script>
/**
 * @typedef {import('../types/models').Producto} Producto
 * @typedef {import('../types/models').ProductoRaw} ProductoRaw
 */

import { formatearPrecio } from '../utils/formatters.js';
import { filtrarProductos } from '../utils/domain-filters.js';
import BaseSelector from './BaseSelector.vue';

/**
 * Obtiene el label de un producto para mostrar
 * @param {Producto | ProductoRaw} producto - Producto normalizado o crudo
 * @returns {string} Label del producto
 */
function getProductoLabel(producto) {
  return producto.nombre || producto.codigo || 'Sin nombre';
}

/**
 * Obtiene la clave única de un producto
 * @param {Producto | ProductoRaw} producto - Producto normalizado o crudo
 * @returns {number | undefined} ID del producto
 */
function getProductoKey(producto) {
  return producto.id || producto.ID;
}

export default {
  name: 'ProductoSelector',
  components: {
    BaseSelector
  },
  props: {
    /** @type {import('vue').PropType<(Producto | ProductoRaw)[]>} */
    productos: {
      type: Array,
      default: () => []
    },
    /** @type {import('vue').PropType<Array<{producto: Producto | ProductoRaw, cantidad: number, descripcionPersonalizada?: string}>>} */
    productosSeleccionados: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-producto', 'remove-producto'],
  methods: {
    formatearPrecio,
    getProductoLabel,
    getProductoKey,
    filtrarProductos,
    /**
     * Maneja la selección de un producto
     * @param {Producto | ProductoRaw} producto - Producto seleccionado
     */
    seleccionarProducto(producto) {
      this.$emit('select-producto', producto);
    }
  }
};
</script>

<style scoped>
.productos-seleccionados {
  margin-top: 15px;
}

.facturas-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.facturas-table th,
.facturas-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.facturas-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style>
