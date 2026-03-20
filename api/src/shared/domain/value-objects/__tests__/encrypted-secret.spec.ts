import { describe, it, expect } from 'vitest';
import { EncryptedSecret } from '../encrypted-secret';

describe('EncryptedSecret', () => {
  const VALID_CIPHERTEXT = 'dGVzdC1jaXBoZXJ0ZXh0:YXV0aFRhZw==:ZW5jcnlwdGVk';

  // --- Creación desde ciphertext válido ---

  it('debería crear una instancia desde un ciphertext válido', () => {
    const secret = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret).toBeInstanceOf(EncryptedSecret);
  });

  it('debería retornar el ciphertext original con toCipherText()', () => {
    const secret = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret.toCipherText()).toBe(VALID_CIPHERTEXT);
  });

  // --- Seguridad en toString() ---

  it('debería retornar [ENCRYPTED] en toString() para prevenir logging accidental', () => {
    const secret = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret.toString()).toBe('[ENCRYPTED]');
    expect(`${secret}`).toBe('[ENCRYPTED]');
  });

  it('no debería exponer el ciphertext en toString()', () => {
    const secret = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret.toString()).not.toContain(VALID_CIPHERTEXT);
  });

  // --- Validación: rechaza cadenas vacías ---

  it('debería lanzar error al intentar crear con cadena vacía', () => {
    expect(() => EncryptedSecret.fromCipherText('')).toThrow();
  });

  // --- Validación: rechaza cadenas de solo espacios ---

  it('debería lanzar error al intentar crear con solo espacios en blanco', () => {
    expect(() => EncryptedSecret.fromCipherText('   ')).toThrow();
    expect(() => EncryptedSecret.fromCipherText('\t\n')).toThrow();
  });

  // --- Igualdad de Value Objects ---

  it('debería ser igual a otra instancia con el mismo ciphertext', () => {
    const secret1 = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);
    const secret2 = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret1.equals(secret2)).toBe(true);
  });

  it('debería ser diferente a otra instancia con distinto ciphertext', () => {
    const secret1 = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);
    const secret2 = EncryptedSecret.fromCipherText('otro-ciphertext-diferente');

    expect(secret1.equals(secret2)).toBe(false);
  });

  it('debería retornar false al comparar con undefined', () => {
    const secret = EncryptedSecret.fromCipherText(VALID_CIPHERTEXT);

    expect(secret.equals(undefined)).toBe(false);
  });
});
