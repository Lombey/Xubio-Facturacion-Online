/**
 * Tipos de dominio del proyecto
 * Modelos de datos centralizados para reutilización en componentes, utils, etc.
 */

/**
 * Cliente normalizado de Xubio
 */
export interface Cliente {
  id: number | null;
  name: string;
  code: string;
  cuit: string;
  metadata?: {
    original?: any;
    razonSocial?: string;
    nombre?: string;
    identificacionTributaria?: {
      numero?: string;
    };
  };
}

/**
 * Producto normalizado de Xubio
 */
export interface Producto {
  id: number | null;
  name: string;
  code: string;
  price: number;
  description?: string;
  metadata?: {
    original?: any;
    precioAGDP?: number;
    precio?: number;
    tasaIVA?: number;
  };
}

/**
 * Punto de venta normalizado de Xubio
 */
export interface PuntoVenta {
  id: number | null;
  name: string;
  code: string;
  editable: boolean;
  sugerido: boolean;
  editableSugerido: boolean;
  metadata?: {
    original?: any;
  };
}

/**
 * Cliente en formato crudo de la API (antes de normalizar)
 */
export interface ClienteRaw {
  cliente_id?: number;
  ID?: number;
  id?: number;
  razonSocial?: string;
  nombre?: string;
  codigo?: string;
  cuit?: string;
  identificacionTributaria?: {
    numero?: string;
  };
}

/**
 * Producto en formato crudo de la API (antes de normalizar)
 */
export interface ProductoRaw {
  productoid?: number;
  ID?: number;
  id?: number;
  nombre?: string;
  codigo?: string;
  precioAGDP?: number;
  precio?: number;
  descripcion?: string;
  tasaIva?: number;
  tasaIVA?: number;
}

/**
 * Punto de venta en formato crudo de la API (antes de normalizar)
 * Nota: La API puede devolver números (1/0) o booleanos para editable, sugerido y editableSugerido
 */
export interface PuntoVentaRaw {
  puntoVentaId?: number;
  ID?: number;
  id?: number;
  nombre?: string;
  codigo?: string;
  puntoVenta?: string;
  editable?: boolean | number;
  sugerido?: boolean | number;
  editableSugerido?: boolean | number;
}
