/**
 * Value Object que representa el estado de un cargo.
 * Valores posibles: PENDING, PAID, PARTIALLY_PAID, RETURNED, CANCELLED.
 */
export class ChargeStatus {
  /** Pendiente de cobro. */
  static readonly PENDING = new ChargeStatus('PENDING');

  /** Cobrado completamente. */
  static readonly PAID = new ChargeStatus('PAID');

  /** Cobrado parcialmente. */
  static readonly PARTIALLY_PAID = new ChargeStatus('PARTIALLY_PAID');

  /** Devuelto (recibo devuelto). */
  static readonly RETURNED = new ChargeStatus('RETURNED');

  /** Cancelado. */
  static readonly CANCELLED = new ChargeStatus('CANCELLED');

  /** Valores válidos para el estado de cargo. */
  private static readonly VALID_VALUES = [
    'PENDING',
    'PAID',
    'PARTIALLY_PAID',
    'RETURNED',
    'CANCELLED',
  ];

  private constructor(private readonly _value: string) {}

  /** Valor textual del estado. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un ChargeStatus a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): ChargeStatus {
    if (!ChargeStatus.VALID_VALUES.includes(value)) {
      throw new Error(
        `Estado de cargo inválido: '${value}'. Valores válidos: ${ChargeStatus.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'PENDING':
        return ChargeStatus.PENDING;
      case 'PAID':
        return ChargeStatus.PAID;
      case 'PARTIALLY_PAID':
        return ChargeStatus.PARTIALLY_PAID;
      case 'RETURNED':
        return ChargeStatus.RETURNED;
      case 'CANCELLED':
        return ChargeStatus.CANCELLED;
      default:
        throw new Error(`Estado de cargo inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro ChargeStatus. */
  equals(other?: ChargeStatus): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
