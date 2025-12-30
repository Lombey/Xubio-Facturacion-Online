// Punto de entrada principal para Vite
// Este archivo se importa desde index.html y maneja el montaje de Vue

import app from './app.js';

// Función para montar la aplicación con manejo de errores
async function mountApp() {
  try {
    // Mostrar indicador de carga si el elemento existe
    const appElement = document.getElementById('app');
    if (appElement && appElement.hasAttribute('v-cloak')) {
      // El contenido ya está oculto por v-cloak, no necesitamos hacer nada más
    }
    
    // Montar la aplicación
    const mountedApp = app.mount('#app');
    
    // Remover v-cloak después de que Vue se monte completamente
    // Vue normalmente lo hace automáticamente, pero lo hacemos explícitamente por seguridad
    setTimeout(() => {
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    }, 100);
    
    return mountedApp;
  } catch (error) {
    console.error('🚨 Error al montar la aplicación:', error);
    
    // Mostrar mensaje de error visible
    const appElement = document.getElementById('app');
    if (appElement) {
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

