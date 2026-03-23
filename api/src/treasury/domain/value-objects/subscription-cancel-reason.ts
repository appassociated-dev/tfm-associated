/**
 * Value Object que representa el motivo de cancelación de una suscripción.
 * Valores posibles: PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION, ONE_TIME_COMPLETED.
 */
export class SubscriptionCancelReason {
  /** Cambio de plan — el socio cambia a otro plan de cuota. */
  static readonly PLAN_CHANGE = new SubscriptionCancelReason('PLAN_CHANGE');

  /** Baja del socio — el socio deja la asociación. */
  static readonly MEMBER_LEAVE = new SubscriptionCancelReason('MEMBER_LEAVE');

  /** Exención — el socio queda exento del pago. */
  static readonly EXEMPTION = new SubscriptionCancelReason('EXEMPTION');

  /** Pago único completado — la cuota de pago único ya fue cobrada. */
  static readonly ONE_TIME_COMPLETED = new SubscriptionCancelReason('ONE_TIME_COMPLETED');

  /** Valores válidos para el motivo de cancelación. */
  private static readonly VALID_VALUES = [
    'PLAN_CHANGE',
    'MEMBER_LEAVE',
    'EXEMPTION',
    'ONE_TIME_COMPLETED',
  ];

  private constructor(private readonly _value: string) {}

  /** Valor textual del motivo de cancelación. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un SubscriptionCancelReason a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): SubscriptionCancelReason {
    if (!SubscriptionCancelReason.VALID_VALUES.includes(value)) {
      throw new Error(
        `Motivo de cancelación inválido: '${value}'. Valores válidos: ${SubscriptionCancelReason.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'PLAN_CHANGE':
        return SubscriptionCancelReason.PLAN_CHANGE;
      case 'MEMBER_LEAVE':
        return SubscriptionCancelReason.MEMBER_LEAVE;
      case 'EXEMPTION':
        return SubscriptionCancelReason.EXEMPTION;
      case 'ONE_TIME_COMPLETED':
        return SubscriptionCancelReason.ONE_TIME_COMPLETED;
      default:
        throw new Error(`Motivo de cancelación inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro SubscriptionCancelReason. */
  equals(other?: SubscriptionCancelReason): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
