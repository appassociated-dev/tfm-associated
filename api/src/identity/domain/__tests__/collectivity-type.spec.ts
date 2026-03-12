import { describe, it, expect } from 'vitest';
import { CollectivityType } from '../value-objects/collectivity-type';

describe('CollectivityType', () => {
  // --- Creación ---

  it('debería crear un tipo PENA', () => {
    const type = CollectivityType.pena();

    expect(type.value).toBe('PENA');
  });

  it('debería crear un tipo COFRADIA', () => {
    const type = CollectivityType.cofradia();

    expect(type.value).toBe('COFRADIA');
  });

  it('debería crear un tipo CLUB_DEPORTIVO', () => {
    const type = CollectivityType.clubDeportivo();

    expect(type.value).toBe('CLUB_DEPORTIVO');
  });

  it('debería crear un tipo ASOCIACION_CULTURAL', () => {
    const type = CollectivityType.asociacionCultural();

    expect(type.value).toBe('ASOCIACION_CULTURAL');
  });

  it('debería crear un tipo a partir de un string válido', () => {
    const type = CollectivityType.fromString('PENA');

    expect(type.value).toBe('PENA');
  });

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
