/**
 * Value Object que representa el estado de un socio.
 * Estados posibles: ACTIVE, PENDING_PAYMENT, SUSPENDED, APPLICANT,
 * VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, DECEASED.
 */
export class MemberStatus {
  /** Estado activo — plenos derechos. */
  static readonly ACTIVE = new MemberStatus('ACTIVE');

  /** Estado pendiente de pago — derechos limitados (sin voto). */
  static readonly PENDING_PAYMENT = new MemberStatus('PENDING_PAYMENT');

  /** Estado suspendido — sin derechos. */
  static readonly SUSPENDED = new MemberStatus('SUSPENDED');

  /** Estado aspirante — sin derechos (en proceso de alta). */
  static readonly APPLICANT = new MemberStatus('APPLICANT');

  /** Baja voluntaria — terminal rehabilitable. */
  static readonly VOLUNTARY_LEAVE = new MemberStatus('VOLUNTARY_LEAVE');

  /** Baja por impago — terminal rehabilitable. */
  static readonly NONPAYMENT_LEAVE = new MemberStatus('NONPAYMENT_LEAVE');

  /** Baja disciplinaria — terminal inmutable. */
  static readonly DISCIPLINARY_LEAVE = new MemberStatus('DISCIPLINARY_LEAVE');

  /** Fallecido — terminal inmutable. */
  static readonly DECEASED = new MemberStatus('DECEASED');

  /** Valores válidos para el estado del socio. */
  private static readonly VALID_VALUES = [
    'ACTIVE',
    'PENDING_PAYMENT',
    'SUSPENDED',
    'APPLICANT',
    'VOLUNTARY_LEAVE',
    'NONPAYMENT_LEAVE',
    'DISCIPLINARY_LEAVE',
    'DECEASED',
  ];

  private constructor(private readonly _value: string) {}

  /** Valor textual del estado. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un MemberStatus a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): MemberStatus {
    if (!MemberStatus.VALID_VALUES.includes(value)) {
      throw new Error(
        `Estado de socio inválido: '${value}'. Valores válidos: ${MemberStatus.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'ACTIVE':
        return MemberStatus.ACTIVE;
      case 'PENDING_PAYMENT':
        return MemberStatus.PENDING_PAYMENT;
      case 'SUSPENDED':
        return MemberStatus.SUSPENDED;
      case 'APPLICANT':
        return MemberStatus.APPLICANT;
      case 'VOLUNTARY_LEAVE':
        return MemberStatus.VOLUNTARY_LEAVE;
      case 'NONPAYMENT_LEAVE':
        return MemberStatus.NONPAYMENT_LEAVE;
      case 'DISCIPLINARY_LEAVE':
        return MemberStatus.DISCIPLINARY_LEAVE;
      case 'DECEASED':
        return MemberStatus.DECEASED;
      default:
        throw new Error(`Estado de socio inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro MemberStatus. */
  equals(other?: MemberStatus): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
