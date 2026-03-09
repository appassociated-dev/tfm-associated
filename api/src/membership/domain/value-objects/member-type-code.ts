import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type MemberTypeCodeProps = {
  value: string;
  [key: string]: unknown;
};

/** Expresión regular para validar el formato del código: 2-10 caracteres alfanuméricos o guion bajo. */
const CODE_REGEX = /^[A-Z0-9_]{2,10}$/;

/**
 * Error lanzado cuando el formato del código de tipo de socio es inválido.
 */
export class MemberTypeCodeInvalidError extends Error {
  readonly code = 'MEMBER_TYPE.INVALID_CODE';

  constructor(value: string) {
    super(
      `Invalid member type code: "${value}". Must be 2-10 uppercase alphanumeric characters or underscores [A-Z0-9_].`,
    );
    this.name = 'MemberTypeCodeInvalidError';
  }
}

/**
 * Value Object que representa el código único de un tipo de socio.
 * Formato: 2-10 caracteres alfanuméricos en mayúscula o guion bajo [A-Z0-9_].
 */
export class MemberTypeCode extends ValueObject<MemberTypeCodeProps> {
  get value(): string {
    return this.props.value;
  }

  /**
   * Crea un MemberTypeCode validado.
   * Convierte a mayúsculas automáticamente antes de validar.
   */
  static create(value: string): Result<MemberTypeCode, MemberTypeCodeInvalidError> {
    const normalized = (value ?? '').toUpperCase();

    if (!CODE_REGEX.test(normalized)) {
      return { ok: false, error: new MemberTypeCodeInvalidError(value) };
    }

    return { ok: true, value: new MemberTypeCode({ value: normalized }) };
  }
}
