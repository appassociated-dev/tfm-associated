import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '../aggregate-root.base';
import { DomainEvent } from '../domain-event.base';

class TestCreatedEvent extends DomainEvent<{ name: string }> {
  readonly eventType = 'TestCreated';
}

class TestUpdatedEvent extends DomainEvent<{ field: string }> {
  readonly eventType = 'TestUpdated';
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }

  // Expone addDomainEvent para tests
  create(name: string): void {
    this.addDomainEvent(new TestCreatedEvent({ name }));
  }

  update(field: string): void {
    this.addDomainEvent(new TestUpdatedEvent({ field }));
  }
}

describe('AggregateRoot', () => {
  it('hereda de Entity y expone id', () => {
    const agg = new TestAggregate('agg-1');
    expect(agg.id).toBe('agg-1');
  });

  it('acumula domain events al añadirlos', () => {
    const agg = new TestAggregate('agg-1');
    agg.create('Test');
    agg.update('name');
    const events = agg.pullDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]!.eventType).toBe('TestCreated');
    expect(events[1]!.eventType).toBe('TestUpdated');
  });

  it('pullDomainEvents vacía la lista interna', () => {
    const agg = new TestAggregate('agg-1');
    agg.create('Test');
    agg.pullDomainEvents();
    const events = agg.pullDomainEvents();
    expect(events).toHaveLength(0);
  });

  it('clearDomainEvents descarta todos los eventos', () => {
    const agg = new TestAggregate('agg-1');
    agg.create('Test');
    agg.update('name');
    agg.clearDomainEvents();
    const events = agg.pullDomainEvents();
    expect(events).toHaveLength(0);
  });

  it('pullDomainEvents devuelve copia, no referencia interna', () => {
    const agg = new TestAggregate('agg-1');
    agg.create('Test');
    const events = agg.pullDomainEvents();
    events.push(new TestCreatedEvent({ name: 'Extra' }));
    // La lista interna sigue vacía
    expect(agg.pullDomainEvents()).toHaveLength(0);
  });

  it('sin eventos, pullDomainEvents devuelve array vacío', () => {
    const agg = new TestAggregate('agg-1');
    expect(agg.pullDomainEvents()).toEqual([]);
  });
});
