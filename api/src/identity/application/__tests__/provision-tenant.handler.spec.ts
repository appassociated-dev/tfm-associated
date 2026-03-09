import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as argon2 from 'argon2';
import { ProvisionTenantHandler } from '../commands/provision-tenant.handler';
import { ProvisionTenantCommand } from '../commands/provision-tenant.command';
import { CifAlreadyExistsError } from '../../domain/exceptions/cif-already-exists.error';
import { TenantProvisioningFailedError } from '../../domain/exceptions/tenant-provisioning-failed.error';
import { TenantProvisionedEvent } from '../../domain/events/tenant-provisioned.event';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import type { DatabaseProvisioningPort } from '../ports/database-provisioning.port';
import type { ErrorReporter } from '../../../shared/domain';

// Mock de argon2 para evitar cómputo real de hashing en tests unitarios
vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('$argon2id$hashed_password'),
}));

describe('ProvisionTenantHandler', () => {
  let handler: ProvisionTenantHandler;
  let tenantRepository: Record<string, ReturnType<typeof vi.fn>>;
  let databaseProvisioningService: Record<string, ReturnType<typeof vi.fn>>;
  let errorReporter: Record<string, ReturnType<typeof vi.fn>>;

  const validCommand: ProvisionTenantCommand = new ProvisionTenantCommand(
    'Peña El Buen Gusto',
    'PENA',
    'A28015550',
    'contacto@pena.es',
    'Juan García',
    'admin@pena.es',
    'SecurePass123',
  );

  beforeEach(() => {
    vi.clearAllMocks();

    tenantRepository = {
      existsByCif: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByCif: vi.fn(),
      findBySlug: vi.fn(),
    };

    databaseProvisioningService = {
      createDatabase: vi.fn().mockResolvedValue(undefined),
      createDatabaseUser: vi.fn().mockResolvedValue({
        username: 'tenant_user',
        password: 'tenant_pass',
      }),
      grantPermissions: vi.fn().mockResolvedValue(undefined),
      runMigrations: vi.fn().mockResolvedValue(undefined),
      seedRoles: vi.fn().mockResolvedValue(undefined),
      createAdminUser: vi.fn().mockResolvedValue('admin-user-id-123'),
      rollback: vi.fn().mockResolvedValue(undefined),
      buildDatabaseUrl: vi
        .fn()
        .mockReturnValue('postgresql://tenant_user:tenant_pass@localhost:5432/db'),
    };

    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    handler = new ProvisionTenantHandler(
      tenantRepository as unknown as TenantRepository,
      databaseProvisioningService as unknown as DatabaseProvisioningPort,
      errorReporter as unknown as ErrorReporter,
    );
  });

  it('debería provisionar un tenant exitosamente con todos los pasos', async () => {
    const result = await handler.execute(validCommand);

    // Verificar que existsByCif fue llamado
    expect(tenantRepository.existsByCif).toHaveBeenCalledOnce();

    // Verificar que createDatabase fue llamado con el nombre de BD correcto
    expect(databaseProvisioningService.createDatabase).toHaveBeenCalledOnce();
    const dbName = databaseProvisioningService.createDatabase.mock.calls[0][0];
    expect(dbName).toMatch(/^associated_/);

    // Verificar que createDatabaseUser fue llamado
    expect(databaseProvisioningService.createDatabaseUser).toHaveBeenCalledOnce();

    // Verificar que grantPermissions fue llamado
    expect(databaseProvisioningService.grantPermissions).toHaveBeenCalledOnce();

    // Verificar que runMigrations fue llamado
    expect(databaseProvisioningService.runMigrations).toHaveBeenCalledOnce();

    // Verificar que seedRoles fue llamado
    expect(databaseProvisioningService.seedRoles).toHaveBeenCalledOnce();

    // Verificar que createAdminUser fue llamado con password hasheado
    expect(databaseProvisioningService.createAdminUser).toHaveBeenCalledOnce();
    const adminParams = databaseProvisioningService.createAdminUser.mock.calls[0][0];
    expect(adminParams.passwordHash).toBe('$argon2id$hashed_password');
    expect(adminParams.email).toBe('admin@pena.es');
    expect(adminParams.name).toBe('Juan García');
    expect(adminParams.roleId).toBe('PRESIDENT');

    // Verificar que tenantRepository.save fue llamado
    expect(tenantRepository.save).toHaveBeenCalledOnce();

    // Verificar respuesta
    expect(result.tenantId).toBeDefined();
    expect(result.slug).toBe('pena-el-buen-gusto');
    expect(result.adminUserId).toBe('admin-user-id-123');
  });

  it('debería emitir TenantProvisionedEvent y UserCreatedEvent con datos completos', async () => {
    await handler.execute(validCommand);

    // El tenant guardado debe tener ambos eventos registrados
    const savedTenant = tenantRepository.save.mock.calls[0][0];
    const events = savedTenant.pullDomainEvents();

    expect(events).toHaveLength(2);

    // Primer evento: TenantProvisionedEvent con adminUserId y adminEmail
    const tenantEvent = events[0] as TenantProvisionedEvent;
    expect(tenantEvent).toBeInstanceOf(TenantProvisionedEvent);
    expect(tenantEvent.eventType).toBe('tenant.provisioned');
    expect(tenantEvent.payload.adminUserId).toBe('admin-user-id-123');
    expect(tenantEvent.payload.adminEmail).toBe('admin@pena.es');
    expect(tenantEvent.payload.organizationName).toBe('Peña El Buen Gusto');
    expect(tenantEvent.payload.cif).toBe('A28015550');

    // Segundo evento: UserCreatedEvent
    const userEvent = events[1] as UserCreatedEvent;
    expect(userEvent).toBeInstanceOf(UserCreatedEvent);
    expect(userEvent.eventType).toBe('user.created');
    expect(userEvent.payload.userId).toBe('admin-user-id-123');
    expect(userEvent.payload.email).toBe('admin@pena.es');
    expect(userEvent.payload.role).toBe('PRESIDENT');
  });

  it('debería rechazar si el CIF ya existe', async () => {
    tenantRepository.existsByCif.mockResolvedValue(true);

    await expect(handler.execute(validCommand)).rejects.toThrow(CifAlreadyExistsError);

    // No se deberían ejecutar operaciones DDL
    expect(databaseProvisioningService.createDatabase).not.toHaveBeenCalled();
    expect(databaseProvisioningService.createDatabaseUser).not.toHaveBeenCalled();
    expect(databaseProvisioningService.runMigrations).not.toHaveBeenCalled();
  });

  it('debería ejecutar rollback si falla la creación de base de datos', async () => {
    const dbError = new Error('CREATE DATABASE failed');
    databaseProvisioningService.createDatabase.mockRejectedValue(dbError);

    await expect(handler.execute(validCommand)).rejects.toThrow(TenantProvisioningFailedError);

    // Rollback debe haberse ejecutado
    expect(databaseProvisioningService.rollback).toHaveBeenCalledOnce();

    // ErrorReporter debe haberse invocado
    expect(errorReporter.captureException).toHaveBeenCalledOnce();
  });

  it('debería ejecutar rollback si fallan las migraciones', async () => {
    const migrationError = new Error('Migration failed');
    databaseProvisioningService.runMigrations.mockRejectedValue(migrationError);

    await expect(handler.execute(validCommand)).rejects.toThrow(TenantProvisioningFailedError);

    // Rollback con dbName y username
    expect(databaseProvisioningService.rollback).toHaveBeenCalledOnce();
    const rollbackArgs = databaseProvisioningService.rollback.mock.calls[0];
    expect(rollbackArgs[0]).toMatch(/^associated_/);
    expect(rollbackArgs[1]).toBe('tenant_user');

    // ErrorReporter invocado
    expect(errorReporter.captureException).toHaveBeenCalledOnce();
  });

  it('debería ejecutar rollback si falla la creación del admin', async () => {
    const adminError = new Error('Admin creation failed');
    databaseProvisioningService.createAdminUser.mockRejectedValue(adminError);

    await expect(handler.execute(validCommand)).rejects.toThrow(TenantProvisioningFailedError);

    // Rollback ejecutado
    expect(databaseProvisioningService.rollback).toHaveBeenCalledOnce();
  });

  it('debería ejecutar rollback si falla el save del tenant', async () => {
    const saveError = new Error('Save failed');
    tenantRepository.save.mockRejectedValue(saveError);

    await expect(handler.execute(validCommand)).rejects.toThrow(TenantProvisioningFailedError);

    // Rollback ejecutado
    expect(databaseProvisioningService.rollback).toHaveBeenCalledOnce();
  });

  it('debería hashear la contraseña con argon2', async () => {
    await handler.execute(validCommand);

    // Verificar que argon2.hash fue llamado con la contraseña en texto plano
    expect(argon2.hash).toHaveBeenCalledWith('SecurePass123');

    // Verificar que el password hasheado se pasó a createAdminUser
    const adminParams = databaseProvisioningService.createAdminUser.mock.calls[0][0];
    expect(adminParams.passwordHash).not.toBe('SecurePass123');
    expect(adminParams.passwordHash).toBe('$argon2id$hashed_password');
  });

  it('debería reportar el contexto del error al ErrorReporter en caso de fallo', async () => {
    const error = new Error('Step failure');
    databaseProvisioningService.seedRoles.mockRejectedValue(error);

    await expect(handler.execute(validCommand)).rejects.toThrow(TenantProvisioningFailedError);

    expect(errorReporter.captureException).toHaveBeenCalledOnce();
    const [reportedError, context] = errorReporter.captureException.mock.calls[0];
    expect(reportedError).toBe(error);
    expect(context).toHaveProperty('step');
    expect(context).toHaveProperty('tenantId');
  });
});
