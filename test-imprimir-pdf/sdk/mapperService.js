/**
 * Servicio de Mapeo y Normalización de Datos.
 * Convierte respuestas crudas de Xubio en objetos utilizables por la lógica de negocio.
 */
export class MapperService {
    /**
     * Limpia un CUIT/CUIL dejando solo los números.
     * Útil para búsquedas y comparaciones.
     * @param {string} cuit - Ej: "20-12345678-9"
     * @returns {string} Ej: "20123456789"
     */
    static cleanCUIT(cuit) {
        if (!cuit) return '';
        return cuit.replace(/\D/g, '');
    }

    /**
     * Busca un cliente en una lista usando ID o CUIT.
     * @param {Array} clientes - Lista de clientes de Xubio
     * @param {string|number} query - ID o CUIT a buscar
     * @returns {Object|null} Cliente encontrado o null
     */
    static findCliente(clientes, query) {
        if (!clientes || !query) return null;
        
        const queryStr = String(query).trim();
        const queryClean = this.cleanCUIT(queryStr);

        return clientes.find(c => {
            // 1. Coincidencia por ID directo
            const id = String(c.cliente_id || c.id || c.ID);
            if (id === queryStr) return true;

            // 2. Coincidencia por CUIT
            const cuit = this.cleanCUIT(c.cuit || c.identificacionTributaria?.numero);
            if (cuit && cuit === queryClean) return true;

            return false;
        });
    }

    /**
     * Normaliza un objeto Producto para asegurar que tenga los campos mínimos.
     * @param {Object} rawProducto
     * @returns {Object} Producto normalizado { ID, nombre, codigo, precio, iva }
     */
    static normalizeProducto(rawProducto) {
        if (!rawProducto) return null;

        return {
            ID: rawProducto.productoid || rawProducto.id || rawProducto.ID,
            nombre: rawProducto.nombre || '',
            codigo: rawProducto.codigo || '',
            precio: parseFloat(rawProducto.precioVenta || 0),
            tasaIva: rawProducto.tasaIva?.porcentaje || 21
        };
    }

    /**
     * Valida si un Punto de Venta es apto para facturar.
     * @param {Object} pv 
     * @returns {boolean}
     */
    static isValidPuntoVenta(pv) {
        if (!pv) return false;
        // Lógica crítica detectada en app.js: debe ser editable y sugerido (o sus variantes)
        const isEditable = pv.editable === true || pv.editable === 'true' || pv.editable === 1;
        const isSugerido = pv.sugerido === true || pv.sugerido === 'true' || pv.sugerido === 1;
        const isEditableSugerido = pv.editableSugerido === true || pv.editableSugerido === 'true';

        return (isEditable && isSugerido) || isEditableSugerido;
    }
}
