import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type MemberNumberProps = {
  value: string;
  [key: string]: unknown;
};

/** Dígitos mínimos de padding para el número de socio. */
const DEFAULT_PAD_LENGTH = 5;

/**
 * Error lanzado cuando el número de socio es inválido.
 */
export class MemberNumberInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_MEMBER_NUMBER';

  constructor(reason: string) {
    super(`Número de socio inválido: ${reason}`);
    this.name = 'MemberNumberInvalidError';
  }
}

/**
 * Value Object que representa el número de socio.
 * Formato por defecto: cero-padded a 5 dígitos (ej: "00342").
 * Invariante: no vacío.
 */
export class MemberNumber extends ValueObject<MemberNumberProps> {
  get value(): string {
    return this.props.value;
  }

  /**
   * Crea un MemberNumber a partir de un número de secuencia.
   * @param sequence Número secuencial (debe ser >= 1).
   * @param padLength Longitud mínima con cero-padding (por defecto 5).
   */
  static fromSequence(
    sequence: number,
    padLength: number = DEFAULT_PAD_LENGTH,
  ): Result<MemberNumber, MemberNumberInvalidError> {
    if (!Number.isInteger(sequence) || sequence < 1) {
      return {
        ok: false,
        error: new MemberNumberInvalidError('La secuencia debe ser un entero >= 1.'),
      };
    }

    const value = String(sequence).padStart(padLength, '0');
    return { ok: true, value: new MemberNumber({ value }) };
  }

  /**
   * Crea un MemberNumber a partir de un string existente (reconstitución).
   * @param value Valor textual del número de socio.
   */
  static fromString(value: string): Result<MemberNumber, MemberNumberInvalidError> {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return {
        ok: false,
        error: new MemberNumberInvalidError('El número de socio no puede estar vacío.'),
      };
    }

    return { ok: true, value: new MemberNumber({ value: trimmed }) };
  }
}
