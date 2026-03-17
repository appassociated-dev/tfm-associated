import { describe, it, expect } from 'vitest';
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
});
