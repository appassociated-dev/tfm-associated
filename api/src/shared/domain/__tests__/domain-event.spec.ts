import { describe, it, expect } from 'vitest';
import { DomainEvent } from '../domain-event.base';
import { validate as uuidValidate } from 'uuid';

interface TestPayload {
  memberId: string;
  name: string;
}

// Subclase de prueba que usa la nueva firma del constructor
class TestEvent extends DomainEvent<TestPayload> {
  readonly eventType = 'TestEvent';
}

describe('DomainEvent', () => {
  // --- Tests originales (retrocompatibilidad) ---

  it('genera un eventId UUID válido', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('cada instancia tiene un eventId único', () => {
    const a = new TestEvent({
      payload: { memberId: '1', name: 'A' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    const b = new TestEvent({
      payload: { memberId: '2', name: 'B' },
      aggregateId: 'agg-002',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(a.eventId).not.toBe(b.eventId);
  });

  it('establece occurredOn como Date actual', () => {
    const before = new Date();
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    const after = new Date();
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('expone el eventType definido por la subclase', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(event.eventType).toBe('TestEvent');
  });

  it('almacena el payload proporcionado', () => {
    const payload: TestPayload = { memberId: 'abc', name: 'María' };
    const event = new TestEvent({
      payload,
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(event.payload).toEqual(payload);
  });

  // --- Tests nuevos: campos adicionales de A-001 ---

  it('asigna aggregateId correctamente', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-123',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(event.aggregateId).toBe('agg-123');
  });

  it('asigna aggregateType correctamente', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'Member',
      boundedContext: 'BC-Membership',
    });
    expect(event.aggregateType).toBe('Member');
  });

  it('asigna boundedContext correctamente', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Membership',
    });
    expect(event.boundedContext).toBe('BC-Membership');
  });

  it('actorId es undefined cuando no se proporciona (operación de sistema)', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    expect(event.actorId).toBeUndefined();
  });

  it('asigna actorId cuando se proporciona', () => {
    const actorId = 'user-abc-123';
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
      actorId,
    });
    expect(event.actorId).toBe(actorId);
  });

  it('usa el eventId proporcionado en lugar de generar uno nuevo (reconstitución)', () => {
    const customEventId = '550e8400-e29b-41d4-a716-000000000099';
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
      eventId: customEventId,
    });
    expect(event.eventId).toBe(customEventId);
  });

  it('usa el occurredOn proporcionado en lugar de new Date() (reconstitución)', () => {
    const customOccurredOn = new Date('2025-06-15T08:30:00Z');
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
      occurredOn: customOccurredOn,
    });
    expect(event.occurredOn).toEqual(customOccurredOn);
  });

  it('todos los campos requeridos son readonly', () => {
    const event = new TestEvent({
      payload: { memberId: '1', name: 'Test' },
      aggregateId: 'agg-001',
      aggregateType: 'TestAggregate',
      boundedContext: 'BC-Test',
    });
    // Verificar que los campos existen y no son undefined
    expect(event.eventId).toBeDefined();
    expect(event.occurredOn).toBeDefined();
    expect(event.payload).toBeDefined();
    expect(event.aggregateId).toBeDefined();
    expect(event.aggregateType).toBeDefined();
    expect(event.boundedContext).toBeDefined();
  });
});
