import { describe, it, expect } from 'vitest';
import { MemberStatusChangedEvent } from '../events/member-status-changed.event';

describe('MemberStatusChangedEvent', () => {
  it('debería crear un evento con el payload correcto', () => {
    const payload = {
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      previousStatus: 'ACTIVE',
      newStatus: 'PENDING_PAYMENT',
      reason: 'Impago de cuota trimestral',
      changedBy: 'user-123',
      changedAt: new Date('2025-01-15T10:00:00Z'),
    };

    const event = new MemberStatusChangedEvent(payload);

    expect(event.eventType).toBe('member.status-changed');
    expect(event.payload).toEqual(payload);
  });
});
