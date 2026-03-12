import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type FeePlanCodeProps = {
  value: string;
  [key: string]: unknown;
};

/** Expresión regular para validar el formato del código: 2-20 caracteres [A-Z0-9_-]. */
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

/**
 * Error lanzado cuando el formato del código de plan de cuota es inválido.
 */
export class FeePlanCodeInvalidError extends Error {
  readonly code = 'FEE_PLAN.INVALID_CODE';

  constructor(value: string) {
    super(
      `Código de plan de cuota inválido: "${value}". Debe tener 2-20 caracteres alfanuméricos en mayúscula, guiones bajos o guiones [A-Z0-9_-].`,
    );
    this.name = 'FeePlanCodeInvalidError';
  }
}

/**
 * Value Object que representa el código único de un plan de cuota.
 * Formato: 2-20 caracteres [A-Z0-9_-].
 */
export class FeePlanCode extends ValueObject<FeePlanCodeProps> {
  get value(): string {
    return this.props.value;
  }

  /**
   * Crea un FeePlanCode validado.
   * Convierte a mayúsculas automáticamente antes de validar.
   */
  static create(value: string): Result<FeePlanCode, FeePlanCodeInvalidError> {
    const normalized = (value ?? '').toUpperCase();

    if (!CODE_REGEX.test(normalized)) {
      return { ok: false, error: new FeePlanCodeInvalidError(value) };
    }

    return { ok: true, value: new FeePlanCode({ value: normalized }) };
  }
}
