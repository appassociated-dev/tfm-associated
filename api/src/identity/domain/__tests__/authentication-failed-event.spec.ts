import { describe, it, expect } from 'vitest';
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
});
