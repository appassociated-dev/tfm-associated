import { describe, it, expect } from 'vitest';
import { UserCreatedEvent } from '../events/user-created.event';

describe('UserCreatedEvent', () => {
  const validPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@pena.es',
    role: 'PRESIDENT',
    tenantId: '660e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date('2026-01-15T10:00:00Z'),
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new UserCreatedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "user.created"', () => {
    const event = new UserCreatedEvent(validPayload);

    expect(event.eventType).toBe('user.created');
  });
});
