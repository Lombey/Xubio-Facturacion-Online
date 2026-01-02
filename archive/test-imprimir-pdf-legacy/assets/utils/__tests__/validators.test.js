/**
 * Tests unitarios para validators.js
 * 
 * @module utils/__tests__/validators.test
 */

import { describe, it, expect } from 'vitest';
import { esPuntoVentaValido, esClienteValido, esProductoValido } from '../validators.js';

describe('validators', () => {
  describe('esPuntoVentaValido', () => {
    it('debe retornar false para null', () => {
      expect(esPuntoVentaValido(null)).toBe(false);
    });

    it('debe retornar false para undefined', () => {
      expect(esPuntoVentaValido(undefined)).toBe(false);
    });

    it('debe retornar false para objeto vacío', () => {
      expect(esPuntoVentaValido({})).toBe(false);
    });

    it('debe retornar true en modo prueba si tiene ID (puntoVentaId)', () => {
      const pv = { puntoVentaId: 123 };
      expect(esPuntoVentaValido(pv, true)).toBe(true);
    });

    it('debe retornar true en modo prueba si tiene ID (ID)', () => {
      const pv = { ID: 456 };
      expect(esPuntoVentaValido(pv, true)).toBe(true);
    });

    it('debe retornar true en modo prueba si tiene ID (id)', () => {
      const pv = { id: 789 };
      expect(esPuntoVentaValido(pv, true)).toBe(true);
    });

    it('debe retornar false en modo prueba si no tiene ID', () => {
      const pv = { nombre: 'PV Test' };
      expect(esPuntoVentaValido(pv, true)).toBe(false);
    });

    it('debe retornar false si no tiene ID (validación completa)', () => {
      const pv = { nombre: 'PV Test', editable: true, sugerido: true };
      expect(esPuntoVentaValido(pv, false)).toBe(false);
    });

    it('debe retornar false si no está activo', () => {
      const pv = {
        ID: 123,
        activo: false,
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(false);
    });

    it('debe retornar true si está activo (undefined se considera activo)', () => {
      const pv = {
        ID: 123,
        activo: undefined,
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(true);
    });

    it('debe retornar true si está activo (activo = 1)', () => {
      const pv = {
        ID: 123,
        activo: 1,
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(true);
    });

    it('debe retornar true si está activo (activo = "1")', () => {
      const pv = {
        ID: 123,
        activo: '1',
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(true);
    });

    it('debe retornar true si está activo (activo = true)', () => {
      const pv = {
        ID: 123,
        activo: true,
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(true);
    });

    it('debe retornar false si no es editable', () => {
      const pv = {
        ID: 123,
        activo: true,
        editable: false,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(false);
    });

    it('debe retornar false si no es sugerido', () => {
      const pv = {
        ID: 123,
        activo: true,
        editable: true,
        sugerido: false
      };
      expect(esPuntoVentaValido(pv, false)).toBe(false);
    });

    it('debe retornar true si tiene ID, está activo, y es editable+sugerido', () => {
      const pv = {
        ID: 123,
        activo: true,
        editable: true,
        sugerido: true
      };
      expect(esPuntoVentaValido(pv, false)).toBe(true);
    });

    it('debe aceptar diferentes campos de ID', () => {
      expect(esPuntoVentaValido({ puntoVentaId: 1, activo: true, editable: true, sugerido: true }, false)).toBe(true);
      expect(esPuntoVentaValido({ ID: 2, activo: true, editable: true, sugerido: true }, false)).toBe(true);
      expect(esPuntoVentaValido({ id: 3, activo: true, editable: true, sugerido: true }, false)).toBe(true);
      expect(esPuntoVentaValido({ puntoVenta_id: 4, activo: true, editable: true, sugerido: true }, false)).toBe(true);
    });
  });

  describe('esClienteValido', () => {
    it('debe retornar false para null', () => {
      expect(esClienteValido(null)).toBe(false);
    });

    it('debe retornar false para undefined', () => {
      expect(esClienteValido(undefined)).toBe(false);
    });

    it('debe retornar false para objeto vacío', () => {
      expect(esClienteValido({})).toBe(false);
    });

    it('debe retornar false si no tiene ID', () => {
      const cliente = { nombre: 'Cliente Test' };
      expect(esClienteValido(cliente)).toBe(false);
    });

    it('debe retornar false si no tiene nombre ni razón social', () => {
      const cliente = { ID: 123 };
      expect(esClienteValido(cliente)).toBe(false);
    });

    it('debe retornar true si tiene ID y nombre', () => {
      const cliente = { ID: 123, nombre: 'Cliente Test' };
      expect(esClienteValido(cliente)).toBe(true);
    });

    it('debe retornar true si tiene ID y razón social', () => {
      const cliente = { ID: 123, razonSocial: 'Cliente Test SRL' };
      expect(esClienteValido(cliente)).toBe(true);
    });

    it('debe aceptar diferentes campos de ID', () => {
      expect(esClienteValido({ cliente_id: 1, nombre: 'Test' })).toBe(true);
      expect(esClienteValido({ ID: 2, nombre: 'Test' })).toBe(true);
      expect(esClienteValido({ id: 3, nombre: 'Test' })).toBe(true);
    });
  });

  describe('esProductoValido', () => {
    it('debe retornar false para null', () => {
      expect(esProductoValido(null)).toBe(false);
    });

    it('debe retornar false para undefined', () => {
      expect(esProductoValido(undefined)).toBe(false);
    });

    it('debe retornar false para objeto vacío', () => {
      expect(esProductoValido({})).toBe(false);
    });

    it('debe retornar false si no tiene ID', () => {
      const producto = { nombre: 'Producto Test' };
      expect(esProductoValido(producto)).toBe(false);
    });

    it('debe retornar true si tiene ID (productoid)', () => {
      const producto = { productoid: 123 };
      expect(esProductoValido(producto)).toBe(true);
    });

    it('debe retornar true si tiene ID (ID)', () => {
      const producto = { ID: 456 };
      expect(esProductoValido(producto)).toBe(true);
    });

    it('debe retornar true si tiene ID (id)', () => {
      const producto = { id: 789 };
      expect(esProductoValido(producto)).toBe(true);
    });

    it('debe aceptar diferentes campos de ID', () => {
      expect(esProductoValido({ productoid: 1 })).toBe(true);
      expect(esProductoValido({ ID: 2 })).toBe(true);
      expect(esProductoValido({ id: 3 })).toBe(true);
    });
  });
});
