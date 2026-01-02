// @ts-check
import { describe, it, expect } from 'vitest';
import { filtrarClientes, filtrarProductos } from '../domain-filters.js';

describe('domain-filters', () => {
  describe('filtrarClientes', () => {
    /** @type {import('../domain-filters.js').ClienteParaFiltro[]} */
    const clientes = [
      { name: 'Cliente 1', cuit: '20123456789' },
      { name: 'Cliente 2', cuit: '20987654321' },
      { razonSocial: 'Cliente 3', cuit: '20111111111' }
    ];

    it('debe filtrar por nombre', () => {
      const resultado = filtrarClientes(clientes, 'Cliente 1');
      expect(resultado).not.toBeNull();
      expect(resultado).not.toBeUndefined();
      if (resultado && Array.isArray(resultado)) {
        expect(resultado).toHaveLength(1);
        expect(resultado[0].name).toBe('Cliente 1');
      }
    });

    it('debe filtrar por CUIT', () => {
      const resultado = filtrarClientes(clientes, '20123456789');
      expect(resultado).toHaveLength(1);
    });

    it('debe filtrar por CUIT sin formato', () => {
      const resultado = filtrarClientes(clientes, '20-12345678-9');
      expect(resultado).toHaveLength(1);
    });

    it('debe retornar todos si busqueda está vacía', () => {
      const resultado = filtrarClientes(clientes, '');
      expect(resultado).toHaveLength(3);
    });

    it('debe retornar todos si busqueda es null o undefined', () => {
      expect(filtrarClientes(clientes, null)?.length).toBe(3);
      expect(filtrarClientes(clientes, undefined)?.length).toBe(3);
    });

    it('debe retornar null/undefined si clientes no es array', () => {
      expect(filtrarClientes(null, 'test')).toBeNull();
      expect(filtrarClientes(undefined, 'test')).toBeUndefined();
    });

    it('debe filtrar por razonSocial', () => {
      const resultado = filtrarClientes(clientes, 'Cliente 3');
      expect(resultado).not.toBeNull();
      expect(resultado).not.toBeUndefined();
      if (resultado && Array.isArray(resultado)) {
        expect(resultado).toHaveLength(1);
        expect(resultado[0].razonSocial).toBe('Cliente 3');
      }
    });
  });

  describe('filtrarProductos', () => {
    /** @type {import('../domain-filters.js').ProductoParaFiltro[]} */
    const productos = [
      { name: 'Producto 1', code: 'P001', description: 'Descripción 1' },
      { nombre: 'Producto 2', codigo: 'P002', descripcion: 'Descripción 2' }
    ];

    it('debe filtrar por nombre', () => {
      const resultado = filtrarProductos(productos, 'Producto 1');
      expect(resultado).toHaveLength(1);
    });

    it('debe filtrar por código', () => {
      const resultado = filtrarProductos(productos, 'P001');
      expect(resultado).toHaveLength(1);
    });

    it('debe filtrar por descripción', () => {
      const resultado = filtrarProductos(productos, 'Descripción 1');
      expect(resultado).toHaveLength(1);
    });

    it('debe retornar todos si busqueda está vacía', () => {
      const resultado = filtrarProductos(productos, '');
      expect(resultado).toHaveLength(2);
    });

    it('debe retornar todos si busqueda es null o undefined', () => {
      expect(filtrarProductos(productos, null)?.length).toBe(2);
      expect(filtrarProductos(productos, undefined)?.length).toBe(2);
    });

    it('debe retornar null/undefined si productos no es array', () => {
      expect(filtrarProductos(null, 'test')).toBeNull();
      expect(filtrarProductos(undefined, 'test')).toBeUndefined();
    });
  });
});
