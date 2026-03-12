import { describe, it, expect } from 'vitest';
import { TenantId } from '../value-objects/tenant-id';

describe('TenantId', () => {
  // --- Creación ---

  it('debería generar un UUID v4 válido con create()', () => {
    const tenantId = TenantId.create();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(tenantId.toValue()).toMatch(uuidV4Regex);
  });

  it('debería crear un TenantId a partir de un UUID válido con fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const tenantId = TenantId.fromString(raw);

    expect(tenantId.toValue()).toBe(raw);
  });

  it('debería lanzar error con fromString() si el UUID es inválido', () => {
    expect(() => TenantId.fromString('no-es-uuid')).toThrow();
  });

  it('debería lanzar error con fromString() si la cadena está vacía', () => {
    expect(() => TenantId.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro TenantId con el mismo UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id1 = TenantId.fromString(raw);
    const id2 = TenantId.fromString(raw);

    expect(id1.equals(id2)).toBe(true);
  });

  it('debería ser diferente a otro TenantId con distinto UUID', () => {
    const id1 = TenantId.create();
    const id2 = TenantId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  // --- Serialización ---

  it('toString debería devolver el UUID', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const tenantId = TenantId.fromString(raw);

    expect(tenantId.toString()).toBe(raw);
  });
});
