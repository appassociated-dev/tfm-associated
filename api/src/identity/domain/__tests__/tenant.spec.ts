import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { Tenant } from '../aggregates/tenant';
import { TenantProvisionedEvent } from '../events/tenant-provisioned.event';

describe('Tenant', () => {
  const validProps = {
    name: 'Peña El Buen Gusto',
    cif: 'A28015550',
    type: 'PENA',
    contactEmail: 'contacto@pena.es',
  };

  // --- create() con datos válidos ---

  it('debería crear un Tenant con propiedades correctas', () => {
    const tenant = Tenant.create(validProps);

    expect(tenant.name).toBe('Peña El Buen Gusto');
    expect(tenant.cif.value).toBe('A28015550');
    expect(tenant.type.value).toBe('PENA');
    expect(tenant.contactEmail).toBe('contacto@pena.es');
    expect(uuidValidate(tenant.id.toValue())).toBe(true);
  });

  it('no debería emitir eventos de dominio al crear (se emiten en el handler)', () => {
    const tenant = Tenant.create(validProps);
    const events = tenant.pullDomainEvents();

    expect(events).toHaveLength(0);
  });

  it('debería permitir registrar eventos de dominio via registerProvisionedEvent', () => {
    const tenant = Tenant.create(validProps);
    const event = new TenantProvisionedEvent({
      tenantId: tenant.id.toValue(),
      organizationName: tenant.name,
      organizationType: tenant.type.value,
      adminUserId: 'admin-123',
      adminEmail: 'admin@test.es',
      cif: tenant.cif.value,
    });

    tenant.registerProvisionedEvent(event);
    const events = tenant.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TenantProvisionedEvent);
    expect(events[0].eventType).toBe('tenant.provisioned');
  });

  it('debería generar un slug correcto a partir del nombre', () => {
    const tenant = Tenant.create(validProps);

    expect(tenant.slug.value).toBe('pena-el-buen-gusto');
  });

  it('debería generar un databaseName correcto (associated_{id} con guiones bajos)', () => {
    const tenant = Tenant.create(validProps);
    const expectedDbName = `associated_${tenant.id.toValue().replace(/-/g, '_')}`;

    expect(tenant.databaseName).toBe(expectedDbName);
  });

  it('deberia generar un databaseUser correcto (tenant_{id} con guiones bajos)', () => {
    const tenant = Tenant.create(validProps);
    const expectedDbUser = `tenant_${tenant.id.toValue().replace(/-/g, '_')}`;

    expect(tenant.databaseUser).toBe(expectedDbUser);
  });

  it('deberia reconstituir databaseUser desde persistencia', () => {
    const tenant = Tenant.create(validProps);
    tenant.pullDomainEvents();

    const reconstituted = Tenant.reconstitute({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      cif: tenant.cif,
      type: tenant.type,
      status: tenant.status,
      databaseName: tenant.databaseName,
      databaseUser: 'custom_user',
      contactEmail: tenant.contactEmail,
      createdAt: tenant.createdAt,
    });

    expect(reconstituted.databaseUser).toBe('custom_user');
  });

  it('debería establecer el status como ACTIVE', () => {
    const tenant = Tenant.create(validProps);

    expect(tenant.status.value).toBe('ACTIVE');
  });

  it('debería establecer createdAt como una fecha actual', () => {
    const before = new Date();
    const tenant = Tenant.create(validProps);
    const after = new Date();

    expect(tenant.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(tenant.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // --- create() con datos inválidos ---

  it('debería lanzar error con CIF inválido', () => {
    expect(() => Tenant.create({ ...validProps, cif: 'INVALID' })).toThrow();
  });

  it('debería lanzar error con nombre vacío', () => {
    expect(() => Tenant.create({ ...validProps, name: '' })).toThrow(
      'El nombre del tenant no puede estar vacío',
    );
  });

  it('debería lanzar error con contactEmail vacío', () => {
    expect(() => Tenant.create({ ...validProps, contactEmail: '' })).toThrow(
      'El email de contacto no puede estar vacío',
    );
  });

  // --- reconstitute() ---

  it('debería reconstituir un Tenant sin emitir eventos', () => {
    const tenant = Tenant.create(validProps);
    // Limpiar eventos de la creación
    tenant.pullDomainEvents();

    const reconstituted = Tenant.reconstitute({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      cif: tenant.cif,
      type: tenant.type,
      status: tenant.status,
      databaseName: tenant.databaseName,
      databaseUser: tenant.databaseUser,
      contactEmail: tenant.contactEmail,
      createdAt: tenant.createdAt,
    });

    const events = reconstituted.pullDomainEvents();
    expect(events).toHaveLength(0);
    expect(reconstituted.name).toBe(tenant.name);
    expect(reconstituted.id.equals(tenant.id)).toBe(true);
  });

  // --- Igualdad ---

  it('debería considerar iguales dos tenants con el mismo id', () => {
    const tenant = Tenant.create(validProps);
    tenant.pullDomainEvents();

    const reconstituted = Tenant.reconstitute({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      cif: tenant.cif,
      type: tenant.type,
      status: tenant.status,
      databaseName: tenant.databaseName,
      databaseUser: tenant.databaseUser,
      contactEmail: tenant.contactEmail,
      createdAt: tenant.createdAt,
    });

    expect(tenant.equals(reconstituted)).toBe(true);
  });

  // --- Payload del evento TenantProvisioned ---

  it('debería incluir datos correctos en el payload del TenantProvisionedEvent registrado', () => {
    const tenant = Tenant.create(validProps);
    const event = new TenantProvisionedEvent({
      tenantId: tenant.id.toValue(),
      organizationName: tenant.name,
      organizationType: tenant.type.value,
      adminUserId: 'admin-user-id',
      adminEmail: 'admin@pena.es',
      cif: tenant.cif.value,
    });
    tenant.registerProvisionedEvent(event);
    const events = tenant.pullDomainEvents();
    const emitted = events[0] as TenantProvisionedEvent;

    expect(emitted.payload.tenantId).toBe(tenant.id.toValue());
    expect(emitted.payload.organizationName).toBe('Peña El Buen Gusto');
    expect(emitted.payload.organizationType).toBe('PENA');
    expect(emitted.payload.cif).toBe('A28015550');
    expect(emitted.payload.adminUserId).toBe('admin-user-id');
    expect(emitted.payload.adminEmail).toBe('admin@pena.es');
  });
});
