/**
 * Value Object que representa el estado de un ejercicio fiscal.
 * Estados posibles: PREPARATION, OPEN, CLOSED.
 */
export class FiscalYearStatus {
  /** Estado de preparación — el ejercicio aún no ha sido abierto. */
  static readonly PREPARATION = new FiscalYearStatus('PREPARATION');

  /** Estado abierto — el ejercicio está activo y operativo. */
  static readonly OPEN = new FiscalYearStatus('OPEN');

  /** Estado cerrado — el ejercicio ha sido cerrado definitivamente. */
  static readonly CLOSED = new FiscalYearStatus('CLOSED');

  /** Valores válidos para el estado del ejercicio fiscal. */
  private static readonly VALID_VALUES = ['PREPARATION', 'OPEN', 'CLOSED'];

  private constructor(private readonly _value: string) {}

  /** Valor textual del estado. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un FiscalYearStatus a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): FiscalYearStatus {
    if (!FiscalYearStatus.VALID_VALUES.includes(value)) {
      throw new Error(
        `Estado de ejercicio fiscal inválido: '${value}'. Valores válidos: ${FiscalYearStatus.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'PREPARATION':
        return FiscalYearStatus.PREPARATION;
      case 'OPEN':
        return FiscalYearStatus.OPEN;
      case 'CLOSED':
        return FiscalYearStatus.CLOSED;
      default:
        throw new Error(`Estado de ejercicio fiscal inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro FiscalYearStatus. */
  equals(other?: FiscalYearStatus): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
