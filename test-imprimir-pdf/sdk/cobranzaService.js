/**
 * Servicio de Lógica de Negocio para Cobranzas.
 */
export class CobranzaService {
    /**
     * Construye el payload JSON para crear una cobranza en Xubio.
     * 
     * @param {Object} data - Datos para la cobranza
     * @param {number|string} data.clienteId - ID del cliente
     * @param {Object} data.facturaRef - Referencia de la factura (debe incluir moneda, cotización y circuito)
     * @param {number|string} data.importe - Importe a cobrar
     * @param {string} [data.fecha] - YYYY-MM-DD
     * @param {Object} [data.cuentaCaja] - Objeto cuenta (id, nombre...) para el ingreso del dinero
     * @param {number} [data.cuentaTipo=1] - 1=Caja, 2=Banco, etc.
     * @returns {Object} Payload listo para enviar
     */
    static buildPayload({
        clienteId,
        facturaRef,
        importe,
        fecha,
        cuentaCaja = { ID: 1, id: 1 }, // Por defecto Caja
        cuentaTipo = 1
    }) {
        const fechaISO = fecha || new Date().toISOString().split('T')[0];
        const monto = parseFloat(importe);

        if (isNaN(monto) || monto <= 0) {
            throw new Error('El importe debe ser un número mayor a cero');
        }

        // El payload de cobranza en Xubio es bastante específico
        return {
            circuitoContable: facturaRef.circuitoContable || { ID: 1 },
            cliente: { cliente_id: parseInt(clienteId) },
            fecha: fechaISO,
            monedaCtaCte: facturaRef.moneda || { ID: 1 },
            cotizacion: facturaRef.cotizacion || 1,
            utilizaMonedaExtranjera: (facturaRef.moneda?.codigo && facturaRef.moneda.codigo !== 'PESOS_ARGENTINOS' && facturaRef.moneda.codigo !== 'ARS') ? 1 : 0,
            
            // Medios de pago (Instrumentos de cobro)
            transaccionInstrumentoDeCobro: [{
                cuentaTipo: cuentaTipo,
                cuenta: cuentaCaja,
                moneda: facturaRef.moneda || { ID: 1 },
                cotizacion: facturaRef.cotizacion || 1,
                importe: monto,
                descripcion: `Cobranza de comprobante ID ${facturaRef.id || facturaRef.ID || facturaRef.transaccionId}`
            }],
            
            // Imputación (A qué factura se aplica)
            detalleCobranzas: [{
                idComprobante: parseInt(facturaRef.id || facturaRef.ID || facturaRef.transaccionId),
                importe: monto
            }]
        };
    }
}
