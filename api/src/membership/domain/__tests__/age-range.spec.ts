import { describe, it, expect } from 'vitest';
import { AgeRange } from '../value-objects/age-range';

describe('AgeRange', () => {
  // --- Creación válida ---

  it('debería crear un AgeRange con min y max definidos', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.min).toBe(18);
      expect(result.value.max).toBe(65);
    }
  });

  it('debería crear un AgeRange con solo min (sin max)', () => {
    const result = AgeRange.create(18, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.min).toBe(18);
      expect(result.value.max).toBeNull();
    }
  });

  it('debería crear un AgeRange con solo max (sin min)', () => {
    const result = AgeRange.create(null, 17);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.min).toBeNull();
      expect(result.value.max).toBe(17);
    }
  });

  it('debería crear un AgeRange sin límites (sin restricción de edad)', () => {
    const result = AgeRange.create(null, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.min).toBeNull();
      expect(result.value.max).toBeNull();
    }
  });

  it('debería crear un AgeRange con min=0', () => {
    const result = AgeRange.create(0, 12);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.min).toBe(0);
    }
  });

  it('debería crear un AgeRange con max=120', () => {
    const result = AgeRange.create(65, 120);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.max).toBe(120);
    }
  });

  // --- Creación inválida ---

  it('debería rechazar min negativo', () => {
    const result = AgeRange.create(-1, 65);

    expect(result.ok).toBe(false);
  });

  it('debería rechazar max mayor que 120', () => {
    const result = AgeRange.create(18, 121);

    expect(result.ok).toBe(false);
  });

  it('debería rechazar cuando min >= max (ambos definidos)', () => {
    const result = AgeRange.create(65, 18);

    expect(result.ok).toBe(false);
  });

  it('debería rechazar cuando min === max', () => {
    const result = AgeRange.create(18, 18);

    expect(result.ok).toBe(false);
  });

  // --- includes() ---

  it('debería incluir una edad dentro del rango', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(30)).toBe(true);
    }
  });

  it('debería incluir la edad mínima exacta', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(18)).toBe(true);
    }
  });

  it('debería incluir la edad máxima exacta', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(65)).toBe(true);
    }
  });

  it('debería excluir una edad menor al mínimo', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(17)).toBe(false);
    }
  });

  it('debería excluir una edad mayor al máximo', () => {
    const result = AgeRange.create(18, 65);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(66)).toBe(false);
    }
  });

  it('debería incluir cualquier edad cuando no hay límites', () => {
    const result = AgeRange.create(null, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(0)).toBe(true);
      expect(result.value.includes(120)).toBe(true);
    }
  });

  it('debería incluir edad cuando solo hay min y la edad está por encima', () => {
    const result = AgeRange.create(18, null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(50)).toBe(true);
      expect(result.value.includes(17)).toBe(false);
    }
  });

  it('debería incluir edad cuando solo hay max y la edad está por debajo', () => {
    const result = AgeRange.create(null, 17);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includes(10)).toBe(true);
      expect(result.value.includes(18)).toBe(false);
    }
  });

  // --- Igualdad ---

  it('debería ser igual a otro AgeRange con los mismos valores', () => {
    const result1 = AgeRange.create(18, 65);
    const result2 = AgeRange.create(18, 65);

    expect(result1.ok && result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.value.equals(result2.value)).toBe(true);
    }
  });
});
