import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { UserAuthenticatedEvent } from '../events/user-authenticated.event';

describe('UserAuthenticatedEvent', () => {
  const validPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: '660e8400-e29b-41d4-a716-446655440001',
    email: 'socio@pena.es',
    rol: 'SOCIO',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date('2026-03-09T10:00:00Z'),
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new UserAuthenticatedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "identity.user.authenticated"', () => {
    const event = new UserAuthenticatedEvent(validPayload);

    expect(event.eventType).toBe('identity.user.authenticated');
  });

  it('debería generar un eventId UUID válido', () => {
    const event = new UserAuthenticatedEvent(validPayload);

    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('debería tener un occurredOn de tipo Date', () => {
    const before = new Date();
    const event = new UserAuthenticatedEvent(validPayload);
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('debería generar eventIds únicos para cada instancia', () => {
    const event1 = new UserAuthenticatedEvent(validPayload);
    const event2 = new UserAuthenticatedEvent(validPayload);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
