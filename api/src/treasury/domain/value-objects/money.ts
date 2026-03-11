import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type MoneyProps = {
  amount: number;
  currency: string;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando el importe monetario es inválido.
 */
export class MoneyInvalidError extends Error {
  readonly code = 'FEE_PLAN.INVALID_MONEY';

  constructor(reason: string) {
    super(`Importe monetario inválido: ${reason}`);
    this.name = 'MoneyInvalidError';
  }
}

/**
 * Value Object que representa un importe monetario en centavos.
 *
 * Invariantes:
 * - amount debe ser un entero >= 0 (en centavos).
 * - currency debe ser un código ISO 4217 de 3 caracteres (por defecto EUR).
 */
export class Money extends ValueObject<MoneyProps> {
  /** Importe en centavos. */
  get amount(): number {
    return this.props.amount;
  }

  /** Código de divisa ISO 4217. */
  get currency(): string {
    return this.props.currency;
  }

  /**
   * Crea un Money validado.
   * @param amount Importe en centavos (entero >= 0).
   * @param currency Código de divisa (por defecto 'EUR').
   */
  static create(amount: number, currency = 'EUR'): Result<Money, MoneyInvalidError> {
    if (!Number.isInteger(amount)) {
      return {
        ok: false,
        error: new MoneyInvalidError('El importe debe ser un número entero (centavos).'),
      };
    }

    if (amount < 0) {
      return {
        ok: false,
        error: new MoneyInvalidError('El importe no puede ser negativo.'),
      };
    }

    const normalizedCurrency = (currency ?? '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return {
        ok: false,
        error: new MoneyInvalidError(
          `Código de divisa inválido: "${currency}". Debe ser un código ISO 4217 de 3 letras.`,
        ),
      };
    }

    return { ok: true, value: new Money({ amount, currency: normalizedCurrency }) };
  }

  /** Convierte el importe de centavos a unidades (e.g., 1500 → 15.00). */
  toUnits(): number {
    return this.props.amount / 100;
  }

  /** Suma otro Money del mismo tipo de divisa. */
  add(other: Money): Result<Money, MoneyInvalidError> {
    if (this.props.currency !== other.props.currency) {
      return {
        ok: false,
        error: new MoneyInvalidError(
          `No se pueden sumar importes de distintas divisas: ${this.props.currency} y ${other.props.currency}.`,
        ),
      };
    }
    return Money.create(this.props.amount + other.props.amount, this.props.currency);
  }

  /** Resta otro Money del mismo tipo de divisa. */
  subtract(other: Money): Result<Money, MoneyInvalidError> {
    if (this.props.currency !== other.props.currency) {
      return {
        ok: false,
        error: new MoneyInvalidError(
          `No se pueden restar importes de distintas divisas: ${this.props.currency} y ${other.props.currency}.`,
        ),
      };
    }
    const result = this.props.amount - other.props.amount;
    if (result < 0) {
      return {
        ok: false,
        error: new MoneyInvalidError('El resultado de la resta no puede ser negativo.'),
      };
    }
    return Money.create(result, this.props.currency);
  }

  /** Multiplica el importe por un factor entero positivo. */
  multiply(factor: number): Result<Money, MoneyInvalidError> {
    if (!Number.isInteger(factor) || factor < 0) {
      return {
        ok: false,
        error: new MoneyInvalidError('El factor de multiplicación debe ser un entero >= 0.'),
      };
    }
    return Money.create(this.props.amount * factor, this.props.currency);
  }
}
