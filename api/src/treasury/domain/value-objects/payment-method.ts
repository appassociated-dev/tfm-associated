/**
 * Value Object que representa el método de pago.
 * Valores posibles: CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV.
 */
export class PaymentMethod {
  /** Efectivo. */
  static readonly CASH = new PaymentMethod('CASH');

  /** Transferencia bancaria. */
  static readonly TRANSFER = new PaymentMethod('TRANSFER');

  /** Bizum. */
  static readonly BIZUM = new PaymentMethod('BIZUM');

  /** Domiciliación SEPA. */
  static readonly SEPA_DIRECT_DEBIT = new PaymentMethod('SEPA_DIRECT_DEBIT');

  /** Tarjeta (TPV físico). */
  static readonly CARD_TPV = new PaymentMethod('CARD_TPV');

  /** Valores válidos para el método de pago. */
  private static readonly VALID_VALUES = [
    'CASH',
    'TRANSFER',
    'BIZUM',
    'SEPA_DIRECT_DEBIT',
    'CARD_TPV',
  ];

  private constructor(private readonly _value: string) {}

  /** Valor textual del método de pago. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un PaymentMethod a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): PaymentMethod {
    if (!PaymentMethod.VALID_VALUES.includes(value)) {
      throw new Error(
        `Método de pago inválido: '${value}'. Valores válidos: ${PaymentMethod.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'CASH':
        return PaymentMethod.CASH;
      case 'TRANSFER':
        return PaymentMethod.TRANSFER;
      case 'BIZUM':
        return PaymentMethod.BIZUM;
      case 'SEPA_DIRECT_DEBIT':
        return PaymentMethod.SEPA_DIRECT_DEBIT;
      case 'CARD_TPV':
        return PaymentMethod.CARD_TPV;
      default:
        throw new Error(`Método de pago inválido: '${value}'`);
    }
  }

  /**
   * Devuelve el prefijo corto del método de pago para generar referencias.
   * CASH→'EF', TRANSFER→'TR', BIZUM→'BZ', SEPA_DIRECT_DEBIT→'SEPA', CARD_TPV→'TPV'
   */
  static toPrefix(method: PaymentMethod): string {
    switch (method.value) {
      case 'CASH':
        return 'EF';
      case 'TRANSFER':
        return 'TR';
      case 'BIZUM':
        return 'BZ';
      case 'SEPA_DIRECT_DEBIT':
        return 'SEPA';
      case 'CARD_TPV':
        return 'TPV';
      default:
        throw new Error(`Prefijo no definido para método de pago: '${method.value}'`);
    }
  }

  /**
   * Devuelve la etiqueta legible en español del método de pago.
   */
  static toLabel(method: PaymentMethod): string {
    switch (method.value) {
      case 'CASH':
        return 'Efectivo';
      case 'TRANSFER':
        return 'Transferencia bancaria';
      case 'BIZUM':
        return 'Bizum';
      case 'SEPA_DIRECT_DEBIT':
        return 'Domiciliación SEPA';
      case 'CARD_TPV':
        return 'Tarjeta (TPV)';
      default:
        throw new Error(`Etiqueta no definida para método de pago: '${method.value}'`);
    }
  }

  /** Compara igualdad con otro PaymentMethod. */
  equals(other?: PaymentMethod): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
