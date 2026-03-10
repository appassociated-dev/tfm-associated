/**
 * Value Object que representa el tipo de ejercicio fiscal.
 * Tipos posibles: NATURAL_YEAR, SPORTS_SEASON, CONFRATERNITY, CUSTOM.
 */
export class FiscalYearType {
  /** Año natural (enero-diciembre). */
  static readonly NATURAL_YEAR = new FiscalYearType('NATURAL_YEAR');

  /** Temporada deportiva (típicamente agosto-julio). */
  static readonly SPORTS_SEASON = new FiscalYearType('SPORTS_SEASON');

  /** Ejercicio cofrade (normalmente coincide con ciclo litúrgico). */
  static readonly CONFRATERNITY = new FiscalYearType('CONFRATERNITY');

  /** Ejercicio personalizado definido por la entidad. */
  static readonly CUSTOM = new FiscalYearType('CUSTOM');

  /** Valores válidos para el tipo de ejercicio fiscal. */
  private static readonly VALID_VALUES = [
    'NATURAL_YEAR',
    'SPORTS_SEASON',
    'CONFRATERNITY',
    'CUSTOM',
  ];

  private constructor(private readonly _value: string) {}

  /** Valor textual del tipo. */
  get value(): string {
    return this._value;
  }

  /**
   * Crea un FiscalYearType a partir de un string.
   * Lanza error si el valor no es válido.
   */
  static fromString(value: string): FiscalYearType {
    if (!FiscalYearType.VALID_VALUES.includes(value)) {
      throw new Error(
        `Tipo de ejercicio fiscal inválido: '${value}'. Valores válidos: ${FiscalYearType.VALID_VALUES.join(', ')}`,
      );
    }

    switch (value) {
      case 'NATURAL_YEAR':
        return FiscalYearType.NATURAL_YEAR;
      case 'SPORTS_SEASON':
        return FiscalYearType.SPORTS_SEASON;
      case 'CONFRATERNITY':
        return FiscalYearType.CONFRATERNITY;
      case 'CUSTOM':
        return FiscalYearType.CUSTOM;
      default:
        throw new Error(`Tipo de ejercicio fiscal inválido: '${value}'`);
    }
  }

  /** Compara igualdad con otro FiscalYearType. */
  equals(other?: FiscalYearType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
