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
    const event = new AuthenticationFailedEvent({
      payload: validPayload,
      aggregateId: 'user-123',
      aggregateType: 'User',
      boundedContext: 'BC-Identity',
    });

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "AuthenticationFailed"', () => {
    const event = new AuthenticationFailedEvent({
      payload: validPayload,
      aggregateId: 'user-123',
      aggregateType: 'User',
      boundedContext: 'BC-Identity',
    });

    expect(event.eventType).toBe('AuthenticationFailed');
  });
});
