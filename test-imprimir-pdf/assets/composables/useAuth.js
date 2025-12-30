/**
 * Composable para manejo de autenticación con Xubio
 * Extraído de app.js (líneas 498-586, 588-598)
 */

export function useAuth() {
  /** @type {{ accessToken: string | null, tokenExpiration: number | null, clientId: string, secretId: string, guardarCredenciales: boolean }} */
  const state = {
    /** @type {string | null} */
    accessToken: null,
    /** @type {number | null} */
    tokenExpiration: null,
    clientId: '',
    secretId: '',
    guardarCredenciales: true
  };

  /**
   * Verifica si el token es válido
   * @returns {boolean} true si el token es válido, false en caso contrario
   */
  function tokenValido() {
    return state.accessToken !== null && 
           state.tokenExpiration !== null && 
           Date.now() < state.tokenExpiration - 60000; // 1 minuto de margen
  }

  /**
   * Carga credenciales desde localStorage
   * @returns {boolean} true si se cargó un token válido, false en caso contrario
   */
  function cargarCredenciales() {
    const savedClientId = localStorage.getItem('xubio_clientId');
    const savedSecretId = localStorage.getItem('xubio_secretId');
    
    if (savedClientId) state.clientId = savedClientId;
    if (savedSecretId) state.secretId = savedSecretId;

    // Cargar token guardado
    const savedToken = localStorage.getItem('xubio_token');
    const savedExpiration = localStorage.getItem('xubio_tokenExpiration');

    if (savedToken && savedExpiration && Date.now() < parseInt(savedExpiration) - 60000) {
      state.accessToken = savedToken || null;
      state.tokenExpiration = parseInt(savedExpiration) || null;
      return true; // Token válido cargado
    }
    
    return false; // No hay token válido
  }

  /**
   * @typedef {Function} MostrarResultadoCallback
   * @param {string} seccion - Sección donde mostrar el resultado
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo de mensaje ('success', 'error', 'info')
   * @returns {void}
   */

  /**
   * @typedef {Function} HandleErrorCallback
   * @param {Error | unknown} error - Error a manejar
   * @param {string} contexto - Contexto del error
   * @param {string} seccion - Sección donde ocurrió el error
   * @returns {void}
   */

  /**
   * @typedef {Function} AsyncCallback
   * @returns {Promise<void>}
   */

  /**
   * Obtiene un token de acceso de Xubio
   * @param {boolean} [forceRefresh=false] - Si es true, fuerza la renovación del token
   * @param {MostrarResultadoCallback} [mostrarResultado] - Función para mostrar resultados
   * @param {HandleErrorCallback} [handleError] - Función para manejar errores
   * @param {AsyncCallback} [cargarValoresConfiguracion] - Función para cargar valores después del token
   * @param {AsyncCallback} [obtenerMonedas] - Función para obtener monedas
   * @param {AsyncCallback} [obtenerCuentas] - Función para obtener cuentas
   * @returns {Promise<string | null | undefined>} Token de acceso, null o undefined si falla
   */
  async function obtenerToken(forceRefresh = false, mostrarResultado, handleError, cargarValoresConfiguracion, obtenerMonedas, obtenerCuentas) {
    let clientId = state.clientId.trim();
    let secretId = state.secretId.trim();
    
    // Si no hay en el estado, intentar desde localStorage
    if (!clientId) {
      clientId = localStorage.getItem('xubio_clientId') || '';
    }
    if (!secretId) {
      secretId = localStorage.getItem('xubio_secretId') || '';
    }

    if (!clientId || !secretId) {
      if (mostrarResultado) {
        mostrarResultado('token', 'Error: Completa Client ID y Secret ID', 'error');
      }
      return;
    }

    // Verificar si el token actual es válido
    if (!forceRefresh && tokenValido()) {
      if (mostrarResultado) {
        mostrarResultado('token', '✅ Token aún válido, no es necesario renovarlo', 'success');
      }
      return;
    }

    if (mostrarResultado) {
      mostrarResultado('token', 'Obteniendo token...', 'info');
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ clientId, secretId })
      });

      console.log('📥 Token response:', response.status, response.statusText);

      let data;
      try {
        data = await response.json();
        console.log('📄 Token response parsed:', data);
      } catch (parseError) {
        console.error('❌ Error parseando token response:', parseError);
        const errorText = await response.text().catch(() => 'Sin respuesta');
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`Error parseando respuesta del token: ${errorMessage}. Respuesta recibida: ${errorText.substring(0, 200)}`);
      }

      if (response.ok && data) {
        state.accessToken = (data.access_token || data.token) || null;
        const expiresIn = parseInt(data.expires_in || '3600', 10);
        state.tokenExpiration = Date.now() + (expiresIn * 1000);

        if (state.guardarCredenciales && state.accessToken && state.tokenExpiration) {
          localStorage.setItem('xubio_clientId', clientId);
          localStorage.setItem('xubio_secretId', secretId);
          localStorage.setItem('xubio_token', state.accessToken);
          localStorage.setItem('xubio_tokenExpiration', state.tokenExpiration.toString());
        }

        if (mostrarResultado && state.accessToken && state.tokenExpiration) {
          mostrarResultado('token',
            `✅ Token obtenido exitosamente!\n\nToken: ${state.accessToken.substring(0, 50)}...\nExpira en: ${expiresIn} segundos\nVálido hasta: ${new Date(state.tokenExpiration).toLocaleString()}`,
            'success'
          );
        }
        
        // Cargar valores de configuración después de obtener el token
        if (cargarValoresConfiguracion) {
          await cargarValoresConfiguracion();
        }
        
        // Cargar monedas disponibles
        if (obtenerMonedas) {
          await obtenerMonedas();
        }
        
        // Cargar cuentas disponibles
        if (obtenerCuentas) {
          await obtenerCuentas();
        }

        return state.accessToken;
      } else {
        const errorMsg = `❌ Error obteniendo token:\n\nStatus: ${response.status} ${response.statusText}\n\n${data.error || data.message || 'Error desconocido'}\n\n💡 Revisa la consola del navegador (F12) para más detalles.`;
        if (mostrarResultado) {
          mostrarResultado('token', errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      if (handleError) {
        handleError(error, 'Obtención de token', 'token');
      }
      throw error;
    }
  }

  /**
   * Limpia credenciales y token
   * @returns {void}
   */
  function limpiarCredenciales() {
    localStorage.removeItem('xubio_clientId');
    localStorage.removeItem('xubio_secretId');
    localStorage.removeItem('xubio_token');
    localStorage.removeItem('xubio_tokenExpiration');
    state.clientId = '';
    state.secretId = '';
    state.accessToken = null;
    state.tokenExpiration = null;
    // @ts-ignore - null es válido para estos campos
    return;
  }

  return {
    state,
    tokenValido,
    obtenerToken,
    limpiarCredenciales,
    cargarCredenciales
  };
}

export default useAuth;

