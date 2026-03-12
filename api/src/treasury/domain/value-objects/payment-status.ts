/**
 * Value Object que representa el estado de un pago.
 * Valores posibles: CONFIRMED, ANNULLED.
 */
export class PaymentStatus {
  /** Confirmado. */
  static readonly CONFIRMED = new PaymentStatus('CONFIRMED');

  /** Anulado. */
  static readonly ANNULLED = new PaymentStatus('ANNULLED');

  /** Valores válidos para el estado de pago. */
  private static readonly VALID_VALUES = ['CONFIRMED', 'ANNULLED'];

  private constructor(private readonly _value: string) {}

  /** Valor textual del estado. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un PaymentStatus a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): PaymentStatus {
    if (!PaymentStatus.VALID_VALUES.includes(value)) {
      throw new Error(
        `Estado de pago inválido: '${value}'. Valores válidos: ${PaymentStatus.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'CONFIRMED':
        return PaymentStatus.CONFIRMED;
      case 'ANNULLED':
        return PaymentStatus.ANNULLED;
      default:
        throw new Error(`Estado de pago inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro PaymentStatus. */
  equals(other?: PaymentStatus): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
