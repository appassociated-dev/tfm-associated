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
    const event = new TenantProvisionedEvent({
      payload: validPayload,
      aggregateId: validPayload.tenantId,
      aggregateType: 'Tenant',
      boundedContext: 'BC-Identity',
    });

    expect(event.payload).toEqual(validPayload);
  });

  it('debería tener eventType "TenantProvisioned"', () => {
    const event = new TenantProvisionedEvent({
      payload: validPayload,
      aggregateId: validPayload.tenantId,
      aggregateType: 'Tenant',
      boundedContext: 'BC-Identity',
    });

    expect(event.eventType).toBe('TenantProvisioned');
  });

  it('debería tener aggregateId, aggregateType y boundedContext correctos', () => {
    const event = new TenantProvisionedEvent({
      payload: validPayload,
      aggregateId: validPayload.tenantId,
      aggregateType: 'Tenant',
      boundedContext: 'BC-Identity',
    });

    expect(event.aggregateId).toBe(validPayload.tenantId);
    expect(event.aggregateType).toBe('Tenant');
    expect(event.boundedContext).toBe('BC-Identity');
  });
});
