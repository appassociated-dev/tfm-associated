import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type StatusChangeReasonProps = {
  value: string;
  [key: string]: unknown;
};

/** Longitud mínima del motivo de cambio de estado. */
const MIN_LENGTH = 3;
/** Longitud máxima del motivo de cambio de estado. */
const MAX_LENGTH = 500;

/**
 * Error lanzado cuando el motivo de cambio de estado es inválido.
 */
export class InvalidStatusChangeReasonError extends Error {
  readonly code = 'MEMBER.INVALID_REASON';

  constructor(reason: string) {
    const trimmed = (reason ?? '').trim();
    let message: string;

    if (!trimmed) {
      message = 'El motivo de cambio de estado no puede estar vacío.';
    } else if (trimmed.length < MIN_LENGTH) {
      message = `El motivo de cambio de estado debe tener al menos ${MIN_LENGTH} caracteres. Recibido: ${trimmed.length}.`;
    } else {
      message = `El motivo de cambio de estado no puede exceder ${MAX_LENGTH} caracteres. Recibido: ${trimmed.length}.`;
    }

    super(message);
    this.name = 'InvalidStatusChangeReasonError';
  }
}

/**
 * Value Object que representa el motivo de un cambio de estado de socio.
 * Invariantes: no vacío, mínimo 3 caracteres, máximo 500 caracteres.
 */
export class StatusChangeReason extends ValueObject<StatusChangeReasonProps> {
  get value(): string {
    return this.props.value;
  }

  /**
   * Crea un StatusChangeReason validado.
   * Elimina espacios al inicio y final antes de validar.
   */
  static create(reason: string): Result<StatusChangeReason, InvalidStatusChangeReasonError> {
    const trimmed = (reason ?? '').trim();

    if (!trimmed || trimmed.length < MIN_LENGTH) {
      return { ok: false, error: new InvalidStatusChangeReasonError(reason) };
    }

    if (trimmed.length > MAX_LENGTH) {
      return { ok: false, error: new InvalidStatusChangeReasonError(reason) };
    }

    return { ok: true, value: new StatusChangeReason({ value: trimmed }) };
  }
}
