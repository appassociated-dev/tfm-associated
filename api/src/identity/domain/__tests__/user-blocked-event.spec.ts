import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { UserBlockedEvent } from '../events/user-blocked.event';

describe('UserBlockedEvent', () => {
  const validPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'bloqueado@pena.es',
    blockReason: 'Exceso de intentos fallidos de autenticación',
    blockDuration: 900,
    timestamp: new Date('2026-03-09T10:10:00Z'),
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new UserBlockedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "identity.user.blocked"', () => {
    const event = new UserBlockedEvent(validPayload);

    expect(event.eventType).toBe('identity.user.blocked');
  });

  it('debería generar un eventId UUID válido', () => {
    const event = new UserBlockedEvent(validPayload);

    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('debería tener un occurredOn de tipo Date', () => {
    const before = new Date();
    const event = new UserBlockedEvent(validPayload);
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('debería generar eventIds únicos para cada instancia', () => {
    const event1 = new UserBlockedEvent(validPayload);
    const event2 = new UserBlockedEvent(validPayload);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
