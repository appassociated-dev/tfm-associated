import { ValueObject } from '../value-object.base';

/** Propiedades internas del Value Object EncryptedSecret. */
interface EncryptedSecretProps {
  readonly cipherText: string;
  [key: string]: unknown;
}

/**
 * Value Object que encapsula un secreto cifrado (AES-256-GCM).
 *
 * Previene la exposición accidental del ciphertext en logs y errores:
 * - toString() retorna '[ENCRYPTED]' en lugar del valor real.
 * - toCipherText() debe usarse explícitamente para obtener el valor de persistencia.
 *
 * Cumple RNF-006 (cifrado de datos sensibles en reposo).
 */
export class EncryptedSecret extends ValueObject<EncryptedSecretProps> {
  /**
   * Crea una instancia de EncryptedSecret desde un ciphertext ya cifrado.
   * Valida que el ciphertext no esté vacío ni sea solo espacios en blanco.
   *
   * @param value Ciphertext cifrado (formato iv:authTag:cipherText en base64).
   * @throws Error si el valor es vacío o solo espacios.
   */
  static fromCipherText(value: string): EncryptedSecret {
    if (!value || !value.trim()) {
      throw new Error('EncryptedSecret no puede crearse con un ciphertext vacío o en blanco.');
    }

    return new EncryptedSecret({ cipherText: value });
  }

  /**
   * Retorna el ciphertext real para operaciones de persistencia.
   * Usar con cuidado — solo en capas de infraestructura.
   */
  toCipherText(): string {
    return this.props.cipherText;
  }

  /**
   * Retorna una representación segura para logs y depuración.
   * NUNCA expone el ciphertext real.
   */
  toString(): string {
    return '[ENCRYPTED]';
  }
}
