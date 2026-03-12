import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type BillingMonthsProps = {
  months: readonly number[];
  [key: string]: unknown;
};

/**
 * Error lanzado cuando los meses de facturación son inválidos.
 */
export class BillingMonthsInvalidError extends Error {
  readonly code = 'FEE_PLAN.INVALID_BILLING_MONTHS';

  constructor(reason: string) {
    super(`Meses de facturación inválidos: ${reason}`);
    this.name = 'BillingMonthsInvalidError';
  }
}

/**
 * Value Object que representa los meses de facturación de un plan de cuota.
 *
 * Invariantes:
 * - Cada mes debe estar entre 1 y 12.
 * - No puede haber meses duplicados.
 * - Los meses se almacenan ordenados de menor a mayor.
 */
export class BillingMonths extends ValueObject<BillingMonthsProps> {
  /** Array de meses de facturación (1-12), ordenados. */
  get months(): readonly number[] {
    return this.props.months;
  }

  /**
   * Crea un BillingMonths validado.
   * @param months Array de meses (1-12).
   */
  static create(months: number[]): Result<BillingMonths, BillingMonthsInvalidError> {
    if (!Array.isArray(months)) {
      return {
        ok: false,
        error: new BillingMonthsInvalidError('Debe ser un array de números.'),
      };
    }

    // Validar que cada mes está entre 1 y 12
    for (const month of months) {
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return {
          ok: false,
          error: new BillingMonthsInvalidError(
            `El mes ${month} no es válido. Cada mes debe ser un entero entre 1 y 12.`,
          ),
        };
      }
    }

    // Verificar duplicados
    const unique = new Set(months);
    if (unique.size !== months.length) {
      return {
        ok: false,
        error: new BillingMonthsInvalidError('No se permiten meses duplicados.'),
      };
    }

    // Ordenar de menor a mayor
    const sorted = [...months].sort((a, b) => a - b);

    return { ok: true, value: new BillingMonths({ months: Object.freeze(sorted) }) };
  }

  /** Crea un BillingMonths vacío (para planes ONE_TIME). */
  static empty(): BillingMonths {
    return new BillingMonths({ months: Object.freeze([]) });
  }

  /** Verifica si un mes específico está incluido en los meses de facturación. */
  includesMonth(month: number): boolean {
    return this.props.months.includes(month);
  }

  /** Indica si no hay meses de facturación configurados. */
  isEmpty(): boolean {
    return this.props.months.length === 0;
  }
}
