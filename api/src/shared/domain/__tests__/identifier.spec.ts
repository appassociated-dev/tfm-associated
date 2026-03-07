import { describe, it, expect } from 'vitest';
import { Identifier } from '../identifier.base';

describe('Identifier', () => {
  // --- Creación ---

  it('debería generar un UUID v4 válido cuando no se proporciona valor', () => {
    const id = new Identifier();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id.toValue()).toMatch(uuidV4Regex);
  });

  it('debería aceptar un UUID válido como argumento', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = new Identifier(raw);

    expect(id.toValue()).toBe(raw);
  });

  it('debería lanzar error con un valor que no es UUID', () => {
    expect(() => new Identifier('no-es-uuid')).toThrow(
      'Identificador inválido',
    );
  });

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => new Identifier('')).toThrow('Identificador inválido');
  });

  // --- Igualdad ---

  it('debería ser igual a otro Identifier con el mismo UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id1 = new Identifier(raw);
    const id2 = new Identifier(raw);

    expect(id1.equals(id2)).toBe(true);
  });

  it('debería ser diferente a otro Identifier con distinto UUID', () => {
    const id1 = new Identifier();
    const id2 = new Identifier();

    expect(id1.equals(id2)).toBe(false);
  });

  it('debería devolver false al comparar con undefined', () => {
    const id = new Identifier();

    expect(id.equals(undefined)).toBe(false);
  });

  // --- Serialización ---

  it('toString debería devolver la misma cadena que toValue', () => {
    const id = new Identifier();

    expect(id.toString()).toBe(id.toValue());
  });

  it('toString debería devolver el UUID proporcionado', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = new Identifier(raw);

    expect(id.toString()).toBe(raw);
  });
});
