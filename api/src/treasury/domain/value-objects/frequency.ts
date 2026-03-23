/**
 * Value Object que representa la frecuencia de cobro de un plan de cuota.
 * Valores posibles: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM.
 */
export class Frequency {
  /** Frecuencia mensual. */
  static readonly MONTHLY = new Frequency('MONTHLY');

  /** Frecuencia trimestral. */
  static readonly QUARTERLY = new Frequency('QUARTERLY');

  /** Frecuencia semestral. */
  static readonly BIANNUAL = new Frequency('BIANNUAL');

  /** Frecuencia anual. */
  static readonly ANNUAL = new Frequency('ANNUAL');

  /** Frecuencia personalizada (meses definidos manualmente). */
  static readonly CUSTOM = new Frequency('CUSTOM');

  /** Valores válidos para la frecuencia. */
  private static readonly VALID_VALUES = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'];

  private constructor(private readonly _value: string) {}

  /** Valor textual de la frecuencia. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea una Frequency a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): Frequency {
    if (!Frequency.VALID_VALUES.includes(value)) {
      throw new Error(
        `Frecuencia inválida: '${value}'. Valores válidos: ${Frequency.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'MONTHLY':
        return Frequency.MONTHLY;
      case 'QUARTERLY':
        return Frequency.QUARTERLY;
      case 'BIANNUAL':
        return Frequency.BIANNUAL;
      case 'ANNUAL':
        return Frequency.ANNUAL;
      case 'CUSTOM':
        return Frequency.CUSTOM;
      default:
        throw new Error(`Frecuencia inválida: '${value}'`);
    }
  }

  /** Compara igualdad con otra Frequency. */
  equals(other?: Frequency): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
