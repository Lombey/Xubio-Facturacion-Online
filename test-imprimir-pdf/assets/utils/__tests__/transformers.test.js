/**
 * Tests unitarios para transformers.js
 * 
 * Este archivo reutiliza los tests de normalizers.js ya que transformers.js
 * reexporta esas funciones. Los tests están en normalizers.test.js.
 * 
 * @module utils/__tests__/transformers.test
 */

import { describe, it, expect } from 'vitest';
import { normalizarPuntoVenta, normalizarCliente, normalizarProducto } from '../transformers.js';

describe('transformers', () => {
  // Estos tests verifican que las funciones reexportadas funcionan correctamente
  // Los tests completos están en normalizers.test.js

  describe('normalizarPuntoVenta', () => {
    it('debe reexportar la función de normalizers', () => {
      expect(typeof normalizarPuntoVenta).toBe('function');
    });

    it('debe normalizar un punto de venta básico', () => {
      const raw = { puntoVentaId: 123, nombre: 'PV Test', codigo: 'PV001' };
      const result = normalizarPuntoVenta(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(123);
        expect(result.name).toBe('PV Test');
      }
    });
  });

  describe('normalizarCliente', () => {
    it('debe reexportar la función de normalizers', () => {
      expect(typeof normalizarCliente).toBe('function');
    });

    it('debe normalizar un cliente básico', () => {
      const raw = { cliente_id: 456, razonSocial: 'Cliente Test', cuit: '20123456789' };
      const result = normalizarCliente(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(456);
        expect(result.name).toBe('Cliente Test');
      }
    });
  });

  describe('normalizarProducto', () => {
    it('debe reexportar la función de normalizers', () => {
      expect(typeof normalizarProducto).toBe('function');
    });

    it('debe normalizar un producto básico', () => {
      const raw = { productoid: 789, nombre: 'Producto Test', codigo: 'PROD001' };
      const result = normalizarProducto(raw);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe(789);
        expect(result.name).toBe('Producto Test');
      }
    });
  });
});
