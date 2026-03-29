import { describe, it, expect } from 'vitest';
import { MemberTypeCreatedEvent } from '../events/member-type-created.event';

describe('MemberTypeCreatedEvent', () => {
  const validPayload = {
    memberTypeId: '550e8400-e29b-41d4-a716-446655440000',
    code: 'SOCIO',
    name: 'Socio Numerario',
    description: 'Socio de pleno derecho',
    tenantId: '660e8400-e29b-41d4-a716-446655440001',
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new MemberTypeCreatedEvent({
      payload: validPayload,
      aggregateId: validPayload.memberTypeId,
      aggregateType: 'MemberType',
      boundedContext: 'BC-Membership',
    });

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "MemberTypeCreated"', () => {
    const event = new MemberTypeCreatedEvent({
      payload: validPayload,
      aggregateId: validPayload.memberTypeId,
      aggregateType: 'MemberType',
      boundedContext: 'BC-Membership',
    });

    expect(event.eventType).toBe('MemberTypeCreated');
  });
});
