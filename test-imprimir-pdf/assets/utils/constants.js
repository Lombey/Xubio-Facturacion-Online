/**
 * Constantes compartidas de la aplicación
 * 
 * Elimina magic numbers y strings del código principal.
 * 
 * @module utils/constants
 */

/**
 * Tipos de impresión para PDFs
 */
export const TIPOS_IMPRESION = {
  /** Tipo de impresión por defecto */
  DEFAULT: '1'
};

/**
 * Condiciones de pago
 */
export const CONDICIONES_PAGO = {
  /** Cuenta Corriente */
  CUENTA_CORRIENTE: 1,
  /** Contado */
  CONTADO: 2
};

/**
 * Formas de pago para cobranzas
 */
export const FORMAS_PAGO = {
  EFECTIVO: 'efectivo',
  CHEQUE: 'cheque',
  TRANSFERENCIA: 'transferencia'
};

/**
 * Códigos de moneda
 */
export const MONEDAS = {
  ARS: 'ARS',
  PESOS_ARGENTINOS: 'PESOS_ARGENTINOS',
  DOLARES: 'DOLARES',
  USD: 'USD'
};

/**
 * Estrategias para manejo de puntos de venta
 */
export const ESTRATEGIAS_PUNTO_VENTA = {
  /** Envía el objeto tal cual viene de la API o normalizado */
  NORMAL: 'normal',
  /** Inyecta editable: true, sugerido: true */
  FORZAR_BOOL: 'forzar_bool',
  /** Inyecta editable: 1, sugerido: 1 */
  FORZAR_INT: 'forzar_int',
  /** Inyecta modoNumeracion: "editablesugerido" */
  MODO_TEXTO: 'modo_texto',
  /** Inyecta modoNumeracion: 2 (Integer) */
  MODO_NUM: 'modo_num',
  /** Inyecta modoNumeracion: "2" (String) */
  MODO_STR_NUM: 'modo_str_num',
  /** Envía un objeto limpio con solo ID, nombre y código */
  SOLO_ID: 'solo_id'
};

/**
 * Campos de diagnóstico para puntos de venta
 */
export const CAMPOS_DIAGNOSTICO = {
  AUTO: 'auto',
  EDITABLE_SUGERIDO: 'editable+sugerido',
  EDITABLE_SUGERIDO_PROP: 'editableSugerido',
  FORZAR_TRUE: 'forzar-true'
};

/**
 * Endpoints de la API de Xubio
 */
export const ENDPOINTS = {
  COMPROBANTE_VENTA: '/comprobanteVentaBean'
};

/**
 * Valores por defecto de la aplicación
 */
export const DEFAULTS = {
  /** Cotización por defecto */
  COTIZACION: '1',
  /** Tipo de impresión por defecto */
  TIPO_IMPRESION: TIPOS_IMPRESION.DEFAULT,
  /** Condición de pago por defecto (Cuenta Corriente) */
  CONDICION_PAGO: CONDICIONES_PAGO.CUENTA_CORRIENTE,
  /** Forma de pago por defecto */
  FORMA_PAGO: FORMAS_PAGO.EFECTIVO,
  /** Estrategia de punto de venta por defecto */
  ESTRATEGIA_PV: ESTRATEGIAS_PUNTO_VENTA.NORMAL,
  /** Guardar credenciales por defecto */
  GUARDAR_CREDENCIALES: true
};

/**
 * Valores que representan "activo" o "verdadero" en diferentes formatos
 */
export const VALORES_ACTIVO = {
  TRUE: true,
  ONE: 1,
  ONE_STRING: '1',
  TRUE_STRING: 'true',
  TRUE_UPPER: 'TRUE',
  TRUE_TITLE: 'True'
};

/**
 * Valores que representan "inactivo" o "falso"
 */
export const VALORES_INACTIVO = {
  FALSE: false,
  ZERO: 0,
  ZERO_STRING: '0',
  FALSE_STRING: 'false'
};
