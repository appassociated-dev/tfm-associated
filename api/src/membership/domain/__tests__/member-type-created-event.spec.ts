import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
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
    const event = new MemberTypeCreatedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "member-type.created"', () => {
    const event = new MemberTypeCreatedEvent(validPayload);

    expect(event.eventType).toBe('member-type.created');
  });

  it('debería generar un eventId UUID válido', () => {
    const event = new MemberTypeCreatedEvent(validPayload);

    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('debería tener un occurredOn de tipo Date', () => {
    const before = new Date();
    const event = new MemberTypeCreatedEvent(validPayload);
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('debería generar eventIds únicos para cada instancia', () => {
    const event1 = new MemberTypeCreatedEvent(validPayload);
    const event2 = new MemberTypeCreatedEvent(validPayload);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
