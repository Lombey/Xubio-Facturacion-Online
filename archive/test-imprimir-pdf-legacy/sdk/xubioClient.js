/**
 * Cliente HTTP puro para Xubio.
 * Diseñado para ser portable (funciona en Browser, Node y adaptable a Apps Script).
 */
export class XubioClient {
    /**
     * @param {Object} config
     * @param {string} config.clientId
     * @param {string} config.secretId
     * @param {string} [config.baseUrl] - Default: '/api' (proxy) o URL directa
     */
    constructor({ clientId, secretId, baseUrl = '/api' }) {
        this.clientId = clientId;
        this.secretId = secretId;
        this.baseUrl = baseUrl;
        this.accessToken = null;
        this.tokenExpiration = null;
    }

    /**
     * Obtiene o renueva el token de acceso.
     * @returns {Promise<string>} Token
     */
    async getToken() {
        if (this.isTokenValid()) {
            return this.accessToken;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: this.clientId,
                    secretId: this.secretId
                })
            });

            if (!response.ok) throw new Error('Error de autenticación');

            const data = await response.json();
            this.accessToken = data.access_token || data.token;
            // Calcular expiración (data.expires_in suele ser segundos)
            const expiresIn = parseInt(data.expires_in || 3600, 10);
            this.tokenExpiration = Date.now() + (expiresIn * 1000);

            return this.accessToken;
        } catch (error) {
            console.error('XubioSDK: Error obteniendo token', error);
            throw error;
        }
    }

    /**
     * Verifica si el token actual es válido (con margen de 60s).
     */
    isTokenValid() {
        return this.accessToken && this.tokenExpiration && Date.now() < (this.tokenExpiration - 60000);
    }

    /**
     * Realiza una petición genérica a Xubio.
     * @param {string} endpoint - Ej: '/comprobanteVentaBean'
     * @param {string} method - 'GET', 'POST', etc.
     * @param {Object} [payload] - Body del request
     * @param {Object} [queryParams] - Query params
     */
    async request(endpoint, method = 'GET', payload = null, queryParams = null) {
        const token = await this.getToken();
        
        let url = `${this.baseUrl}${endpoint}`;
        if (queryParams) {
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([k, v]) => params.append(k, v));
            url += `?${params.toString()}`;
        }

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (payload) {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);
        const responseData = await response.json().catch(() => ({})); // Manejo de respuestas vacías

        if (!response.ok) {
            throw {
                status: response.status,
                message: responseData.message || responseData.error || response.statusText,
                data: responseData
            };
        }

        return responseData;
    }
}
