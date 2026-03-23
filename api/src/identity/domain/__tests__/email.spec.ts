import { describe, it, expect } from 'vitest';
import { Email } from '../value-objects/email';

describe('Email', () => {
  // --- Creación con email válido ---

  it('debería crear un Email con una dirección válida', () => {
    const email = Email.create('usuario@ejemplo.com');

    expect(email.value).toBe('usuario@ejemplo.com');
  });

  it('debería crear un Email con subdominio', () => {
    const email = Email.create('usuario@sub.ejemplo.com');

    expect(email.value).toBe('usuario@sub.ejemplo.com');
  });

  it('debería crear un Email con caracteres válidos (+, ., -)', () => {
    const email = Email.create('usuario+tag@ejemplo.com');

    expect(email.value).toBe('usuario+tag@ejemplo.com');
  });

  // --- Normalización ---

  it('debería normalizar a minúsculas', () => {
    const email = Email.create('Usuario@EJEMPLO.COM');

    expect(email.value).toBe('usuario@ejemplo.com');
  });

  it('debería recortar espacios al inicio y al final', () => {
    const email = Email.create('  usuario@ejemplo.com  ');

    expect(email.value).toBe('usuario@ejemplo.com');
  });

  it('debería normalizar combinando mayúsculas y espacios', () => {
    const email = Email.create('  ADMIN@Dominio.ES  ');

    expect(email.value).toBe('admin@dominio.es');
  });

  // --- Rechazo de email inválido ---

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => Email.create('')).toThrow();
  });

  it('debería lanzar error con solo espacios', () => {
    expect(() => Email.create('   ')).toThrow();
  });

  it('debería lanzar error sin arroba (@)', () => {
    expect(() => Email.create('usuarioejemplo.com')).toThrow();
  });

  it('debería lanzar error sin dominio', () => {
    expect(() => Email.create('usuario@')).toThrow();
  });

  it('debería lanzar error sin nombre de usuario', () => {
    expect(() => Email.create('@ejemplo.com')).toThrow();
  });

  it('debería lanzar error sin extensión de dominio', () => {
    expect(() => Email.create('usuario@ejemplo')).toThrow();
  });

  it('debería lanzar error con múltiples arrobas', () => {
    expect(() => Email.create('usuario@@ejemplo.com')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro Email con el mismo valor', () => {
    const email1 = Email.create('usuario@ejemplo.com');
    const email2 = Email.create('usuario@ejemplo.com');

    expect(email1.equals(email2)).toBe(true);
  });

  it('debería ser igual cuando se normalizan al mismo valor', () => {
    const email1 = Email.create('Usuario@Ejemplo.COM');
    const email2 = Email.create('usuario@ejemplo.com');

    expect(email1.equals(email2)).toBe(true);
  });

  it('debería ser diferente a otro Email con distinto valor', () => {
    const email1 = Email.create('usuario1@ejemplo.com');
    const email2 = Email.create('usuario2@ejemplo.com');

    expect(email1.equals(email2)).toBe(false);
  });
});
