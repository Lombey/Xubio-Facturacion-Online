// Punto de entrada principal para Vite
// Este archivo se importa desde index.html y maneja el montaje de Vue

// Solución preventiva para warnings de event listeners no-pasivos en touchstart
// Intercepta addEventListener para hacer pasivos los listeners de touch cuando sea apropiado
if (typeof EventTarget !== 'undefined' && typeof window !== 'undefined') {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Si es un evento touchstart/touchmove/touchend y no se especificó passive explícitamente
    if ((type === 'touchstart' || type === 'touchmove' || type === 'touchend') && 
        typeof options === 'object' && options !== null && !('passive' in options)) {
      // Solo hacer pasivo si no se necesita preventDefault
      // Para eventos de scroll, passive mejora el rendimiento
      options = { ...options, passive: true };
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Importar la función factory de la app
import appFactory from './app.js';

// Función para montar la aplicación con manejo de errores
async function mountApp() {
  try {
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('No se encontró el elemento #app');
    }
    
    // Verificar que el elemento #app tenga contenido
    if (!appElement.innerHTML || appElement.innerHTML.trim() === '') {
      throw new Error('El elemento #app está vacío. Verifica que el HTML se haya cargado correctamente.');
    }
    
    console.log('📋 Elemento #app encontrado, contenido presente');
    
    // Crear la app de Vue (sin pasar template - Vue usará el HTML del elemento)
    const app = appFactory('');
    
    if (!app || typeof app.mount !== 'function') {
      throw new Error('La función factory no retornó una instancia válida de Vue app');
    }
    
    // Montar la aplicación directamente en el elemento que ya tiene el HTML
    // Vue 3 usará el HTML existente como template
    const mountedApp = app.mount('#app');
    
    console.log('✅ Vue montado correctamente');
    console.log('📋 Instancia de Vue:', mountedApp);
    console.log('📋 Contenido del #app después del mount:', document.getElementById('app')?.innerHTML?.substring(0, 200));
    
    // Verificar que los métodos estén disponibles
    if (mountedApp && typeof mountedApp.handleTokenSubmit === 'function') {
      console.log('✅ Método handleTokenSubmit está disponible');
    } else {
      console.warn('⚠️ Método handleTokenSubmit NO está disponible');
      console.warn('⚠️ Tipo de mountedApp:', typeof mountedApp);
      console.warn('⚠️ Propiedades de mountedApp:', Object.keys(mountedApp || {}));
      
      // Intentar acceder a través de $options
      if (mountedApp && mountedApp.$options && mountedApp.$options.methods) {
        console.warn('⚠️ Métodos en $options.methods:', Object.keys(mountedApp.$options.methods));
      }
    }
    
    // Verificar que el botón tenga el evento binding
    setTimeout(() => {
      const button = document.querySelector('button[type="button"]');
      if (button) {
        console.log('🔘 Botón encontrado:', button);
        console.log('🔘 Atributos del botón:', Array.from(button.attributes).map(a => `${a.name}="${a.value}"`));
      } else {
        console.warn('⚠️ No se encontró el botón');
      }
    }, 1000);
    
    // Remover v-cloak después de montar
    requestAnimationFrame(() => {
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    });
    
    // Fallback: remover v-cloak después de 500ms
    setTimeout(() => {
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    }, 500);
    
    return mountedApp;
  } catch (error) {
    console.error('🚨 Error al montar la aplicación:', error);
    
    // Remover v-cloak incluso si hay error para mostrar el mensaje
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.removeAttribute('v-cloak');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : String(error);
      
      appElement.innerHTML = `
        <div style="max-width: 800px; margin: 50px auto; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h1 style="color: #f44336; margin-bottom: 20px;">❌ Error al cargar la aplicación</h1>
          <div style="background: #fff5f5; border-left: 4px solid #f44336; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #721c24; font-weight: 500;">${errorMessage || 'Error desconocido'}</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Posibles soluciones:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Recarga la página (F5)</li>
              <li>Revisa la consola del navegador (F12) para más detalles</li>
              <li>Verifica que el servidor esté funcionando correctamente</li>
            </ul>
          </div>
          <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
            🔄 Recargar página
          </button>
          <details style="margin-top: 20px;">
            <summary style="cursor: pointer; color: #666; font-size: 14px;">Ver detalles técnicos</summary>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; margin-top: 10px; font-size: 12px; color: #333;">${errorStack || String(error)}</pre>
          </details>
        </div>
      `;
    }
    
    throw error;
  }
}

// Montar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

