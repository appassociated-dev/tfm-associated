import { describe, it, expect } from 'vitest';
import { parsePermissions } from '../parse-permissions';

describe('parsePermissions', () => {
  // --- Array nativo ---

  it('debería retornar el array tal cual cuando recibe un string[] nativo', () => {
    const input = ['members:read', 'members:write'];
    expect(parsePermissions(input)).toEqual(['members:read', 'members:write']);
  });

  it('debería filtrar elementos no-string de un array mixto', () => {
    const input = ['members:read', 42, null, 'members:write'];
    expect(parsePermissions(input)).toEqual(['members:read', 'members:write']);
  });

  it('debería retornar array vacío para un array vacío', () => {
    expect(parsePermissions([])).toEqual([]);
  });

  // --- String JSON (doble serialización) ---

  it('debería parsear un string JSON válido que contiene un array', () => {
    const input = '["members:read", "members:write"]';
    expect(parsePermissions(input)).toEqual(['members:read', 'members:write']);
  });

  it('debería retornar array vacío para string JSON inválido (malformed)', () => {
    expect(parsePermissions('not-valid-json{')).toEqual([]);
  });

  it('debería retornar array vacío para string JSON que parsea a un objeto', () => {
    expect(parsePermissions('{"not": "array"}')).toEqual([]);
  });

  it('debería retornar array vacío para string JSON que parsea a un string', () => {
    expect(parsePermissions('"solo-un-string"')).toEqual([]);
  });

  it('debería retornar array vacío para un string vacío', () => {
    expect(parsePermissions('')).toEqual([]);
  });

  // --- null / undefined / otros tipos ---

  it('debería retornar array vacío para null', () => {
    expect(parsePermissions(null)).toEqual([]);
  });

  it('debería retornar array vacío para undefined', () => {
    expect(parsePermissions(undefined)).toEqual([]);
  });

  it('debería retornar array vacío para un number', () => {
    expect(parsePermissions(42)).toEqual([]);
  });

  it('debería retornar array vacío para un objeto (no-array, no-string)', () => {
    expect(parsePermissions({ not: 'an-array' })).toEqual([]);
  });
});
