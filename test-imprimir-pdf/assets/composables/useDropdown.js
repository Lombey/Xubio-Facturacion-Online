/**
 * Composable para manejar estado de dropdown
 * Separado de componentes para mejor testabilidad
 */

import { ref, onUnmounted, getCurrentInstance } from 'vue';

/**
 * @typedef {Object} DropdownOptions
 * @property {number} [blurDelay=200] - Delay en ms antes de cerrar el dropdown
 */

/**
 * @typedef {Object} DropdownReturn
 * @property {import('vue').Ref<boolean>} isOpen - Estado de apertura del dropdown
 * @property {() => void} open - Función para abrir el dropdown
 * @property {() => void} close - Función para cerrar el dropdown
 * @property {() => void} toggle - Función para alternar el estado del dropdown
 * @property {() => void} handleBlur - Función para manejar el evento blur
 * @property {() => void} handleFocus - Función para manejar el evento focus
 */

/**
 * Composable para manejar dropdown con blur/focus
 * @param {DropdownOptions} [options={}] - Opciones de configuración
 * @returns {DropdownReturn} Estado y métodos del dropdown
 */
export function useDropdown(options = {}) {
  const { blurDelay = 200 } = options;
  
  const isOpen = ref(false);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let blurTimeout = null;

  /**
   * Abre el dropdown
   */
  function open() {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    isOpen.value = true;
  }

  /**
   * Cierra el dropdown
   */
  function close() {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    isOpen.value = false;
  }

  /**
   * Maneja el evento blur con delay
   */
  function handleBlur() {
    blurTimeout = setTimeout(() => {
      close();
    }, blurDelay);
  }

  /**
   * Maneja el evento focus
   */
  function handleFocus() {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    open();
  }

  /**
   * Toggle del dropdown
   */
  function toggle() {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }

  // Cleanup al desmontar (solo si estamos en un contexto de componente Vue)
  const instance = getCurrentInstance();
  if (instance) {
    onUnmounted(() => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    });
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    handleBlur,
    handleFocus
  };
}
