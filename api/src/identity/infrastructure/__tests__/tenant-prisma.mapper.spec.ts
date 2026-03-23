import { describe, it, expect } from 'vitest';
import { TenantPrismaMapper, PrismaRawTenant } from '../persistence/tenant-prisma.mapper';
import { Tenant } from '../../domain/aggregates/tenant';

describe('TenantPrismaMapper', () => {
  const rawTenant: PrismaRawTenant = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    slug: 'pena-el-buen-gusto',
    name: 'Peña El Buen Gusto',
    cif: 'A28015550',
    type: 'PENA',
    status: 'ACTIVE',
    databaseName: 'associated_550e8400_e29b_41d4_a716_446655440000',
    databaseUser: 'tenant_550e8400_e29b_41d4_a716_446655440000',
    contactEmail: 'contacto@pena.es',
    createdAt: new Date('2025-01-15T10:00:00Z'),
  };

  describe('toDomain', () => {
    it('debería convertir un registro crudo a un aggregate Tenant con VOs correctos', () => {
      const tenant = TenantPrismaMapper.toDomain(rawTenant);

      expect(tenant.id.toValue()).toBe(rawTenant.id);
      expect(tenant.name).toBe(rawTenant.name);
      expect(tenant.cif.value).toBe(rawTenant.cif);
      expect(tenant.type.value).toBe(rawTenant.type);
      expect(tenant.status.value).toBe(rawTenant.status);
      expect(tenant.databaseName).toBe(rawTenant.databaseName);
      expect(tenant.contactEmail).toBe(rawTenant.contactEmail);
      expect(tenant.createdAt).toEqual(rawTenant.createdAt);
    });

    it('debería generar un slug a partir del nombre', () => {
      const tenant = TenantPrismaMapper.toDomain(rawTenant);

      // El slug se regenera desde el nombre (Slug.fromName)
      expect(tenant.slug.value).toBe('pena-el-buen-gusto');
    });

    it('deberia mapear databaseUser al reconstituir desde persistencia', () => {
      const tenant = TenantPrismaMapper.toDomain(rawTenant);

      expect(tenant.databaseUser).toBe('tenant_550e8400_e29b_41d4_a716_446655440000');
    });

    it('deberia manejar databaseUser null (tenant sin credenciales)', () => {
      const rawWithoutUser: PrismaRawTenant = {
        ...rawTenant,
        databaseUser: undefined,
      };

      const tenant = TenantPrismaMapper.toDomain(rawWithoutUser);

      expect(tenant.databaseUser).toBeUndefined();
    });

    it('no debería emitir eventos de dominio al reconstituir', () => {
      const tenant = TenantPrismaMapper.toDomain(rawTenant);
      const events = tenant.pullDomainEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('toPersistence', () => {
    it('debería convertir un Tenant a un objeto plano con campos camelCase para Prisma Client', () => {
      const tenant = Tenant.create({
        name: 'Cofradía del Santo',
        cif: 'G33340241',
        type: 'COFRADIA',
        contactEmail: 'info@cofradia.es',
      });

      const persisted = TenantPrismaMapper.toPersistence(tenant);

      expect(persisted.id).toBe(tenant.id.toValue());
      expect(persisted.slug).toBe('cofradia-del-santo');
      expect(persisted.name).toBe('Cofradía del Santo');
      expect(persisted.cif).toBe('G33340241');
      expect(persisted.type).toBe('COFRADIA');
      expect(persisted.status).toBe('ACTIVE');
      expect(persisted.databaseName).toBe(tenant.databaseName);
      expect(persisted.contactEmail).toBe('info@cofradia.es');
      expect(persisted.createdAt).toBeInstanceOf(Date);
    });

    it('deberia incluir databaseUser en la persistencia', () => {
      const tenant = Tenant.create({
        name: 'Club Deportivo Test',
        cif: 'A28015550',
        type: 'CLUB_DEPORTIVO',
        contactEmail: 'club@test.es',
      });

      const persisted = TenantPrismaMapper.toPersistence(tenant);

      expect(persisted.databaseUser).toBe(tenant.databaseUser);
      expect(persisted.databaseUser).toMatch(/^tenant_/);
    });

    it('debería usar camelCase como espera el Prisma Client', () => {
      const tenant = Tenant.create({
        name: 'Club Deportivo Ramiro',
        cif: 'A28015550',
        type: 'CLUB_DEPORTIVO',
        contactEmail: 'club@deportivo.es',
      });

      const persisted = TenantPrismaMapper.toPersistence(tenant);

      // Verificar que SÍ tiene camelCase (como espera Prisma Client)
      expect(persisted).toHaveProperty('databaseName');
      expect(persisted).toHaveProperty('contactEmail');
      expect(persisted).toHaveProperty('createdAt');

      // Verificar que NO tiene snake_case (Prisma mapea internamente con @map)
      expect(persisted).not.toHaveProperty('database_name');
      expect(persisted).not.toHaveProperty('contact_email');
      expect(persisted).not.toHaveProperty('created_at');
    });
  });

  describe('roundtrip', () => {
    it('debería mantener los datos al convertir dominio → persistencia → dominio', () => {
      const original = Tenant.create({
        name: 'Asociación Cultural',
        cif: 'A28015550',
        type: 'ASOCIACION_CULTURAL',
        contactEmail: 'cultura@asoc.es',
      });

      const persisted = TenantPrismaMapper.toPersistence(original);

      // Simular lo que Prisma devolvería (camelCase)
      const rawFromDb: PrismaRawTenant = {
        id: persisted.id as string,
        slug: persisted.slug as string,
        name: persisted.name as string,
        cif: persisted.cif as string,
        type: persisted.type as string,
        status: persisted.status as string,
        databaseName: persisted.databaseName as string,
        contactEmail: persisted.contactEmail as string,
        createdAt: persisted.createdAt as Date,
      };

      const reconstituted = TenantPrismaMapper.toDomain(rawFromDb);

      expect(reconstituted.id.toValue()).toBe(original.id.toValue());
      expect(reconstituted.name).toBe(original.name);
      expect(reconstituted.cif.value).toBe(original.cif.value);
      expect(reconstituted.type.value).toBe(original.type.value);
      expect(reconstituted.status.value).toBe(original.status.value);
      expect(reconstituted.databaseName).toBe(original.databaseName);
      expect(reconstituted.contactEmail).toBe(original.contactEmail);
    });
  });
});
