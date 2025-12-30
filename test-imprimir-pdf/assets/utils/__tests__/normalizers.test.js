// @ts-check
import { describe, it, expect } from 'vitest';
import { normalizarCliente, normalizarProducto, normalizarPuntoVenta, normalizarArray } from '../normalizers.js';

describe('normalizers', () => {
  describe('normalizarCliente', () => {
    it('debe normalizar cliente con cliente_id', () => {
      /** @type {import('../normalizers.js').ClienteRaw} */
      const raw = { cliente_id: 123, razonSocial: 'Test SRL', cuit: '20123456789' };
      const result = normalizarCliente(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(123);
        expect(result.name).toBe('Test SRL');
        expect(result.cuit).toBe('20123456789');
        expect(result.metadata.original).toBe(raw);
      }
    });

    it('debe normalizar cliente con ID', () => {
      /** @type {import('../normalizers.js').ClienteRaw} */
      const raw = { ID: 456, nombre: 'Test 2', identificacionTributaria: { numero: '20987654321' } };
      const result = normalizarCliente(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(456);
        expect(result.name).toBe('Test 2');
        expect(result.cuit).toBe('20987654321');
      }
    });

    it('debe retornar null para input null', () => {
      expect(normalizarCliente(null)).toBeNull();
    });

    it('debe manejar cliente sin razonSocial ni nombre', () => {
      /** @type {import('../normalizers.js').ClienteRaw} */
      const raw = { cliente_id: 789, cuit: '20111111111' };
      const result = normalizarCliente(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(789);
        expect(result.name).toBe('');
        expect(result.cuit).toBe('20111111111');
      }
    });
  });

  describe('normalizarProducto', () => {
    it('debe normalizar producto con productoid', () => {
      /** @type {import('../normalizers.js').ProductoRaw} */
      const raw = { productoid: 789, nombre: 'Producto 1', precioAGDP: 100 };
      const result = normalizarProducto(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(789);
        expect(result.name).toBe('Producto 1');
        expect(result.price).toBe(100);
      }
    });

    it('debe normalizar producto con ID', () => {
      /** @type {import('../normalizers.js').ProductoRaw} */
      const raw = { ID: 999, nombre: 'Producto 2', precio: 50 };
      const result = normalizarProducto(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(999);
        expect(result.price).toBe(50);
      }
    });

    it('debe usar precio 0 si no hay precio', () => {
      /** @type {import('../normalizers.js').ProductoRaw} */
      const raw = { productoid: 111, nombre: 'Producto sin precio' };
      const result = normalizarProducto(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.price).toBe(0);
      }
    });

    it('debe retornar null para input null', () => {
      expect(normalizarProducto(null)).toBeNull();
    });
  });

  describe('normalizarPuntoVenta', () => {
    it('debe incluir propiedades editable y sugerido', () => {
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw = { puntoVentaId: 1, codigo: '0004' };
      const result = normalizarPuntoVenta(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.editable).toBe(true);
        expect(result.sugerido).toBe(true);
        expect(result.editableSugerido).toBe(true);
      }
    });

    it('debe respetar valores explícitos de editable y sugerido', () => {
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw = { puntoVentaId: 2, codigo: '0005', editable: false, sugerido: false };
      const result = normalizarPuntoVenta(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.editable).toBe(false);
        expect(result.sugerido).toBe(false);
      }
    });

    it('debe normalizar con puntoVentaId o ID', () => {
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw1 = { puntoVentaId: 10, codigo: '0010' };
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw2 = { ID: 20, codigo: '0020' };
      expect(normalizarPuntoVenta(raw1)?.id).toBe(10);
      expect(normalizarPuntoVenta(raw2)?.id).toBe(20);
    });

    it('debe usar codigo o puntoVenta como code', () => {
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw1 = { puntoVentaId: 1, codigo: '0004' };
      /** @type {import('../normalizers.js').PuntoVentaRaw} */
      const raw2 = { puntoVentaId: 2, puntoVenta: '0005' };
      expect(normalizarPuntoVenta(raw1)?.code).toBe('0004');
      expect(normalizarPuntoVenta(raw2)?.code).toBe('0005');
    });

    it('debe retornar null para input null', () => {
      expect(normalizarPuntoVenta(null)).toBeNull();
    });
  });

  describe('normalizarArray', () => {
    it('debe normalizar un array de items', () => {
      /** @type {import('../normalizers.js').ClienteRaw[]} */
      const raw = [
        { cliente_id: 1, razonSocial: 'Cliente 1' },
        { ID: 2, nombre: 'Cliente 2' }
      ];
      const result = normalizarArray(raw, normalizarCliente);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('debe filtrar items null', () => {
      /** @type {Array<import('../normalizers.js').ClienteRaw | null>} */
      const raw = [
        { cliente_id: 1, razonSocial: 'Cliente 1' },
        null,
        { ID: 2, nombre: 'Cliente 2' }
      ];
      const result = normalizarArray(raw, normalizarCliente);
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío para input no array', () => {
      expect(normalizarArray(null, normalizarCliente)).toEqual([]);
      expect(normalizarArray(undefined, normalizarCliente)).toEqual([]);
      // @ts-expect-error - Testing invalid input type
      expect(normalizarArray('string', normalizarCliente)).toEqual([]);
    });
  });
});
