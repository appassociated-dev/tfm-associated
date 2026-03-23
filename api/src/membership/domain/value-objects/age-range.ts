import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type AgeRangeProps = {
  min: number | null;
  max: number | null;
  [key: string]: unknown;
};

/** Edad máxima permitida en el sistema. */
const MAX_AGE_LIMIT = 120;

/**
 * Error lanzado cuando el rango de edad es inválido.
 */
export class AgeRangeInvalidError extends Error {
  readonly code = 'MEMBER_TYPE.INVALID_AGE_RANGE';

  constructor(reason: string) {
    super(`Invalid age range: ${reason}`);
    this.name = 'AgeRangeInvalidError';
  }
}

/**
 * Value Object que representa un rango de edad para un tipo de socio.
 * Permite definir edad mínima y/o máxima, ambas opcionales.
 *
 * Invariantes:
 * - min >= 0 (si está definido)
 * - max <= 120 (si está definido)
 * - max > min (si ambos están definidos)
 */
export class AgeRange extends ValueObject<AgeRangeProps> {
  get min(): number | null {
    return this.props.min;
  }

  get max(): number | null {
    return this.props.max;
  }

  /**
   * Crea un AgeRange validado.
   * @param min Edad mínima (inclusive) o null si no hay límite inferior.
   * @param max Edad máxima (inclusive) o null si no hay límite superior.
   */
  static create(min: number | null, max: number | null): Result<AgeRange, AgeRangeInvalidError> {
    if (min !== null && min < 0) {
      return { ok: false, error: new AgeRangeInvalidError('min must be >= 0') };
    }

    if (max !== null && max > MAX_AGE_LIMIT) {
      return {
        ok: false,
        error: new AgeRangeInvalidError(`max must be <= ${MAX_AGE_LIMIT}`),
      };
    }

    if (min !== null && max !== null && min >= max) {
      return { ok: false, error: new AgeRangeInvalidError('max must be greater than min') };
    }

    return { ok: true, value: new AgeRange({ min, max }) };
  }

  /**
   * Evalúa si una edad está incluida en este rango.
   * @param age Edad a evaluar.
   * @returns true si la edad está dentro del rango.
   */
  includes(age: number): boolean {
    if (this.props.min !== null && age < this.props.min) {
      return false;
    }

    if (this.props.max !== null && age > this.props.max) {
      return false;
    }

    return true;
  }
}
