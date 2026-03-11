import { ValueObject } from '../../../shared/domain';

type ChargeDescriptionProps = {
  description: string;
  fiscalYearId: string | null;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando la descripción del cargo es inválida.
 */
export class ChargeDescriptionInvalidError extends Error {
  readonly code = 'CHARGE.INVALID_DESCRIPTION';

  constructor(reason: string) {
    super(`Descripción de cargo inválida: ${reason}`);
    this.name = 'ChargeDescriptionInvalidError';
  }
}

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Value Object que representa la descripción de un cargo.
 *
 * Invariantes:
 * - description no puede estar vacía.
 * - description no puede exceder 255 caracteres.
 * - fiscalYearId es opcional (null para cargos sin ejercicio asociado).
 */
export class ChargeDescription extends ValueObject<ChargeDescriptionProps> {
  /** Texto descriptivo del cargo. */
  get description(): string {
    return this.props.description;
  }

  /** Identificador del ejercicio fiscal asociado (null si no aplica). */
  get fiscalYearId(): string | null {
    return this.props.fiscalYearId;
  }

  /**
   * Crea una ChargeDescription validada.
   * @param description Texto descriptivo del cargo.
   * @param fiscalYearId Identificador del ejercicio fiscal (opcional).
   */
  static create(
    description: string,
    fiscalYearId?: string | null,
  ): Result<ChargeDescription, ChargeDescriptionInvalidError> {
    const trimmed = (description ?? '').trim();

    if (trimmed.length === 0) {
      return {
        ok: false,
        error: new ChargeDescriptionInvalidError('La descripción no puede estar vacía.'),
      };
    }

    if (trimmed.length > 255) {
      return {
        ok: false,
        error: new ChargeDescriptionInvalidError('La descripción no puede exceder 255 caracteres.'),
      };
    }

    return {
      ok: true,
      value: new ChargeDescription({
        description: trimmed,
        fiscalYearId: fiscalYearId ?? null,
      }),
    };
  }
}
