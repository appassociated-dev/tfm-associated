import { describe, it, expect } from 'vitest';
import { Password } from '../value-objects/password';

describe('Password', () => {
  // --- Creación con contraseña válida ---

  it('debería crear un Password que cumple todos los criterios', () => {
    const password = Password.create('Abcdefg1');

    expect(password.getValue()).toBe('Abcdefg1');
  });

  it('debería crear un Password con caracteres especiales', () => {
    const password = Password.create('P@ssw0rd!');

    expect(password.getValue()).toBe('P@ssw0rd!');
  });

  it('debería crear un Password largo', () => {
    const password = Password.create('MiContraseñaSegura123');

    expect(password.getValue()).toBe('MiContraseñaSegura123');
  });

  // --- Rechazo de contraseña inválida ---

  it('debería lanzar error con contraseña vacía', () => {
    expect(() => Password.create('')).toThrow();
  });

  it('debería lanzar error con menos de 8 caracteres', () => {
    expect(() => Password.create('Ab1cdef')).toThrow();
  });

  it('debería lanzar error sin mayúsculas', () => {
    expect(() => Password.create('abcdefg1')).toThrow();
  });

  it('debería lanzar error sin minúsculas', () => {
    expect(() => Password.create('ABCDEFG1')).toThrow();
  });

  it('debería lanzar error sin dígitos', () => {
    expect(() => Password.create('Abcdefgh')).toThrow();
  });

  it('debería aceptar exactamente 8 caracteres válidos', () => {
    const password = Password.create('Abcdefg1');

    expect(password.getValue()).toBe('Abcdefg1');
  });
});
