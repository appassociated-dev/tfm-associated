import { ValueObject } from '../../../shared/domain';

type PasswordHashProps = {
  value: string;
  [key: string]: unknown;
};

/**
 * Value Object opaco que representa un hash de contraseña.
 * Nunca expone el hash en serialización o toString.
 */
export class PasswordHash extends ValueObject<PasswordHashProps> {
  /** Devuelve el valor del hash (solo para uso interno en verificación). */
  get value(): string {
    return this.props.value;
  }

  /** Crea un PasswordHash a partir de un hash ya calculado. */
  static fromHash(hash: string): PasswordHash {
    if (!hash) {
      throw new Error('PasswordHash inválido: el hash no puede estar vacío.');
    }

    return new PasswordHash({ value: hash });
  }

  /** Devuelve [REDACTED] para evitar filtración del hash. */
  override toString(): string {
    return '[REDACTED]';
  }
}
