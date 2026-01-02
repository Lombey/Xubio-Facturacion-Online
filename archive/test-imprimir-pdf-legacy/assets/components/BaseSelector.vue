<template>
  <div class="base-selector">
    <div class="form-group">
      <label :for="inputId">{{ label }}</label>
      <div style="position: relative;">
        <input 
          type="text" 
          :id="inputId"
          v-model="busquedaLocal" 
          @input="dropdown.open()"
          @focus="dropdown.handleFocus()"
          @blur="dropdown.handleBlur()"
          :placeholder="placeholder"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        
        <!-- Dropdown -->
        <div 
          v-if="dropdown.isOpen.value && itemsFiltrados.length > 0"
          class="dropdown-items">
          <div 
            v-for="(item, index) in itemsFiltrados" 
            :key="getItemKey(item, index)"
            @click="seleccionarItem(item)"
            class="dropdown-item">
            <slot name="item" :item="item">
              <div>
                <strong>{{ getItemLabel(item) }}</strong>
              </div>
            </slot>
          </div>
        </div>
        
        <div 
          v-if="dropdown.isOpen.value && itemsFiltrados.length === 0 && busquedaLocal.trim()"
          class="dropdown-empty">
          <div style="color: #666; text-align: center;">No se encontraron resultados</div>
        </div>
      </div>
    </div>

    <!-- Slot para contenido adicional después del selector -->
    <slot name="selected" :selectedItems="selectedItems"></slot>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { debounce } from '../utils/debounce.js';
import { useDropdown } from '../composables/useDropdown.js';

export default {
  name: 'BaseSelector',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    selectedItems: {
      type: Array,
      default: () => []
    },
    label: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: 'Buscar...'
    },
    inputId: {
      type: String,
      required: true
    },
    // Función para obtener la clave única del item
    getItemKey: {
      type: Function,
      default: (item, index) => item.id || item.ID || index
    },
    // Función para obtener el label del item
    getItemLabel: {
      type: Function,
      required: true
    },
    // Función para filtrar items
    filterFn: {
      type: Function,
      required: true
    },
    // Debounce delay en ms
    debounceDelay: {
      type: Number,
      default: 300
    }
  },
  emits: ['select-item', 'remove-item'],
  setup(props, { emit }) {
    const busquedaLocal = ref('');
    const busquedaDebounced = ref('');
    const dropdown = useDropdown({ blurDelay: 200 });

    // Debounce de búsqueda
    const debouncedBusqueda = debounce((value) => {
      busquedaDebounced.value = value;
    }, props.debounceDelay);

    watch(busquedaLocal, (newValue) => {
      debouncedBusqueda(newValue);
    });

    const itemsFiltrados = computed(() => {
      if (!busquedaDebounced.value.trim()) {
        return props.items;
      }
      return props.filterFn(props.items, busquedaDebounced.value);
    });

    function seleccionarItem(item) {
      emit('select-item', item);
      busquedaLocal.value = '';
      dropdown.close();
    }

    return {
      busquedaLocal,
      itemsFiltrados,
      dropdown,
      seleccionarItem,
      getItemKey: props.getItemKey,
      getItemLabel: props.getItemLabel
    };
  }
};
</script>

<style scoped>
.dropdown-items {
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
