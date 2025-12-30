// Punto de entrada principal para Vite
// Este archivo se importa desde index.html y maneja el montaje de Vue

// IMPORTANTE: Capturar el template del DOM ANTES de importar la app
// porque Vue necesita el template al crear la aplicación
let templateHTML = '';
if (typeof document !== 'undefined') {
  const appElement = document.getElementById('app');
  if (appElement) {
    templateHTML = appElement.innerHTML;
    console.log('📋 Template capturado del DOM:', templateHTML.substring(0, 100) + '...');
  }
}

// Importar la función factory de la app
import appFactory from './app.js';

// Función para montar la aplicación con manejo de errores
async function mountApp() {
  console.log('🚀 Iniciando montaje de la aplicación...');
  
  try {
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('No se encontró el elemento #app');
    }
    
    console.log('✅ Elemento #app encontrado');
    
    // Capturar el template del DOM (por si no se capturó antes)
    const templateToUse = templateHTML || appElement.innerHTML;
    console.log('📦 Template capturado del DOM:');
    console.log('- Longitud:', templateToUse.length);
    console.log('- Primeros 300 caracteres:', templateToUse.substring(0, 300));
    console.log('- ¿Está vacío?', templateToUse.trim() === '');
    
    // Crear la app de Vue con el template
    console.log('📦 Creando aplicación Vue con template...');
    const app = appFactory(templateToUse);
    
    if (!app || typeof app.mount !== 'function') {
      throw new Error('La función factory no retornó una instancia válida de Vue app');
    }
    
    console.log('✅ Aplicación Vue creada correctamente');
    console.log('📦 Montando aplicación Vue...');
    console.log('📦 HTML antes de mount:', appElement.innerHTML.substring(0, 200) + '...');
    console.log('💡 Vue debería usar el HTML existente como template automáticamente');
    
    // IMPORTANTE: En Vue 3, cuando montas sin template, Vue reemplaza el contenido del elemento
    // La solución es usar el contenido HTML existente como template mediante una función render
    // Pero como el compilador de templates no está disponible en runtime, usamos otra estrategia:
    // 1. Guardar el HTML
    // 2. Montar Vue (que reemplazará el contenido)
    // 3. Inmediatamente restaurar el HTML
    // 4. Vue ya está montado y debería funcionar con el HTML restaurado
    
    const htmlBeforeMount = appElement.innerHTML;
    console.log('💾 HTML guardado antes de mount (length:', htmlBeforeMount.length + ')');
    
    // Montar la aplicación
    // Vue reemplazará el contenido, pero lo restauraremos inmediatamente
    const mountedApp = app.mount('#app');
    
    // Restaurar el HTML INMEDIATAMENTE después del mount
    // Vue ya está montado y debería poder trabajar con el HTML restaurado
    const appEl = document.getElementById('app');
    if (appEl) {
      console.log('🔄 Restaurando HTML después de mount...');
      appEl.innerHTML = htmlBeforeMount;
      console.log('✅ HTML restaurado. Vue debería funcionar ahora.');
      console.log('📦 HTML restaurado (primeros 200 chars):', appEl.innerHTML.substring(0, 200) + '...');
    }
    
    console.log('📦 HTML después de mount:', appElement.innerHTML.substring(0, 200) + '...');
    
    // Verificar si el contenido desapareció y restaurarlo si es necesario
    // (Esto no debería pasar ahora que tenemos el template definido, pero lo dejamos como fallback)
    setTimeout(() => {
      const appEl = document.getElementById('app');
      if (appEl && (appEl.innerHTML.trim() === '' || appEl.innerHTML.trim() === '<!---->')) {
        console.warn('⚠️ El contenido HTML desapareció después de montar Vue');
        console.warn('💡 Esto no debería pasar con el template definido. Revisa la configuración.');
      }
    }, 100);
    
    console.log('✅ Vue montado correctamente');
    console.log('📦 Contenido HTML después de montar:', appElement.innerHTML.substring(0, 200) + '...');
    
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
      
      // Diagnóstico: verificar el estado del contenido
      console.log('🔍 Diagnóstico del contenido:');
      console.log('- Elemento #app existe:', !!appEl);
      console.log('- Contenido HTML length:', appEl?.innerHTML?.length || 0);
      console.log('- Estilos computed:', appEl ? window.getComputedStyle(appEl).display : 'N/A');
      console.log('- Visibility:', appEl ? window.getComputedStyle(appEl).visibility : 'N/A');
      console.log('- Opacity:', appEl ? window.getComputedStyle(appEl).opacity : 'N/A');
      console.log('- Height:', appEl ? window.getComputedStyle(appEl).height : 'N/A');
      console.log('- Primer hijo:', appEl?.firstElementChild?.tagName || 'N/A');
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

