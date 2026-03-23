import { describe, it, expect } from 'vitest';
import { PasswordHash } from '../value-objects/password-hash';

describe('PasswordHash', () => {
  // --- Creación ---

  it('debería crear un PasswordHash a partir de un hash existente', () => {
    const hash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const passwordHash = PasswordHash.fromHash(hash);

    expect(passwordHash.value).toBe(hash);
  });

  it('debería lanzar error con un hash vacío', () => {
    expect(() => PasswordHash.fromHash('')).toThrow();
  });

  // --- Seguridad ---

  it('toString debería devolver [REDACTED]', () => {
    const hash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const passwordHash = PasswordHash.fromHash(hash);

    expect(passwordHash.toString()).toBe('[REDACTED]');
  });

  it('no debería exponer el hash en toString', () => {
    const hash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const passwordHash = PasswordHash.fromHash(hash);

    expect(passwordHash.toString()).not.toContain(hash);
  });

  // --- Igualdad ---

  it('debería ser igual a otro PasswordHash con el mismo valor', () => {
    const hash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const hash1 = PasswordHash.fromHash(hash);
    const hash2 = PasswordHash.fromHash(hash);

    expect(hash1.equals(hash2)).toBe(true);
  });

  it('debería ser diferente a otro PasswordHash con distinto valor', () => {
    const hash1 = PasswordHash.fromHash('$2b$10$hash1ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef');
    const hash2 = PasswordHash.fromHash('$2b$10$hash2ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef');

    expect(hash1.equals(hash2)).toBe(false);
  });
});
