/**
 * Value Object que representa el tipo de plan de cuota.
 * Valores posibles: ONE_TIME (pago único), RECURRING (recurrente).
 */
export class PlanType {
  /** Pago único — se cobra una sola vez. */
  static readonly ONE_TIME = new PlanType('ONE_TIME');

  /** Recurrente — se cobra periódicamente según la frecuencia configurada. */
  static readonly RECURRING = new PlanType('RECURRING');

  /** Valores válidos para el tipo de plan. */
  private static readonly VALID_VALUES = ['ONE_TIME', 'RECURRING'];

  private constructor(private readonly _value: string) {}

  /** Valor textual del tipo de plan. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un PlanType a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): PlanType {
    if (!PlanType.VALID_VALUES.includes(value)) {
      throw new Error(
        `Tipo de plan inválido: '${value}'. Valores válidos: ${PlanType.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'ONE_TIME':
        return PlanType.ONE_TIME;
      case 'RECURRING':
        return PlanType.RECURRING;
      default:
        throw new Error(`Tipo de plan inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro PlanType. */
  equals(other?: PlanType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
