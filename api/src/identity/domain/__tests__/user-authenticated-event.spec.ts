import { describe, it, expect } from 'vitest';
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
});
