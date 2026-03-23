import { describe, it, expect } from 'vitest';
import { UserStatus } from '../value-objects/user-status';

describe('UserStatus', () => {
  // --- Creación ---

  it.each([
    ['ACTIVE', UserStatus.active()],
    ['BLOCKED', UserStatus.blocked()],
    ['INACTIVE', UserStatus.inactive()],
  ])('debería crear un estado %s', (expected, status) => {
    expect(status.value).toBe(expected);
  });

  it.each([['ACTIVE'], ['BLOCKED'], ['INACTIVE']])(
    'debería crear un estado a partir del string válido "%s"',
    (value) => {
      const status = UserStatus.fromString(value);
      expect(status.value).toBe(value);
    },
  );

  it('debería lanzar error con un valor inválido', () => {
    expect(() => UserStatus.fromString('INVALID')).toThrow();
  });

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => UserStatus.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro UserStatus con el mismo valor', () => {
    const status1 = UserStatus.active();
    const status2 = UserStatus.active();

    expect(status1.equals(status2)).toBe(true);
  });

  it('debería ser diferente a otro UserStatus con distinto valor', () => {
    const status1 = UserStatus.active();
    const status2 = UserStatus.blocked();

    expect(status1.equals(status2)).toBe(false);
  });
});
