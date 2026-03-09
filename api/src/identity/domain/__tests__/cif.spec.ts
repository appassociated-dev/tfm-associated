import { describe, it, expect } from 'vitest';
import { Cif } from '../value-objects/cif';

describe('Cif', () => {
  // --- Creación con CIF válido ---

  it('debería crear un Cif válido con tipo A y dígito de control', () => {
    const cif = Cif.create('A28015550');

    expect(cif.value).toBe('A28015550');
  });

  it('debería crear un Cif válido con tipo B y dígito de control', () => {
    const cif = Cif.create('B65410011');

    expect(cif.value).toBe('B65410011');
  });

  it('debería crear un Cif válido con tipo P y letra de control', () => {
    const cif = Cif.create('P0800000B');

    expect(cif.value).toBe('P0800000B');
  });

  it('debería crear un Cif válido con tipo S y letra de control', () => {
    const cif = Cif.create('S0800001J');

    expect(cif.value).toBe('S0800001J');
  });

  it('debería crear un Cif válido con tipo Q y letra de control', () => {
    const cif = Cif.create('Q0801175A');

    expect(cif.value).toBe('Q0801175A');
  });

  // --- Rechazo de CIF inválido ---

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => Cif.create('')).toThrow();
  });

  it('debería lanzar error con formato incorrecto (sin letra inicial)', () => {
    expect(() => Cif.create('12345678A')).toThrow();
  });

  it('debería lanzar error con letra inicial no permitida', () => {
    expect(() => Cif.create('I28015550')).toThrow();
  });

  it('debería lanzar error con longitud incorrecta', () => {
    expect(() => Cif.create('A2801555')).toThrow();
  });

  it('debería lanzar error con dígito de control incorrecto', () => {
    // A28015550 es válido, A28015557 no
    expect(() => Cif.create('A28015557')).toThrow();
  });

  it('debería lanzar error con caracteres especiales en los dígitos', () => {
    expect(() => Cif.create('A28-01550')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro Cif con el mismo valor', () => {
    const cif1 = Cif.create('A28015550');
    const cif2 = Cif.create('A28015550');

    expect(cif1.equals(cif2)).toBe(true);
  });

  it('debería ser diferente a otro Cif con distinto valor', () => {
    const cif1 = Cif.create('A28015550');
    const cif2 = Cif.create('B65410011');

    expect(cif1.equals(cif2)).toBe(false);
  });
});
