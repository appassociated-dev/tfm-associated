import { describe, it, expect } from 'vitest';
import { UserId } from '../value-objects/user-id';

describe('UserId', () => {
  // --- Creación ---

  it('debería generar un UUID v4 válido con create()', () => {
    const userId = UserId.create();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(userId.toValue()).toMatch(uuidV4Regex);
  });

  it('debería crear un UserId a partir de un UUID válido con fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const userId = UserId.fromString(raw);

    expect(userId.toValue()).toBe(raw);
  });

  it('debería lanzar error con fromString() si el UUID es inválido', () => {
    expect(() => UserId.fromString('no-es-uuid')).toThrow();
  });

  it('debería lanzar error con fromString() si la cadena está vacía', () => {
    expect(() => UserId.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro UserId con el mismo UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id1 = UserId.fromString(raw);
    const id2 = UserId.fromString(raw);

    expect(id1.equals(id2)).toBe(true);
  });

  it('debería ser diferente a otro UserId con distinto UUID', () => {
    const id1 = UserId.create();
    const id2 = UserId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  // --- Serialización ---

  it('toString debería devolver el UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const userId = UserId.fromString(raw);

    expect(userId.toString()).toBe(raw);
  });
});
