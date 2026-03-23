/** Token de inyección para el servicio de cifrado (NestJS DI). */
export const ENCRYPTION_SERVICE = Symbol('ENCRYPTION_SERVICE');

/**
 * Puerto del servicio de cifrado para datos sensibles (RNF-006).
 * Implementación en infraestructura con AES-256-GCM.
 * Usado para cifrar/descifrar IBAN, credenciales de tenant, y otros datos sensibles.
 */
export interface EncryptionService {
  /** Cifra un texto plano y retorna el texto cifrado. */
  encrypt(plainText: string): Promise<string>;

  /** Descifra un texto cifrado y retorna el texto plano. */
  decrypt(cipherText: string): Promise<string>;
}
