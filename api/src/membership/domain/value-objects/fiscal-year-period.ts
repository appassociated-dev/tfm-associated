import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Error de dominio lanzado cuando el periodo del ejercicio fiscal es inválido.
 */
export class FiscalYearPeriodInvalidError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR_PERIOD.INVALID';

  constructor(reason: string) {
    super(`Periodo de ejercicio fiscal inválido: ${reason}`);
    this.name = 'FiscalYearPeriodInvalidError';
  }
}

/** Propiedades internas del Value Object FiscalYearPeriod. */
interface FiscalYearPeriodProps extends Record<string, unknown> {
  startDate: Date;
  endDate: Date;
}

/**
 * Value Object que representa el periodo temporal de un ejercicio fiscal.
 * Garantiza que la fecha de inicio es anterior a la fecha de fin.
 */
export class FiscalYearPeriod extends ValueObject<FiscalYearPeriodProps> {
  private constructor(props: FiscalYearPeriodProps) {
    super(props);
  }

  /** Fecha de inicio del periodo. */
  get startDate(): Date {
    return this.props.startDate;
  }

  /** Fecha de fin del periodo. */
  get endDate(): Date {
    return this.props.endDate;
  }

  /**
   * Crea un nuevo FiscalYearPeriod con validación de invariantes.
   * @param startDate Fecha de inicio del periodo.
   * @param endDate Fecha de fin del periodo.
   */
  static create(
    startDate: Date,
    endDate: Date,
  ): Result<FiscalYearPeriod, FiscalYearPeriodInvalidError> {
    // Validar que sean fechas válidas
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      return {
        ok: false,
        error: new FiscalYearPeriodInvalidError('La fecha de inicio no es una fecha válida.'),
      };
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      return {
        ok: false,
        error: new FiscalYearPeriodInvalidError('La fecha de fin no es una fecha válida.'),
      };
    }

    // Validar que startDate < endDate
    if (startDate >= endDate) {
      return {
        ok: false,
        error: new FiscalYearPeriodInvalidError(
          'La fecha de inicio debe ser anterior a la fecha de fin.',
        ),
      };
    }

    return { ok: true, value: new FiscalYearPeriod({ startDate, endDate }) };
  }

  /**
   * Determina si este periodo se solapa con otro.
   * Dos periodos se solapan si el inicio de uno es anterior o igual al fin del otro y viceversa.
   */
  overlaps(other: FiscalYearPeriod): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  /**
   * Determina si una fecha dada está contenida dentro del periodo.
   * Incluye los extremos (inicio y fin).
   */
  containsDate(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }
}
