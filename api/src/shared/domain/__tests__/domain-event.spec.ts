import { describe, it, expect } from 'vitest';
import { DomainEvent } from '../domain-event.base';
import { validate as uuidValidate } from 'uuid';

interface TestPayload {
  memberId: string;
  name: string;
}

class TestEvent extends DomainEvent<TestPayload> {
  readonly eventType = 'TestEvent';
}

describe('DomainEvent', () => {
  it('genera un eventId UUID válido', () => {
    const event = new TestEvent({ memberId: '1', name: 'Test' });
    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('cada instancia tiene un eventId único', () => {
    const a = new TestEvent({ memberId: '1', name: 'A' });
    const b = new TestEvent({ memberId: '2', name: 'B' });
    expect(a.eventId).not.toBe(b.eventId);
  });

  it('establece occurredOn como Date actual', () => {
    const before = new Date();
    const event = new TestEvent({ memberId: '1', name: 'Test' });
    const after = new Date();
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('expone el eventType definido por la subclase', () => {
    const event = new TestEvent({ memberId: '1', name: 'Test' });
    expect(event.eventType).toBe('TestEvent');
  });

  it('almacena el payload proporcionado', () => {
    const payload: TestPayload = { memberId: 'abc', name: 'María' };
    const event = new TestEvent(payload);
    expect(event.payload).toEqual(payload);
  });
});
