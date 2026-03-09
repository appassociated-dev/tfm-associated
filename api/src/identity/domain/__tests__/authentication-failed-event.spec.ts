import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { AuthenticationFailedEvent } from '../events/authentication-failed.event';

describe('AuthenticationFailedEvent', () => {
  const validPayload = {
    email: 'intruso@ejemplo.com',
    ipAddress: '10.0.0.50',
    timestamp: new Date('2026-03-09T10:05:00Z'),
    attemptCount: 3,
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new AuthenticationFailedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "identity.authentication.failed"', () => {
    const event = new AuthenticationFailedEvent(validPayload);

    expect(event.eventType).toBe('identity.authentication.failed');
  });

  it('debería generar un eventId UUID válido', () => {
    const event = new AuthenticationFailedEvent(validPayload);

    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('debería tener un occurredOn de tipo Date', () => {
    const before = new Date();
    const event = new AuthenticationFailedEvent(validPayload);
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('debería generar eventIds únicos para cada instancia', () => {
    const event1 = new AuthenticationFailedEvent(validPayload);
    const event2 = new AuthenticationFailedEvent(validPayload);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
