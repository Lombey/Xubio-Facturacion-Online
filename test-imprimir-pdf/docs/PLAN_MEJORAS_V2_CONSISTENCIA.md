# Plan de Mejoras V2 - Consistencia y Reutilización de Código

**Fecha de creación:** 2024-12-XX  
**Basado en:** Diagnóstico de arquitectura y análisis de código  
**Objetivo:** Eliminar duplicación, mejorar consistencia y aumentar reutilización de componentes

---

## 📋 Resumen Ejecutivo

Este plan aborda los problemas de duplicación y falta de reutilización identificados en el diagnóstico arquitectónico, organizados por prioridad y divididos en **thin slices** (tareas pequeñas e incrementales) para facilitar la implementación segura.

### Problemas Principales Identificados

1. **🔴 CRÍTICO:** Lógica de filtrado duplicada entre `app.js` y componentes Vue
2. **🟡 MEDIO:** Componentes `ClienteSelector` y `ProductoSelector` con lógica muy similar
3. **🟡 MEDIO:** 5 métodos "obtenerPorDefecto" con estructura repetitiva
4. **🟢 BAJO:** Wrappers innecesarios de formatters en `app.js`
5. **🟢 BAJO:** Métodos `ocultarDropdown*` duplicados

---

## 🎯 Fase 1: Eliminación de Duplicación Crítica (Prioridad Alta)

**Objetivo:** Eliminar la lógica de filtrado duplicada entre `app.js` y los componentes Vue.

### 1.1. Eliminar `clientesFiltrados()` de app.js

**Problema:** El computed `clientesFiltrados()` en `app.js` (línea 2614) duplica la lógica que ya existe en `ClienteSelector.vue`.

**Archivos a modificar:**
- `test-imprimir-pdf/assets/app.js`

**Checklist Thin Slice:**

- [ ] **Paso 1.1.1:** Verificar que `ClienteSelector` se usa en el template
  - [ ] Buscar `<ClienteSelector` en `App.vue` o `index.html`
  - [ ] Confirmar que el componente recibe `clientes` como prop
  - [ ] Verificar que emite `select-cliente` correctamente

- [ ] **Paso 1.1.2:** Buscar referencias a `clientesFiltrados` en el código
  ```bash
  # Ejecutar en terminal:
  grep -r "clientesFiltrados" test-imprimir-pdf/assets/
  grep -r "clientesFiltrados" test-imprimir-pdf/index.html
  ```

