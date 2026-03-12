import { ValueObject } from '../../../shared/domain';
import { Money } from './money';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type DiscountProps = {
  typeDiscount: number;
  personalDiscount: number;
  [key: string]: unknown;
};

/**
 * Error lanzado cuando el descuento es inválido.
 */
export class DiscountInvalidError extends Error {
  readonly code = 'SUBSCRIPTION.INVALID_DISCOUNT';

  constructor(reason: string) {
    super(`Descuento inválido: ${reason}`);
    this.name = 'DiscountInvalidError';
  }
}

/**
 * Value Object que representa los descuentos aplicables a una suscripción.
 *
 * Invariantes:
 * - typeDiscount debe estar en el rango [0, 0.99].
 * - personalDiscount debe estar en el rango [0, 0.99].
 * - La tasa de descuento efectiva combinada debe ser menor al 99%.
 *
 * El descuento se aplica de forma multiplicativa:
 * importeFinal = importeBase * (1 - typeDiscount) * (1 - personalDiscount)
 */
export class Discount extends ValueObject<DiscountProps> {
  /** Descuento por tipo de socio (0 a 0.99). */
  get typeDiscount(): number {
    return this.props.typeDiscount;
  }

  /** Descuento personal (0 a 0.99). */
  get personalDiscount(): number {
    return this.props.personalDiscount;
  }

  /**
   * Crea un Discount validado.
   * @param typeDiscount Descuento por tipo de socio (0 a 0.99).
   * @param personalDiscount Descuento personal (0 a 0.99).
   */
  static create(
    typeDiscount: number,
    personalDiscount: number,
  ): Result<Discount, DiscountInvalidError> {
    if (typeDiscount < 0 || typeDiscount > 0.99) {
      return {
        ok: false,
        error: new DiscountInvalidError(
          `El descuento por tipo debe estar entre 0 y 0.99. Valor recibido: ${typeDiscount}`,
        ),
      };
    }

    if (personalDiscount < 0 || personalDiscount > 0.99) {
      return {
        ok: false,
        error: new DiscountInvalidError(
          `El descuento personal debe estar entre 0 y 0.99. Valor recibido: ${personalDiscount}`,
        ),
      };
    }

    /* Verificar que la tasa efectiva combinada no alcance el 99% o más */
    const effectiveRate = 1 - (1 - typeDiscount) * (1 - personalDiscount);
    if (effectiveRate >= 0.99) {
      return {
        ok: false,
        error: new DiscountInvalidError(
          `El descuento total no puede ser 99% o superior. Descuento efectivo: ${(effectiveRate * 100).toFixed(2)}%`,
        ),
      };
    }

    return {
      ok: true,
      value: new Discount({ typeDiscount, personalDiscount }),
    };
  }

  /**
   * Calcula el importe efectivo tras aplicar los descuentos de forma multiplicativa.
   * Fórmula: importeBase * (1 - typeDiscount) * (1 - personalDiscount)
   * El resultado se redondea al centavo más cercano.
   */
  calculateEffectiveAmount(baseAmount: Money): Money {
    const effectiveCents = Math.round(
      baseAmount.amount * (1 - this.props.typeDiscount) * (1 - this.props.personalDiscount),
    );

    const result = Money.create(effectiveCents, baseAmount.currency);
    if (!result.ok) {
      /* No debería ocurrir si el importe base es válido */
      throw new Error(`Error inesperado al calcular importe efectivo: ${result.error.message}`);
    }
    return result.value;
  }

  /** Devuelve la tasa de descuento efectiva total (combinación multiplicativa). */
  totalEffectiveRate(): number {
    return 1 - (1 - this.props.typeDiscount) * (1 - this.props.personalDiscount);
  }
}
