import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { TenantProvisionedEvent } from '../events/tenant-provisioned.event';

describe('TenantProvisionedEvent', () => {
  const validPayload = {
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    organizationName: 'Peña El Buen Gusto',
    organizationType: 'PENA',
    adminUserId: '660e8400-e29b-41d4-a716-446655440001',
    adminEmail: 'admin@pena.es',
    cif: 'G12345678',
  };

  it('debería crear el evento con un payload válido', () => {
    const event = new TenantProvisionedEvent(validPayload);

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "tenant.provisioned"', () => {
    const event = new TenantProvisionedEvent(validPayload);

    expect(event.eventType).toBe('tenant.provisioned');
  });

  it('debería generar un eventId UUID válido', () => {
    const event = new TenantProvisionedEvent(validPayload);

    expect(uuidValidate(event.eventId)).toBe(true);
  });

  it('debería tener un occurredOn de tipo Date', () => {
    const before = new Date();
    const event = new TenantProvisionedEvent(validPayload);
    const after = new Date();

    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('debería generar eventIds únicos para cada instancia', () => {
    const event1 = new TenantProvisionedEvent(validPayload);
    const event2 = new TenantProvisionedEvent(validPayload);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});
