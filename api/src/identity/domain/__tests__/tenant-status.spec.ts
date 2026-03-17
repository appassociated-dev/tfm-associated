import { describe, it, expect } from 'vitest';
import { TenantStatus } from '../value-objects/tenant-status';

describe('TenantStatus', () => {
  // --- Creación ---

  it.each([
    ['ACTIVE', TenantStatus.active()],
    ['SUSPENDED', TenantStatus.suspended()],
    ['DEPROVISIONED', TenantStatus.deprovisioned()],
  ])('debería crear un estado %s', (expected, status) => {
    expect(status.value).toBe(expected);
  });

  it.each([['ACTIVE'], ['SUSPENDED'], ['DEPROVISIONED']])(
    'debería crear un estado a partir del string válido "%s"',
    (value) => {
      const status = TenantStatus.fromString(value);
      expect(status.value).toBe(value);
    },
  );

  it('debería lanzar error con un valor inválido', () => {
    expect(() => TenantStatus.fromString('INVALID')).toThrow();
  });

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => TenantStatus.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro TenantStatus con el mismo valor', () => {
    const status1 = TenantStatus.active();
    const status2 = TenantStatus.active();

    expect(status1.equals(status2)).toBe(true);
  });

  it('debería ser diferente a otro TenantStatus con distinto valor', () => {
    const status1 = TenantStatus.active();
    const status2 = TenantStatus.suspended();

    expect(status1.equals(status2)).toBe(false);
  });
});
