/**
 * Desglose paso a paso del cálculo de descuento.
 */
export interface DiscountBreakdown {
  /** Importe base en centavos. */
  baseAmount: number;
  /** Descuento por tipo aplicado (0-1, null si no aplica). */
  typeDiscount: number | null;
  /** Importe tras descuento por tipo en centavos. */
  afterTypeDiscount: number;
  /** Descuento personalizado aplicado (0-1, null si no aplica). */
  personalDiscount: number | null;
  /** Importe efectivo final en centavos. */
  effectiveAmount: number;
  /** Porcentaje total de descuento efectivo (0-100). */
  totalDiscountPercent: number;
}

/**
 * Calcula el importe efectivo aplicando descuentos MULTIPLICATIVAMENTE.
 * NUNCA suma porcentajes — cada descuento se aplica sobre el importe ya descontado.
 *
 * Fórmula: effectiveAmount = baseAmount × (1 - typeDiscount) × (1 - personalDiscount)
 *
 * @param baseAmount - Importe base en centavos (entero)
 * @param typeDiscount - Descuento por tipo de socio (0-1, null si no aplica)
 * @param personalDiscount - Descuento personalizado (0-1, null si no aplica)
 * @returns Desglose completo del cálculo
 * @throws Error si el descuento combinado alcanza o supera el 100%
 *
 * @example
 * calculateEffectiveAmount(12000, 0.30, 0.10)
 * // base: 12000, afterType: 8400, effective: 7560, totalDiscount: 37%
 */
export function calculateEffectiveAmount(
  baseAmount: number,
  typeDiscount: number | null,
  personalDiscount: number | null,
): DiscountBreakdown {
  const typeFactor = 1 - (typeDiscount ?? 0);
  const personalFactor = 1 - (personalDiscount ?? 0);

  // Validar que el descuento combinado no alcance 100%
  if (typeFactor * personalFactor <= 0) {
    throw new Error('El descuento combinado no puede alcanzar o superar el 100%');
  }

  const afterTypeDiscount = Math.round(baseAmount * typeFactor);
  const effectiveAmount = Math.round(baseAmount * typeFactor * personalFactor);

  const totalDiscountPercent =
    baseAmount > 0 ? Math.round((1 - effectiveAmount / baseAmount) * 100) : 0;

  return {
    baseAmount,
    typeDiscount,
    afterTypeDiscount,
    personalDiscount,
    effectiveAmount,
    totalDiscountPercent,
  };
}
