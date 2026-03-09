import { describe, it, expect } from 'vitest';
import { Entity } from '../entity.base';
import { Identifier } from '../identifier.base';

// Implementación concreta para tests
class ConcreteEntity extends Entity<string> {
  constructor(id: string) {
    super(id);
  }
}

class IdentifierEntity extends Entity<Identifier> {
  constructor(id: Identifier) {
    super(id);
  }
}

describe('Entity', () => {
  it('expone el ID via getter', () => {
    const entity = new ConcreteEntity('abc-123');
    expect(entity.id).toBe('abc-123');
  });

  it('dos entidades con el mismo ID son iguales', () => {
    const a = new ConcreteEntity('same-id');
    const b = new ConcreteEntity('same-id');
    expect(a.equals(b)).toBe(true);
  });

  it('dos entidades con distinto ID no son iguales', () => {
    const a = new ConcreteEntity('id-1');
    const b = new ConcreteEntity('id-2');
    expect(a.equals(b)).toBe(false);
  });

  it('comparación con undefined devuelve false', () => {
    const entity = new ConcreteEntity('id');
    expect(entity.equals(undefined)).toBe(false);
  });

  it('funciona con Identifier como TId (delega en equals)', () => {
    const id = new Identifier();
    const a = new IdentifierEntity(id);
    const b = new IdentifierEntity(new Identifier(id.toValue()));
    expect(a.equals(b)).toBe(true);
  });

  it('dos entidades con distinto Identifier no son iguales', () => {
    const a = new IdentifierEntity(new Identifier());
    const b = new IdentifierEntity(new Identifier());
    expect(a.equals(b)).toBe(false);
  });
});
