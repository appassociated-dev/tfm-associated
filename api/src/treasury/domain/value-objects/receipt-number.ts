import { ValueObject } from '../../../shared/domain';

type ReceiptNumberProps = {
  value: string;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando el número de recibo es inválido.
 */
export class ReceiptNumberInvalidError extends Error {
  readonly code = 'PAYMENT.INVALID_RECEIPT_NUMBER';

  constructor(reason: string) {
    super(`Número de recibo inválido: ${reason}`);
    this.name = 'ReceiptNumberInvalidError';
  }
}

/**
 * Value Object que representa el número de recibo.
 * Formato: REC-{YEAR}-{SEQUENCE:5} (ej: REC-2025-00042)
 *
 * Invariante: el número de recibo no puede estar vacío.
 */
export class ReceiptNumber extends ValueObject<ReceiptNumberProps> {
  /** Valor del número de recibo. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Genera un número de recibo con formato REC-{YEAR}-{SEQUENCE:5}.
   * @param year Año del recibo.
   * @param sequence Número secuencial (se rellena con ceros hasta 5 dígitos).
   */
  static generate(year: number, sequence: number): ReceiptNumber {
    const paddedSequence = String(sequence).padStart(5, '0');
    const value = `REC-${year}-${paddedSequence}`;
    return new ReceiptNumber({ value });
  }

  /**
   * Crea un ReceiptNumber a partir de un string existente (reconstitución).
   * @throws ReceiptNumberInvalidError si el valor está vacío.
   */
  static fromString(value: string): ReceiptNumber {
    const trimmed = (value ?? '').trim();

    if (trimmed.length === 0) {
      throw new ReceiptNumberInvalidError('El número de recibo no puede estar vacío.');
    }

    return new ReceiptNumber({ value: trimmed });
  }
}
