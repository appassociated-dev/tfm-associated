import { ValueObject } from '../../../shared/domain';
import { PaymentMethod } from './payment-method';

type PaymentReferenceProps = {
  value: string;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando la referencia de pago es inválida.
 */
export class PaymentReferenceInvalidError extends Error {
  readonly code = 'PAYMENT.INVALID_REFERENCE';

  constructor(reason: string) {
    super(`Referencia de pago inválida: ${reason}`);
    this.name = 'PaymentReferenceInvalidError';
  }
}

/**
 * Value Object que representa la referencia de pago.
 * Formato: {PREFIX}-{YEAR}-{SEQUENCE:5} (ej: EF-2025-00042)
 *
 * Invariante: la referencia no puede estar vacía.
 */
export class PaymentReference extends ValueObject<PaymentReferenceProps> {
  /** Valor de la referencia de pago. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Genera una referencia de pago con formato {PREFIX}-{YEAR}-{SEQUENCE:5}.
   * @param method Método de pago (determina el prefijo).
   * @param year Año del pago.
   * @param sequence Número secuencial (se rellena con ceros hasta 5 dígitos).
   */
  static generate(method: PaymentMethod, year: number, sequence: number): PaymentReference {
    const prefix = PaymentMethod.toPrefix(method);
    const paddedSequence = String(sequence).padStart(5, '0');
    const value = `${prefix}-${year}-${paddedSequence}`;
    return new PaymentReference({ value });
  }

  /**
   * Crea una PaymentReference a partir de un string existente (reconstitución).
   * @throws PaymentReferenceInvalidError si el valor está vacío.
   */
  static fromString(value: string): PaymentReference {
    const trimmed = (value ?? '').trim();

    if (trimmed.length === 0) {
      throw new PaymentReferenceInvalidError('La referencia no puede estar vacía.');
    }

    return new PaymentReference({ value: trimmed });
  }
}
