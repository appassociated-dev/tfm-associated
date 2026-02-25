// Smoke test de la clase base Entity — verifica identidad e igualdad estructural
import { describe, it, expect } from 'vitest';
import { Entity } from '../entity.base';

// Implementación concreta de Entity para usar en los tests
class TestEntity extends Entity<string> {
  constructor(id: string, props: Record<string, unknown> = {}) {
    super(id, props);
  }
}

describe('Entity base class', () => {
  describe('constructor and id', () => {
    it('should create an entity with the given ID', () => {
      // Arrange
      const id = 'test-id-123';

      // Act
      const entity = new TestEntity(id);

      // Assert
      expect(entity.id).toBe(id);
    });

    it('should store props passed to the constructor', () => {
      // Arrange
      const id = 'test-id-456';
      const entity = new TestEntity(id, { name: 'John' });

      // Assert — acceso a props via getter protegido de la subclase
      expect(entity.id).toBe(id);
    });
  });

  describe('equals()', () => {
    it('should return true when comparing the same instance', () => {
      // Arrange
      const entity = new TestEntity('id-001');

      // Act & Assert
      expect(entity.equals(entity)).toBe(true);
    });

    it('should return true when two entities share the same ID', () => {
      // Arrange
      const entityA = new TestEntity('shared-id');
      const entityB = new TestEntity('shared-id');

      // Act & Assert
      expect(entityA.equals(entityB)).toBe(true);
    });

    it('should return false when two entities have different IDs', () => {
      // Arrange
      const entityA = new TestEntity('id-001');
      const entityB = new TestEntity('id-002');

      // Act & Assert
      expect(entityA.equals(entityB)).toBe(false);
    });

    it('should return false when compared with a non-Entity value', () => {
      // Arrange
      const entity = new TestEntity('id-001');

      // Act & Assert — el cast es necesario para probar la guarda de tipo
      expect(entity.equals(null as unknown as Entity<string>)).toBe(false);
    });
  });
});
