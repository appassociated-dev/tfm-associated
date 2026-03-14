import { describe, it, expect } from 'vitest';

import { calculateEffectiveAmount, type DiscountBreakdown } from './discount-calculator';

// === Tests del calculador de descuento multiplicativo ===

describe('calculateEffectiveAmount', () => {
  it('deberia aplicar solo descuento por tipo (30%)', () => {
    const result = calculateEffectiveAmount(12000, 0.3, null);

    expect(result.effectiveAmount).toBe(8400);
    expect(result.afterTypeDiscount).toBe(8400);
    expect(result.typeDiscount).toBe(0.3);
    expect(result.personalDiscount).toBeNull();
  });

  it('deberia aplicar solo descuento personal (20%)', () => {
    const result = calculateEffectiveAmount(12000, null, 0.2);

    expect(result.effectiveAmount).toBe(9600);
    expect(result.afterTypeDiscount).toBe(12000);
    expect(result.personalDiscount).toBe(0.2);
    expect(result.typeDiscount).toBeNull();
  });

  it('deberia retornar el importe base cuando no hay descuentos', () => {
    const result = calculateEffectiveAmount(12000, null, null);

    expect(result.effectiveAmount).toBe(12000);
    expect(result.afterTypeDiscount).toBe(12000);
    expect(result.totalDiscountPercent).toBe(0);
  });

  it('deberia aplicar descuentos MULTIPLICATIVAMENTE (30% + 10% = 7560)', () => {
    // Formula: 12000 * 0.70 * 0.90 = 7560
    const result = calculateEffectiveAmount(12000, 0.3, 0.1);

    expect(result.effectiveAmount).toBe(7560);
    expect(result.afterTypeDiscount).toBe(8400);
  });

  it('NO deberia aplicar descuentos de forma aditiva (30% + 10% != 7200)', () => {
    const result = calculateEffectiveAmount(12000, 0.3, 0.1);

    // Si fuera aditivo: 12000 * (1 - 0.40) = 7200 — NO es correcto
    expect(result.effectiveAmount).not.toBe(7200);
    // El valor correcto es multiplicativo: 7560
    expect(result.effectiveAmount).toBe(7560);
  });

  it('deberia calcular correctamente con descuentos de 50% + 50% (resultado 3000, no 0)', () => {
    // Formula multiplicativa: 12000 * 0.50 * 0.50 = 3000 (75% total, no 100%)
    const result = calculateEffectiveAmount(12000, 0.5, 0.5);

    expect(result.effectiveAmount).toBe(3000);
    expect(result.totalDiscountPercent).toBe(75);
  });

  it('deberia retornar 0 cuando el importe base es 0', () => {
    const result = calculateEffectiveAmount(0, 0.3, 0.1);

    expect(result.effectiveAmount).toBe(0);
    expect(result.afterTypeDiscount).toBe(0);
    expect(result.totalDiscountPercent).toBe(0);
  });

  it('deberia retornar el importe base cuando ambos descuentos son 0', () => {
    const result = calculateEffectiveAmount(12000, 0, 0);

    expect(result.effectiveAmount).toBe(12000);
    expect(result.afterTypeDiscount).toBe(12000);
    expect(result.totalDiscountPercent).toBe(0);
  });

  it('deberia lanzar error cuando el descuento por tipo es 100%', () => {
    // typeFactor = 0, personalFactor = 1 => 0 * 1 = 0 <= 0
    expect(() => calculateEffectiveAmount(12000, 1.0, null)).toThrow(
      'El descuento combinado no puede alcanzar o superar el 100%',
    );
  });

  it('deberia lanzar error cuando el descuento combinado alcanza 100%', () => {
    // typeFactor = 0.50, personalFactor = 0 => 0.50 * 0 = 0 <= 0
    expect(() => calculateEffectiveAmount(12000, 0.5, 1.0)).toThrow(
      'El descuento combinado no puede alcanzar o superar el 100%',
    );
  });

  it('deberia calcular totalDiscountPercent correcto para 30% + 10% multiplicativo', () => {
    const result = calculateEffectiveAmount(12000, 0.3, 0.1);

    // Descuento total real: 1 - (0.70 * 0.90) = 1 - 0.63 = 0.37 => 37%
    expect(result.totalDiscountPercent).toBe(37);
  });

  it('deberia calcular afterTypeDiscount correctamente con descuento 25%', () => {
    const result = calculateEffectiveAmount(10000, 0.25, null);

    expect(result.afterTypeDiscount).toBe(7500);
    expect(result.effectiveAmount).toBe(7500);
  });

  it('deberia retornar el desglose completo con todas las propiedades', () => {
    const result = calculateEffectiveAmount(12000, 0.3, 0.1);

    // Verificar que devuelve todas las propiedades de DiscountBreakdown
    expect(result).toEqual<DiscountBreakdown>({
      baseAmount: 12000,
      typeDiscount: 0.3,
      afterTypeDiscount: 8400,
      personalDiscount: 0.1,
      effectiveAmount: 7560,
      totalDiscountPercent: 37,
    });
  });

  it('deberia redondear correctamente centavos fraccionarios', () => {
    // 10000 * 0.67 * 0.85 = 5695 (sin decimales problematicos con Math.round)
    const result = calculateEffectiveAmount(10000, 0.33, 0.15);

    expect(Number.isInteger(result.effectiveAmount)).toBe(true);
    expect(Number.isInteger(result.afterTypeDiscount)).toBe(true);
  });
});