- [ ] **Paso 1.1.3:** Eliminar el computed `clientesFiltrados()` de `app.js`
  - **Ubicación:** Línea ~2614-2631 en `app.js`
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR ESTE CÓDIGO:
  /**
   * Filtra clientes según búsqueda (por CUIT, razón social o nombre)
   */
  clientesFiltrados() {
    if (!this.busquedaCliente.trim()) {
      return this.clientesList;
    }
    
    const busqueda = this.busquedaCliente.toLowerCase().replace(/[-\s]/g, '');
    return this.clientesList.filter(c => {
      const razonSocial = (c.razonSocial || '').toLowerCase();
      const nombre = (c.nombre || '').toLowerCase();
      const cuit = this.formatearCUIT(c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      const cuitSinFormato = (c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      
      return razonSocial.includes(busqueda) || 
             nombre.includes(busqueda) || 
             cuit.includes(busqueda) ||
             cuitSinFormato.includes(busqueda);
    });
  },
  ```

- [ ] **Paso 1.1.4:** Verificar que no hay referencias en templates
  - [ ] Si hay `v-for="cliente in clientesFiltrados"` en templates, cambiarlo a `v-for="cliente in clientesList"`
  - [ ] O mejor: usar el componente `<ClienteSelector>` que ya maneja el filtrado

- [ ] **Paso 1.1.5:** Testing manual
  - [ ] Abrir la aplicación en el navegador
  - [ ] Ir a la sección de facturación
  - [ ] Verificar que el selector de cliente funciona correctamente
  - [ ] Probar búsqueda por CUIT, razón social y nombre
  - [ ] Verificar que el dropdown muestra resultados filtrados

**Criterios de Aceptación:**
- ✅ El selector de cliente funciona igual que antes
- ✅ No hay errores en consola
- ✅ La búsqueda filtra correctamente
- ✅ El código eliminado no se usa en ningún lugar

---

### 1.2. Eliminar `productosFiltrados()` de app.js

**Problema:** El computed `productosFiltrados()` en `app.js` (línea 2456) duplica la lógica que ya existe en `ProductoSelector.vue`.

**Archivos a modificar:**
- `test-imprimir-pdf/assets/app.js`

**Checklist Thin Slice:**

- [ ] **Paso 1.2.1:** Verificar que `ProductoSelector` se usa en el template
  - [ ] Buscar `<ProductoSelector` en `App.vue` o `index.html`
  - [ ] Confirmar que el componente recibe `productos` como prop
  - [ ] Verificar que emite `select-producto` correctamente

- [ ] **Paso 1.2.2:** Buscar referencias a `productosFiltrados` en el código
  ```bash
  grep -r "productosFiltrados" test-imprimir-pdf/assets/
  grep -r "productosFiltrados" test-imprimir-pdf/index.html
  ```

- [ ] **Paso 1.2.3:** Eliminar el computed `productosFiltrados()` de `app.js`
  - **Ubicación:** Línea ~2456-2468 en `app.js`
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR ESTE CÓDIGO:
  /**
   * Filtra productos según búsqueda
   */
  productosFiltrados() {
    if (!this.busquedaProducto.trim()) {
      return this.productosList;
    }
    
    const busqueda = this.busquedaProducto.toLowerCase();
    return this.productosList.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const codigo = (p.codigo || '').toLowerCase();
      const descripcion = (p.descripcion || '').toLowerCase();
      return nombre.includes(busqueda) || codigo.includes(busqueda) || descripcion.includes(busqueda);
    });
  },
  ```

- [ ] **Paso 1.2.4:** Verificar que no hay referencias en templates
  - [ ] Si hay `v-for="producto in productosFiltrados"` en templates, cambiarlo a usar `<ProductoSelector>`

- [ ] **Paso 1.2.5:** Testing manual
  - [ ] Abrir la aplicación en el navegador
  - [ ] Ir a la sección de facturación
  - [ ] Verificar que el selector de producto funciona correctamente
  - [ ] Probar búsqueda por nombre, código y descripción
  - [ ] Verificar que el dropdown muestra resultados filtrados

**Criterios de Aceptación:**
- ✅ El selector de producto funciona igual que antes
- ✅ No hay errores en consola
- ✅ La búsqueda filtra correctamente
- ✅ El código eliminado no se usa en ningún lugar

---

### 1.3. Eliminar métodos `ocultarDropdown*` de app.js

**Problema:** Los métodos `ocultarDropdownProductos()` y `ocultarDropdownClientes()` en `app.js` duplican la lógica que ya existe en los componentes.

**Archivos a modificar:**
- `test-imprimir-pdf/assets/app.js`

**Checklist Thin Slice:**

- [ ] **Paso 1.3.1:** Verificar que los componentes ya tienen esta lógica
  - [ ] Confirmar que `ClienteSelector.vue` tiene método `ocultarDropdown()` (línea 123-127)
  - [ ] Confirmar que `ProductoSelector.vue` tiene método `ocultarDropdown()` (línea 152-156)

- [ ] **Paso 1.3.2:** Buscar referencias a `ocultarDropdownProductos` y `ocultarDropdownClientes`
  ```bash
  grep -r "ocultarDropdownProductos" test-imprimir-pdf/
  grep -r "ocultarDropdownClientes" test-imprimir-pdf/
  ```

- [ ] **Paso 1.3.3:** Eliminar métodos de `app.js`
  - **Ubicación:** Líneas ~2674-2682 y ~2687-2695 en `app.js`
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR ESTE CÓDIGO:
  /**
   * Oculta el dropdown de productos con un pequeño delay para permitir clicks
   */
  ocultarDropdownProductos() {
    if (typeof window !== 'undefined' && window.setTimeout) {
      window.setTimeout(() => {
        this.mostrarDropdownProductos = false;
      }, 200);
    } else {
      this.mostrarDropdownProductos = false;
    }
  },

  /**
   * Oculta el dropdown de clientes con un pequeño delay para permitir clicks
   */
  ocultarDropdownClientes() {
    if (typeof window !== 'undefined' && window.setTimeout) {
      window.setTimeout(() => {
        this.mostrarDropdownClientes = false;
      }, 200);
    } else {
      this.mostrarDropdownClientes = false;
    }
  },
  ```

- [ ] **Paso 1.3.4:** Verificar que no se usan en templates
  - [ ] Si hay `@blur="ocultarDropdownProductos"` o `@blur="ocultarDropdownClientes"` en templates, eliminarlos (los componentes ya lo manejan)

- [ ] **Paso 1.3.5:** Testing manual
  - [ ] Verificar que los dropdowns se ocultan correctamente al hacer blur
  - [ ] Verificar que los clicks funcionan antes de que se oculte el dropdown

**Criterios de Aceptación:**
- ✅ Los dropdowns funcionan igual que antes
- ✅ No hay errores en consola
- ✅ El código eliminado no se usa en ningún lugar

---

## 🎯 Fase 2: Refactorización de Componentes (Prioridad Media)

**Objetivo:** Crear un componente base reutilizable para eliminar duplicación entre `ClienteSelector` y `ProductoSelector`.

### 2.1. Crear componente base `BaseSelector.vue`

**Problema:** `ClienteSelector.vue` y `ProductoSelector.vue` comparten ~80% de su código (dropdown, búsqueda, debounce, estilos).

**Archivos a crear:**
- `test-imprimir-pdf/assets/components/BaseSelector.vue`

**Checklist Thin Slice:**

- [ ] **Paso 2.1.1:** Crear estructura base del componente
  - **Archivo:** `test-imprimir-pdf/assets/components/BaseSelector.vue`
  - **Código inicial:**
  ```vue
  <template>
    <div class="base-selector">
      <div class="form-group">
        <label :for="inputId">{{ label }}</label>
        <div style="position: relative;">
          <input 
            type="text" 
            :id="inputId"
            v-model="busquedaLocal" 
            @input="mostrarDropdown = true"
            @focus="mostrarDropdown = true"
            @blur="ocultarDropdown"
            :placeholder="placeholder"
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          
          <!-- Dropdown -->
          <div 
            v-if="mostrarDropdown && itemsFiltrados.length > 0"
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
            v-if="mostrarDropdown && itemsFiltrados.length === 0 && busquedaLocal.trim()"
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
  import { debounce } from '../utils/debounce.js';

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
    data() {
      return {
        busquedaLocal: '',
        busquedaDebounced: '',
        mostrarDropdown: false
      };
    },
    created() {
      this.debouncedBusqueda = debounce((value) => {
        this.busquedaDebounced = value;
      }, this.debounceDelay);
    },
    watch: {
      busquedaLocal(newValue) {
        this.debouncedBusqueda(newValue);
      }
    },
    computed: {
      itemsFiltrados() {
        if (!this.busquedaDebounced.trim()) {
          return this.items;
        }
        return this.filterFn(this.items, this.busquedaDebounced);
      }
    },
    methods: {
      seleccionarItem(item) {
        this.$emit('select-item', item);
        this.busquedaLocal = '';
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
  ```

- [ ] **Paso 2.1.2:** Testing del componente base
  - [ ] Verificar que compila sin errores
  - [ ] Probar con datos de ejemplo
  - [ ] Verificar que el filtrado funciona
  - [ ] Verificar que el debounce funciona

**Criterios de Aceptación:**
- ✅ El componente compila sin errores
- ✅ El filtrado funciona correctamente
- ✅ El debounce funciona
- ✅ Los eventos se emiten correctamente

---

### 2.2. Refactorizar `ClienteSelector.vue` para usar `BaseSelector`

**Archivos a modificar:**
- `test-imprimir-pdf/assets/components/ClienteSelector.vue`

**Checklist Thin Slice:**

- [ ] **Paso 2.2.1:** Crear función de filtrado para clientes
  - **Código a agregar en `ClienteSelector.vue`:**
  ```javascript
  import { formatearCUIT } from '../utils/formatters.js';
  import BaseSelector from './BaseSelector.vue';

  function filtrarClientes(clientes, busqueda) {
    const busquedaLower = busqueda.toLowerCase().replace(/[-\s]/g, '');
    return clientes.filter(c => {
      const razonSocial = (c.razonSocial || '').toLowerCase();
      const nombre = (c.nombre || '').toLowerCase();
      const cuit = formatearCUIT(c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      const cuitSinFormato = (c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      
      return razonSocial.includes(busquedaLower) || 
             nombre.includes(busquedaLower) || 
             cuit.includes(busquedaLower) ||
             cuitSinFormato.includes(busquedaLower);
    });
  }

  function getClienteLabel(cliente) {
    return cliente.razonSocial || cliente.nombre || 'Sin nombre';
  }

  function getClienteKey(cliente) {
    return cliente.cliente_id || cliente.id || cliente.ID;
  }
  ```

- [ ] **Paso 2.2.2:** Refactorizar template para usar `BaseSelector`
  - **Código nuevo:**
  ```vue
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
  ```

- [ ] **Paso 2.2.3:** Simplificar script
  - **Código nuevo:**
  ```javascript
  <script>
  import { formatearCUIT } from '../utils/formatters.js';
  import BaseSelector from './BaseSelector.vue';

  function filtrarClientes(clientes, busqueda) {
    const busquedaLower = busqueda.toLowerCase().replace(/[-\s]/g, '');
    return clientes.filter(c => {
      const razonSocial = (c.razonSocial || '').toLowerCase();
      const nombre = (c.nombre || '').toLowerCase();
      const cuit = formatearCUIT(c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      const cuitSinFormato = (c.cuit || c.identificacionTributaria?.numero || '').replace(/[-\s]/g, '').toLowerCase();
      
      return razonSocial.includes(busquedaLower) || 
             nombre.includes(busquedaLower) || 
             cuit.includes(busquedaLower) ||
             cuitSinFormato.includes(busquedaLower);
    });
  }

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
      seleccionarCliente(cliente) {
        this.$emit('select-cliente', cliente);
      }
    }
  };
  </script>
  ```

- [ ] **Paso 2.2.4:** Eliminar estilos duplicados (ya están en BaseSelector)
  - **Eliminar:** Todo el bloque `<style scoped>` (ya no es necesario)

- [ ] **Paso 2.2.5:** Testing manual
  - [ ] Verificar que el selector funciona igual que antes
  - [ ] Probar búsqueda por CUIT, razón social y nombre
  - [ ] Verificar que el cliente seleccionado se muestra correctamente
  - [ ] Verificar que el evento `select-cliente` se emite correctamente

**Criterios de Aceptación:**
- ✅ El componente funciona igual que antes
- ✅ El código es más simple y mantenible
- ✅ No hay errores en consola
- ✅ La funcionalidad es idéntica

---

### 2.3. Refactorizar `ProductoSelector.vue` para usar `BaseSelector`

**Archivos a modificar:**
- `test-imprimir-pdf/assets/components/ProductoSelector.vue`

**Checklist Thin Slice:**

- [ ] **Paso 2.3.1:** Crear función de filtrado para productos
  - **Código a agregar:**
  ```javascript
  function filtrarProductos(productos, busqueda) {
    const busquedaLower = busqueda.toLowerCase();
    return productos.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const codigo = (p.codigo || '').toLowerCase();
      const descripcion = (p.descripcion || '').toLowerCase();
      return nombre.includes(busquedaLower) || codigo.includes(busquedaLower) || descripcion.includes(busquedaLower);
    });
  }

  function getProductoLabel(producto) {
    return producto.nombre || producto.codigo || 'Sin nombre';
  }

  function getProductoKey(producto) {
    return producto.id || producto.ID;
  }
  ```

- [ ] **Paso 2.3.2:** Refactorizar template para usar `BaseSelector`
  - **Código nuevo:**
  ```vue
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
  ```

- [ ] **Paso 2.3.3:** Simplificar script
  - **Código nuevo:**
  ```javascript
  <script>
  import { formatearPrecio } from '../utils/formatters.js';
  import BaseSelector from './BaseSelector.vue';

  function filtrarProductos(productos, busqueda) {
    const busquedaLower = busqueda.toLowerCase();
    return productos.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const codigo = (p.codigo || '').toLowerCase();
      const descripcion = (p.descripcion || '').toLowerCase();
      return nombre.includes(busquedaLower) || codigo.includes(busquedaLower) || descripcion.includes(busquedaLower);
    });
  }

  function getProductoLabel(producto) {
    return producto.nombre || producto.codigo || 'Sin nombre';
  }

  function getProductoKey(producto) {
    return producto.id || producto.ID;
  }

  export default {
    name: 'ProductoSelector',
    components: {
      BaseSelector
    },
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
    methods: {
      formatearPrecio,
      getProductoLabel,
      getProductoKey,
      seleccionarProducto(producto) {
        this.$emit('select-producto', producto);
      }
    }
  };
  </script>
  ```

- [ ] **Paso 2.3.4:** Mantener estilos específicos (si los hay)
  - **Mantener solo estilos específicos de la tabla de productos seleccionados:**
  ```vue
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
  ```

- [ ] **Paso 2.3.5:** Testing manual
  - [ ] Verificar que el selector funciona igual que antes
  - [ ] Probar búsqueda por nombre, código y descripción
  - [ ] Verificar que los productos seleccionados se muestran en la tabla
  - [ ] Verificar que se pueden editar cantidad, precio y descripción
  - [ ] Verificar que el evento `select-producto` se emite correctamente

**Criterios de Aceptación:**
- ✅ El componente funciona igual que antes
- ✅ El código es más simple y mantenible
- ✅ No hay errores en consola
- ✅ La funcionalidad es idéntica
- ✅ La tabla de productos seleccionados funciona correctamente

---

## 🎯 Fase 3: Consolidación de Métodos Repetitivos (Prioridad Media)

**Objetivo:** Consolidar los 5 métodos "obtenerPorDefecto" en un método genérico reutilizable.

### 3.1. Crear método genérico `obtenerPorDefecto()`

**Problema:** 5 métodos con estructura casi idéntica:
- `obtenerCentroDeCostoPorDefecto()` (línea 2106)
- `obtenerDepositoPorDefecto()` (línea 2123)
- `obtenerCircuitoContablePorDefecto()` (línea 2139)
- `obtenerPuntoVentaPorDefecto()` (línea 2156)
- `obtenerVendedorPorDefecto()` (línea 2203)

**Archivos a modificar:**
- `test-imprimir-pdf/assets/app.js`

**Checklist Thin Slice:**

- [ ] **Paso 3.1.1:** Crear método genérico
  - **Ubicación:** Después de línea ~2203 en `app.js`
  - **Código a agregar:**
  ```javascript
  /**
   * Obtiene el primer item de una lista o un valor por defecto
   * @param {Array} lista - Lista de items
   * @param {string} idField - Nombre del campo ID (default: 'ID')
   * @param {number} fallbackId - ID por defecto si la lista está vacía (default: 1)
   * @returns {Object} Objeto con ID, id, nombre y codigo
   */
  obtenerPorDefecto(lista, idField = 'ID', fallbackId = 1) {
    if (lista && lista.length > 0) {
      const item = lista[0];
      const itemId = item[idField] || item.id || item[`${idField.toLowerCase()}_id`] || fallbackId;
      return {
        [idField]: itemId,
        id: item.id || item[idField] || itemId,
        nombre: item.nombre || '',
        codigo: item.codigo || ''
      };
    }
    // Fallback si no hay items
    return { 
      [idField]: fallbackId, 
      id: fallbackId,
      nombre: '',
      codigo: ''
    };
  },
  ```

- [ ] **Paso 3.1.2:** Reemplazar `obtenerCentroDeCostoPorDefecto()`
  - **Código anterior (ELIMINAR):**
  ```javascript
  obtenerCentroDeCostoPorDefecto() {
    if (this.centrosDeCosto && this.centrosDeCosto.length > 0) {
      const centro = this.centrosDeCosto[0];
      return {
        ID: centro.ID || centro.id || centro.centroDeCosto_id || 1,
        id: centro.id || centro.ID || centro.centroDeCosto_id || 1,
        nombre: centro.nombre || '',
        codigo: centro.codigo || ''
      };
    }
    return { ID: 1, id: 1 };
  },
  ```
  - **Código nuevo:**
  ```javascript
  obtenerCentroDeCostoPorDefecto() {
    return this.obtenerPorDefecto(this.centrosDeCosto, 'ID', 1);
  },
  ```

- [ ] **Paso 3.1.3:** Reemplazar `obtenerDepositoPorDefecto()`
  - **Código anterior (ELIMINAR):**
  ```javascript
  obtenerDepositoPorDefecto() {
    if (this.depositos && this.depositos.length > 0) {
      const deposito = this.depositos[0];
      return {
        ID: deposito.ID || deposito.id || deposito.deposito_id || 1,
        id: deposito.id || deposito.ID || deposito.deposito_id || 1,
        nombre: deposito.nombre || '',
        codigo: deposito.codigo || ''
      };
    }
    return { ID: 1, id: 1 };
  },
  ```
  - **Código nuevo:**
  ```javascript
  obtenerDepositoPorDefecto() {
    return this.obtenerPorDefecto(this.depositos, 'ID', 1);
  },
  ```

- [ ] **Paso 3.1.4:** Reemplazar `obtenerCircuitoContablePorDefecto()`
  - **Código anterior (ELIMINAR):**
  ```javascript
  obtenerCircuitoContablePorDefecto() {
    if (this.circuitosContables && this.circuitosContables.length > 0) {
      const circuito = this.circuitosContables[0];
      return {
        ID: circuito.ID || circuito.id || circuito.circuitoContable_id || 1,
        id: circuito.id || circuito.ID || circuito.circuitoContable_id || 1,
        nombre: circuito.nombre || '',
        codigo: circuito.codigo || ''
      };
    }
    return { ID: 1, id: 1 };
  },
  ```
  - **Código nuevo:**
  ```javascript
  obtenerCircuitoContablePorDefecto() {
    return this.obtenerPorDefecto(this.circuitosContables, 'ID', 1);
  },
  ```

- [ ] **Paso 3.1.5:** Reemplazar `obtenerPuntoVentaPorDefecto()`
  - **Código anterior (ELIMINAR):** Similar a los anteriores
  - **Código nuevo:**
  ```javascript
  obtenerPuntoVentaPorDefecto() {
    return this.obtenerPorDefecto(this.puntosDeVenta, 'ID', 1);
  },
  ```

- [ ] **Paso 3.1.6:** Reemplazar `obtenerVendedorPorDefecto()`
  - **Código anterior (ELIMINAR):** Similar a los anteriores
  - **Código nuevo:**
  ```javascript
  obtenerVendedorPorDefecto() {
    return this.obtenerPorDefecto(this.vendedores, 'ID', 1);
  },
  ```

- [ ] **Paso 3.1.7:** Testing manual
  - [ ] Verificar que los valores por defecto se obtienen correctamente
  - [ ] Probar crear una factura y verificar que usa los valores correctos
  - [ ] Verificar que los computed properties (`centroDeCostoSeleccionado`, etc.) funcionan
  - [ ] Probar con listas vacías y verificar el fallback

**Criterios de Aceptación:**
- ✅ Todos los métodos "obtenerPorDefecto" funcionan igual que antes
- ✅ El código es más simple y mantenible
- ✅ No hay errores en consola
- ✅ Los valores por defecto se asignan correctamente en las facturas

---

## 🎯 Fase 4: Limpieza de Wrappers Innecesarios (Prioridad Baja)

**Objetivo:** Eliminar wrappers innecesarios de formatters en `app.js`.

### 4.1. Eliminar wrappers de formatters

**Problema:** Métodos en `app.js` que solo llaman a utilidades sin agregar lógica adicional.

**Archivos a modificar:**
- `test-imprimir-pdf/assets/app.js`
- `test-imprimir-pdf/index.html` o `App.vue` (si se usan en templates)

**Checklist Thin Slice:**

- [ ] **Paso 4.1.1:** Buscar usos de `this.formatearPrecio()` en templates
  ```bash
  grep -r "formatearPrecio" test-imprimir-pdf/index.html
  grep -r "formatearPrecio" test-imprimir-pdf/assets/App.vue
  ```

- [ ] **Paso 4.1.2:** Buscar usos de `this.formatearCUIT()` en templates
  ```bash
  grep -r "formatearCUIT" test-imprimir-pdf/index.html
  grep -r "formatearCUIT" test-imprimir-pdf/assets/App.vue
  ```

- [ ] **Paso 4.1.3:** Buscar usos de `this.formatoMensaje()` en código
  ```bash
  grep -r "formatoMensaje" test-imprimir-pdf/assets/app.js
  ```

- [ ] **Paso 4.1.4:** Reemplazar usos en templates (si los hay)
  - Si hay `{{ this.formatearPrecio(precio) }}` en templates, cambiarlo a usar la utilidad directamente
  - **Opción 1:** Importar en el componente y usar método local
  - **Opción 2:** Crear computed property que use la utilidad
  - **Opción 3:** Usar la utilidad directamente si es posible

- [ ] **Paso 4.1.5:** Eliminar método `formatearPrecio()` de `app.js`
  - **Ubicación:** Línea ~2380-2382
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR:
  formatearPrecio(precio) {
    return formatearPrecioUtil(precio);
  },
  ```
  - **Reemplazar usos en código JavaScript:**
  ```javascript
  // ❌ ANTES:
  this.formatearPrecio(precio)
  
  // ✅ DESPUÉS:
  formatearPrecioUtil(precio)
  // O importar directamente:
  import { formatearPrecio } from './utils/formatters.js';
  formatearPrecio(precio)
  ```

- [ ] **Paso 4.1.6:** Eliminar método `formatearCUIT()` de `app.js`
  - **Ubicación:** Línea ~2667-2669
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR:
  formatearCUIT(cuit) {
    return formatearCUITUtil(cuit);
  },
  ```
  - **Reemplazar usos:**
  ```javascript
  // ❌ ANTES:
  this.formatearCUIT(cuit)
  
  // ✅ DESPUÉS:
  formatearCUITUtil(cuit)
  // O importar directamente:
  import { formatearCUIT } from './utils/formatters.js';
  formatearCUIT(cuit)
  ```

- [ ] **Paso 4.1.7:** Eliminar método `formatoMensaje()` de `app.js`
  - **Ubicación:** Línea ~450-452
  - **Código a eliminar:**
  ```javascript
  // ❌ ELIMINAR:
  formatoMensaje(mensaje) {
    return formatoMensajeUtil(mensaje);
  },
  ```
  - **Reemplazar usos:**
  ```javascript
  // ❌ ANTES:
  this.formatoMensaje(mensaje)
  
  // ✅ DESPUÉS:
  formatoMensajeUtil(mensaje)
  // O importar directamente:
  import { formatoMensaje } from './utils/formatters.js';
  formatoMensaje(mensaje)
  ```

- [ ] **Paso 4.1.8:** Actualizar imports en `app.js`
  - **Verificar que los imports están correctos:**
  ```javascript
  // Ya debería estar al inicio del archivo:
  import { formatoMensaje as formatoMensajeUtil, formatearPrecio as formatearPrecioUtil, formatearCUIT as formatearCUITUtil } from './utils/formatters.js';
  ```

- [ ] **Paso 4.1.9:** Testing manual
  - [ ] Verificar que los precios se formatean correctamente
  - [ ] Verificar que los CUITs se formatean correctamente
  - [ ] Verificar que los mensajes se formatean correctamente
  - [ ] Probar crear una factura y verificar que todo funciona

**Criterios de Aceptación:**
- ✅ Los formatters funcionan igual que antes
- ✅ No hay errores en consola
- ✅ El código es más directo (sin wrappers innecesarios)
- ✅ Los imports están correctos

---

## 📊 Resumen de Tareas

### Fase 1: Eliminación de Duplicación Crítica
- [ ] 1.1. Eliminar `clientesFiltrados()` de app.js
- [ ] 1.2. Eliminar `productosFiltrados()` de app.js
- [ ] 1.3. Eliminar métodos `ocultarDropdown*` de app.js

### Fase 2: Refactorización de Componentes
- [ ] 2.1. Crear componente base `BaseSelector.vue`
- [ ] 2.2. Refactorizar `ClienteSelector.vue` para usar `BaseSelector`
- [ ] 2.3. Refactorizar `ProductoSelector.vue` para usar `BaseSelector`

### Fase 3: Consolidación de Métodos Repetitivos
- [ ] 3.1. Crear método genérico `obtenerPorDefecto()` y reemplazar los 5 métodos

### Fase 4: Limpieza de Wrappers Innecesarios
- [ ] 4.1. Eliminar wrappers de formatters

---

## 🚀 Orden de Ejecución Recomendado

1. **Fase 1** (Crítica) - Eliminar duplicación primero
2. **Fase 4** (Baja) - Limpieza rápida de wrappers
3. **Fase 3** (Media) - Consolidar métodos repetitivos
4. **Fase 2** (Media) - Refactorización de componentes (más compleja)

**Razón:** Fase 1 y 4 son más simples y eliminan código. Fase 3 y 2 requieren más cuidado y testing.

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Romper funcionalidad existente
**Mitigación:** 
- Hacer cambios incrementales (thin slices)
- Testing manual después de cada cambio
- Mantener backups del código antes de cambios grandes

### Riesgo 2: Componentes BaseSelector muy complejos
**Mitigación:**
- Empezar simple y agregar funcionalidad gradualmente
- Usar slots de Vue para flexibilidad
- Mantener compatibilidad con componentes existentes

### Riesgo 3: Cambios en templates que usan métodos eliminados
**Mitigación:**
- Buscar todas las referencias antes de eliminar
- Actualizar templates junto con la eliminación del método

---

## ✅ Checklist Final de Verificación

Antes de considerar el plan completo, verificar:

- [ ] No hay código duplicado entre `app.js` y componentes
- [ ] Los componentes Vue son reutilizables y mantenibles
- [ ] Los métodos repetitivos están consolidados
- [ ] No hay wrappers innecesarios
- [ ] Todos los tests manuales pasan
- [ ] No hay errores en consola
- [ ] La funcionalidad es idéntica a la anterior
- [ ] El código es más simple y mantenible

---

## 📝 Notas Adicionales

- **Testing:** Después de cada thin slice, hacer testing manual completo
- **Commits:** Hacer commits pequeños después de cada thin slice completado
- **Reversión:** Si algo falla, revertir el último thin slice y revisar
- **Documentación:** Actualizar comentarios si cambia la lógica significativamente

---

**Última actualización:** 2024-12-XX  
**Estado:** Pendiente de implementación

