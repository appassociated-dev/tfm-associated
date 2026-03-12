import { describe, it, expect } from 'vitest';
import { UserStatus } from '../value-objects/user-status';

describe('UserStatus', () => {
  // --- Creación ---

  it('debería crear un estado ACTIVE', () => {
    const status = UserStatus.active();

    expect(status.value).toBe('ACTIVE');
  });

  it('debería crear un estado BLOCKED', () => {
    const status = UserStatus.blocked();

    expect(status.value).toBe('BLOCKED');
  });

  it('debería crear un estado INACTIVE', () => {
    const status = UserStatus.inactive();

    expect(status.value).toBe('INACTIVE');
  });

  it('debería crear un estado a partir de un string válido', () => {
    const status = UserStatus.fromString('ACTIVE');

    expect(status.value).toBe('ACTIVE');
  });

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

  // --- Todos los valores existen ---

  it('debería tener los tres estados disponibles', () => {
    const active = UserStatus.active();
    const blocked = UserStatus.blocked();
    const inactive = UserStatus.inactive();

    expect(active.value).toBe('ACTIVE');
    expect(blocked.value).toBe('BLOCKED');
    expect(inactive.value).toBe('INACTIVE');
  });
});
