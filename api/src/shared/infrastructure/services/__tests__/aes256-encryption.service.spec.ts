import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Aes256EncryptionService } from '../aes256-encryption.service';

describe('Aes256EncryptionService (shared)', () => {
  // Clave AES-256 válida: 32 bytes = 64 caracteres hexadecimales
  const VALID_KEY = 'a'.repeat(64);
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  it('debería cifrar y descifrar correctamente (roundtrip)', async () => {
    const service = new Aes256EncryptionService();
    const plainText = 'ES9121000418450200051332';

    const encrypted = await service.encrypt(plainText);
    const decrypted = await service.decrypt(encrypted);

    expect(decrypted).toBe(plainText);
    expect(encrypted).not.toBe(plainText);
  });

  it('debería generar IVs diferentes en cada cifrado', async () => {
    const service = new Aes256EncryptionService();
    const plainText = 'ES9121000418450200051332';

    const encrypted1 = await service.encrypt(plainText);
    const encrypted2 = await service.encrypt(plainText);

    // Los cifrados deben ser diferentes (IV aleatorio)
    expect(encrypted1).not.toBe(encrypted2);

    // Pero ambos deben descifrar al mismo texto
    expect(await service.decrypt(encrypted1)).toBe(plainText);
    expect(await service.decrypt(encrypted2)).toBe(plainText);
  });

  it('debería almacenar en formato iv:authTag:cipherText', async () => {
    const service = new Aes256EncryptionService();
    const encrypted = await service.encrypt('test');

    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);

    // Verificar que cada parte es base64 válido
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  it('debería lanzar error si ENCRYPTION_KEY no está definida', () => {
    delete process.env.ENCRYPTION_KEY;

    expect(() => new Aes256EncryptionService()).toThrow();
  });

  it('debería lanzar error si ENCRYPTION_KEY tiene longitud incorrecta', () => {
    process.env.ENCRYPTION_KEY = 'abcdef';

    expect(() => new Aes256EncryptionService()).toThrow();
  });

  it('debería lanzar error si el texto cifrado es inválido', async () => {
    const service = new Aes256EncryptionService();

    await expect(service.decrypt('invalid-cipher-text')).rejects.toThrow();
  });

  it('debería cifrar cadenas vacías correctamente', async () => {
    const service = new Aes256EncryptionService();
    const encrypted = await service.encrypt('');
    const decrypted = await service.decrypt(encrypted);

    expect(decrypted).toBe('');
  });

  it('debería manejar caracteres especiales y Unicode', async () => {
    const service = new Aes256EncryptionService();
    const plainText = 'IBAN con acentos: ñ, ü, €';

    const encrypted = await service.encrypt(plainText);
    const decrypted = await service.decrypt(encrypted);

    expect(decrypted).toBe(plainText);
  });
});
