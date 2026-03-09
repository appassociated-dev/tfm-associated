import { describe, it, expect } from 'vitest';
import { MemberTypeId } from '../value-objects/member-type-id';

describe('MemberTypeId', () => {
  // --- Creación ---

  it('debería generar un UUID v4 válido con create()', () => {
    const id = MemberTypeId.create();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id.toValue()).toMatch(uuidV4Regex);
  });

  it('debería crear un MemberTypeId a partir de un UUID válido con fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = MemberTypeId.fromString(raw);

    expect(id.toValue()).toBe(raw);
  });

  it('debería lanzar error con fromString() si el UUID es inválido', () => {
    expect(() => MemberTypeId.fromString('no-es-uuid')).toThrow();
  });

  it('debería lanzar error con fromString() si la cadena está vacía', () => {
    expect(() => MemberTypeId.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro MemberTypeId con el mismo UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id1 = MemberTypeId.fromString(raw);
    const id2 = MemberTypeId.fromString(raw);

    expect(id1.equals(id2)).toBe(true);
  });

  it('debería ser diferente a otro MemberTypeId con distinto UUID', () => {
    const id1 = MemberTypeId.create();
    const id2 = MemberTypeId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  // --- Serialización ---

  it('toString debería devolver el UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = MemberTypeId.fromString(raw);

    expect(id.toString()).toBe(raw);
  });
});
