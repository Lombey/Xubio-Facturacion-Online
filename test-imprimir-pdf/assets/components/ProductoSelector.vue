<template>
  <div class="producto-selector">
    <div class="form-group">
      <label for="selectorProducto">➕ Agregar Producto:</label>
      <div style="position: relative;">
        <input 
          type="text" 
          id="selectorProducto" 
          v-model="busquedaProducto" 
          @input="mostrarDropdown = true"
          @focus="mostrarDropdown = true"
          @blur="ocultarDropdown"
          placeholder="Buscar producto por nombre, código o descripción..."
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        
        <!-- Dropdown de productos -->
        <div 
          v-if="mostrarDropdown && productosFiltrados.length > 0"
          class="dropdown-productos">
          <div 
            v-for="producto in productosFiltrados" 
            :key="producto.id || producto.ID"
            @click="seleccionarProducto(producto)"
            class="dropdown-item">
            <div>
              <strong>{{ producto.nombre || producto.codigo || 'Sin nombre' }}</strong>
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
          </div>
        </div>
        
        <div 
          v-if="mostrarDropdown && productosFiltrados.length === 0 && busquedaProducto.trim()"
          class="dropdown-empty">
          <div style="color: #666; text-align: center;">No se encontraron productos</div>
        </div>
      </div>
    </div>

    <!-- Lista de productos seleccionados -->
    <div v-if="productosSeleccionados.length > 0" class="productos-seleccionados">
      <h3>Productos Seleccionados:</h3>
      <table class="facturas-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in productosSeleccionados" :key="index">
            <td>{{ item.producto.nombre || item.producto.codigo || 'Sin nombre' }}</td>
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
    </div>
  </div>
</template>

<script>
import { formatearPrecio } from '../utils/formatters.js';

export default {
  name: 'ProductoSelector',
  props: {
    productos: {
      type: Array,
      default: () => []
    },
    productosSeleccionados: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-producto', 'remove-producto'],
  data() {
    return {
      busquedaProducto: '',
      mostrarDropdown: false
    };
  },
  computed: {
    productosFiltrados() {
      if (!this.busquedaProducto.trim()) {
        return this.productos;
      }
      
      const busqueda = this.busquedaProducto.toLowerCase();
      return this.productos.filter(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const codigo = (p.codigo || '').toLowerCase();
        const descripcion = (p.descripcion || '').toLowerCase();
        return nombre.includes(busqueda) || codigo.includes(busqueda) || descripcion.includes(busqueda);
      });
    }
  },
  methods: {
    formatearPrecio,
    seleccionarProducto(producto) {
      this.$emit('select-producto', producto);
      this.busquedaProducto = '';
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
.dropdown-productos {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

