import { describe, it, expect } from 'vitest';
import { Slug } from '../value-objects/slug';

describe('Slug', () => {
  // --- Creación ---

  it('debería crear un slug a partir de un nombre básico', () => {
    const slug = Slug.fromName('Mi Asociación');

    expect(slug.value).toBe('mi-asociacion');
  });

  it('debería eliminar acentos y caracteres diacríticos', () => {
    const slug = Slug.fromName('Peña Cultural Ñoño');

    expect(slug.value).toBe('pena-cultural-nono');
  });

  it('debería eliminar caracteres especiales', () => {
    const slug = Slug.fromName('Club @Deportivo #1!');

    expect(slug.value).toBe('club-deportivo-1');
  });

  it('debería colapsar múltiples espacios en un solo guión', () => {
    const slug = Slug.fromName('Club    Deportivo    Madrid');

    expect(slug.value).toBe('club-deportivo-madrid');
  });

  it('debería eliminar espacios iniciales y finales', () => {
    const slug = Slug.fromName('  Mi Club  ');

    expect(slug.value).toBe('mi-club');
  });

  it('debería colapsar múltiples guiones consecutivos', () => {
    const slug = Slug.fromName('Club--Deportivo---Madrid');

    expect(slug.value).toBe('club-deportivo-madrid');
  });

  it('debería eliminar guiones iniciales y finales', () => {
    const slug = Slug.fromName('-Mi Club-');

    expect(slug.value).toBe('mi-club');
  });

  it('debería manejar un nombre con solo caracteres especiales', () => {
    const slug = Slug.fromName('!!!@@@###');

    expect(slug.value).toBe('');
  });

  // --- Igualdad ---

  it('debería ser igual a otro Slug derivado del mismo nombre', () => {
    const slug1 = Slug.fromName('Mi Asociación');
    const slug2 = Slug.fromName('Mi Asociación');

    expect(slug1.equals(slug2)).toBe(true);
  });

  it('debería ser diferente a otro Slug derivado de distinto nombre', () => {
    const slug1 = Slug.fromName('Club Uno');
    const slug2 = Slug.fromName('Club Dos');

    expect(slug1.equals(slug2)).toBe(false);
  });
});
