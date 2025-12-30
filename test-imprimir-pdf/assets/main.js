// Punto de entrada principal para Vite
// Este archivo se importa desde index.html y maneja el montaje de Vue

import app from './app.js';

// Función para montar la aplicación con manejo de errores
async function mountApp() {
  console.log('🚀 Iniciando montaje de la aplicación...');
  
  try {
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('No se encontró el elemento #app');
    }
    
    console.log('✅ Elemento #app encontrado');
    console.log('📦 Montando aplicación Vue...');
    
    // Montar la aplicación
    const mountedApp = app.mount('#app');
    
    console.log('✅ Vue montado correctamente');
    
    // Remover v-cloak inmediatamente después de montar
    // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
    requestAnimationFrame(() => {
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        console.log('🔓 Removiendo v-cloak...');
        appEl.removeAttribute('v-cloak');
        console.log('✅ v-cloak removido, contenido visible');
      } else {
        console.log('ℹ️ v-cloak ya fue removido o no estaba presente');
      }
    });
    
    // Fallback: remover v-cloak después de 500ms por si acaso
    setTimeout(() => {
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        console.warn('⚠️ v-cloak todavía presente después de 500ms, removiendo forzadamente...');
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

