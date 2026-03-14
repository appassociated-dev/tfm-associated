import { describe, it, expect } from 'vitest';
import { formatMoney } from './format-money';

describe('formatMoney', () => {
  // Convierte centavos (enteros) a formato de moneda española (EUR)

  it('deberia formatear 34500 centavos como 345,00 EUR', () => {
    const result = formatMoney(34500);

    expect(result).toContain('345,00');
    expect(result).toContain('€');
  });

  it('deberia formatear 0 centavos como 0,00 EUR', () => {
    const result = formatMoney(0);

    expect(result).toContain('0,00');
    expect(result).toContain('€');
  });

  it('deberia formatear 1 centavo como 0,01 EUR', () => {
    const result = formatMoney(1);

    expect(result).toContain('0,01');
    expect(result).toContain('€');
  });

  it('deberia formatear 100 centavos como 1,00 EUR', () => {
    const result = formatMoney(100);

    expect(result).toContain('1,00');
    expect(result).toContain('€');
  });

  it('deberia formatear 999999 centavos como 9.999,99 o 9999,99 EUR', () => {
    const result = formatMoney(999999);

    // El separador de miles puede variar segun el runtime de ICU
    expect(result).toMatch(/9[.]?999,99/);
    expect(result).toContain('€');
  });
});
