import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EncryptionService } from '../../domain/ports/encryption-service.port';

/** Algoritmo de cifrado utilizado (AES-256-GCM según RNF-006). */
const ALGORITHM = 'aes-256-gcm';
/** Tamaño del IV en bytes (96 bits recomendado para GCM). */
const IV_LENGTH = 12;
/** Tamaño del auth tag en bytes. */
const AUTH_TAG_LENGTH = 16;
/** Longitud esperada de la clave en caracteres hexadecimales (32 bytes = 64 hex). */
const KEY_HEX_LENGTH = 64;

/**
 * Servicio de cifrado AES-256-GCM para datos sensibles (RNF-006).
 * Implementa el puerto EncryptionService del dominio.
 *
 * - Clave de 32 bytes obtenida de process.env.ENCRYPTION_KEY (64 hex chars).
 * - IV aleatorio de 12 bytes generado por cada cifrado.
 * - Formato de almacenamiento: iv:authTag:cipherText (en base64).
 */
@Injectable()
export class Aes256EncryptionService implements EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
      throw new Error(
        'ENCRYPTION_KEY no está definida. Se requiere una clave hexadecimal de 64 caracteres (32 bytes).',
      );
    }

    if (keyHex.length !== KEY_HEX_LENGTH) {
      throw new Error(
        `ENCRYPTION_KEY debe tener ${KEY_HEX_LENGTH} caracteres hexadecimales (32 bytes). Actual: ${keyHex.length}.`,
      );
    }

    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Cifra un texto plano con AES-256-GCM.
   * @param plainText Texto a cifrar.
   * @returns Texto cifrado en formato iv:authTag:cipherText (base64).
   */
  async encrypt(plainText: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:cipherText (cada parte en base64)
    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      ':',
    );
  }

  /**
   * Descifra un texto cifrado con AES-256-GCM.
   * @param cipherText Texto cifrado en formato iv:authTag:cipherText (base64).
   * @returns Texto plano descifrado.
   */
  async decrypt(cipherText: string): Promise<string> {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Formato de texto cifrado inválido. Esperado: iv:authTag:cipherText (base64).',
      );
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  }
}
