import { describe, it, expect } from 'vitest';
import { MemberId } from '../value-objects/member-id';

describe('MemberId', () => {
  // --- Creación ---

  it('debería generar un UUID v4 válido con create()', () => {
    const id = MemberId.create();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id.toValue()).toMatch(uuidV4Regex);
  });

  it('debería crear un MemberId a partir de un UUID válido con fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = MemberId.fromString(raw);

    expect(id.toValue()).toBe(raw);
  });

  it('debería lanzar error con fromString() si el UUID es inválido', () => {
    expect(() => MemberId.fromString('no-es-uuid')).toThrow();
  });

  it('debería lanzar error con fromString() si la cadena está vacía', () => {
    expect(() => MemberId.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro MemberId con el mismo UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id1 = MemberId.fromString(raw);
    const id2 = MemberId.fromString(raw);

    expect(id1.equals(id2)).toBe(true);
  });

  it('debería ser diferente a otro MemberId con distinto UUID', () => {
    const id1 = MemberId.create();
    const id2 = MemberId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  // --- Serialización ---

  it('toString debería devolver el UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = MemberId.fromString(raw);

    expect(id.toString()).toBe(raw);
  });
});
