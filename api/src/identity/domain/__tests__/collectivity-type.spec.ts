import { describe, it, expect } from 'vitest';
import { CollectivityType } from '../value-objects/collectivity-type';

describe('CollectivityType', () => {
  // --- Creación ---

  it.each([
    ['PENA', CollectivityType.pena()],
    ['COFRADIA', CollectivityType.cofradia()],
    ['CLUB_DEPORTIVO', CollectivityType.clubDeportivo()],
    ['ASOCIACION_CULTURAL', CollectivityType.asociacionCultural()],
  ])('debería crear un tipo %s', (expected, type) => {
    expect(type.value).toBe(expected);
  });

  it.each([['PENA'], ['COFRADIA'], ['CLUB_DEPORTIVO'], ['ASOCIACION_CULTURAL']])(
    'debería crear un tipo a partir del string válido "%s"',
    (value) => {
      const type = CollectivityType.fromString(value);
      expect(type.value).toBe(value);
    },
  );

  it('debería lanzar error con un valor inválido', () => {
    expect(() => CollectivityType.fromString('INVALID')).toThrow();
  });

  it('debería lanzar error con una cadena vacía', () => {
    expect(() => CollectivityType.fromString('')).toThrow();
  });

  // --- Igualdad ---

  it('debería ser igual a otro CollectivityType con el mismo valor', () => {
    const type1 = CollectivityType.pena();
    const type2 = CollectivityType.pena();

    expect(type1.equals(type2)).toBe(true);
  });

  it('debería ser diferente a otro CollectivityType con distinto valor', () => {
    const type1 = CollectivityType.pena();
    const type2 = CollectivityType.cofradia();

    expect(type1.equals(type2)).toBe(false);
  });
});
