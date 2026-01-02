/**
 * Servicio de Lógica de Negocio para Facturas.
 * Contiene PURA lógica de transformación de datos (Input -> JSON Xubio).
 */
export class FacturaService {
    /**
     * Construye el payload JSON exacto que Xubio espera para crear una factura.
     * 
     * @param {Object} data - Datos normalizados de la factura
     * @param {number|string} data.clienteId - ID del cliente en Xubio
     * @param {Object} data.puntoVenta - Objeto completo del punto de venta
     * @param {Object} data.vendedor - Objeto vendedor (id, nombre...)
     * @param {Object} [data.circuitoContable] - Objeto circuito contable
     * @param {Object} [data.deposito] - Objeto depósito
     * @param {string} [data.condicionPago=1] - 1=CC, 2=Contado
     * @param {string} [data.fecha] - YYYY-MM-DD
     * @param {string} [data.fechaVto] - YYYY-MM-DD
     * @param {Array} data.items - Lista de productos { cantidad, precio, producto: {id...}, descripcion? }
     * @param {string} [data.moneda] - Código de moneda (ej: 'PESOS_ARGENTINOS')
     * @param {number} [data.cotizacion=1]
     * @returns {Object} Payload listo para enviar a la API
     */
    static buildPayload({
        clienteId,
        puntoVenta,
        vendedor,
        circuitoContable,
        deposito,
        condicionPago = 1,
        fecha,
        fechaVto,
        items,
        moneda,
        cotizacion = 1,
        centroCostoDefault
    }) {
        const fechaISO = fecha || new Date().toISOString().split('T')[0];
        
        // 1. Construir Items de Producto
        const transaccionProductoItems = items.map(item => {
            const cantidad = parseFloat(item.cantidad) || 1;
            const precio = parseFloat(item.precio) || 0;
            const importe = cantidad * precio;
            
            // Lógica de IVA (Asumiendo 21% si no viene especificado, y que precio incluye IVA)
            // TODO: Hacer parametrizable si el precio es neto o bruto
            const tasaIVA = item.tasaIva || 21; 
            const iva = importe - (importe / (1 + tasaIVA / 100));
            const total = importe;

            return {
                cantidad: cantidad,
                precio: precio,
                descripcion: item.descripcion || item.producto?.nombre || 'Item sin descripción',
                producto: { 
                    ID: item.producto?.ID || item.producto?.id,
                    nombre: item.producto?.nombre,
                    codigo: item.producto?.codigo
                },
                iva: parseFloat(iva.toFixed(2)),
                importe: parseFloat(importe.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                montoExento: 0,
                porcentajeDescuento: 0,
                centroDeCosto: centroCostoDefault, // Requerido por línea
                deposito: deposito // Recomendado por línea
            };
        });

        // 2. Construir Objeto Base
        const payload = {
            circuitoContable: circuitoContable,
            comprobante: 1, // 1=Factura
            tipo: 1, 
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: fechaISO,
            fechaVto: fechaVto || fechaISO,
            condicionDePago: parseInt(condicionPago),
            puntoVenta: puntoVenta, // CRÍTICO: Debe ser editable/sugerido
            vendedor: vendedor,
            deposito: deposito, // Header
            transaccionProductoItems: transaccionProductoItems,
            
            // Defaults obligatorios de la API
            cantComprobantesCancelados: 0,
            cantComprobantesEmitidos: 0,
            cbuinformada: false,
            cotizacionListaDePrecio: 1,
            descripcion: '',
            facturaNoExportacion: false,
            nombre: '',
            numeroDocumento: '',
            porcentajeComision: 0,
            transaccionCobranzaItems: [],
            transaccionPercepcionItems: []
        };

        // 3. Manejo de Moneda Extranjera
        if (moneda && moneda !== 'PESOS_ARGENTINOS' && moneda !== 'ARS') {
            payload.moneda = {
                codigo: moneda
                // Nota: Xubio a veces pide ID, a veces solo código. 
                // En app.js se enviaba ID, codigo y nombre.
            };
            payload.cotizacion = parseFloat(cotizacion) || 1;
            payload.utilizaMonedaExtranjera = 1;
        }

        return payload;
    }

    /**
     * Construye el payload para solicitar CAE a la AFIP.
     * @param {Object} data
     * @param {number|string} data.transaccionId - ID devuelto por crearFactura
     * @returns {Object} Payload para /solicitarCAE
     */
    static buildCAEPayload({ transaccionId }) {
        if (!transaccionId) throw new Error('Se requiere transaccionId para solicitar CAE');
        
        return {
            transaccionId: parseInt(transaccionId)
        };
    }
}
