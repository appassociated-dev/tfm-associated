import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { ProvisionTenantCommand } from './provision-tenant.command';
import { TenantProvisionedResponseDto } from '../dtos/tenant-provisioned-response.dto';
import { TENANT_REPOSITORY, TenantRepository } from '../../domain/repositories/tenant.repository';
import {
  DATABASE_PROVISIONING_PORT,
  DatabaseProvisioningPort,
} from '../ports/database-provisioning.port';
import { ERROR_REPORTER, ErrorReporter } from '../../../shared/domain';
import { Cif } from '../../domain/value-objects/cif';
import { Tenant } from '../../domain/aggregates/tenant';
import { TenantProvisionedEvent } from '../../domain/events/tenant-provisioned.event';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { CifAlreadyExistsError } from '../../domain/exceptions/cif-already-exists.error';
import { TenantProvisioningFailedError } from '../../domain/exceptions/tenant-provisioning-failed.error';

/**
 * Handler del comando de provisión de tenant.
 * Implementa el patrón saga con compensaciones para garantizar atomicidad.
 * Flujo: validar CIF → crear aggregate → crear BD → usuario DB → permisos → migraciones → roles → admin → guardar.
 */
@CommandHandler(ProvisionTenantCommand)
export class ProvisionTenantHandler implements ICommandHandler<ProvisionTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(DATABASE_PROVISIONING_PORT)
    private readonly databaseProvisioningService: DatabaseProvisioningPort,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
  ) {}

  async execute(command: ProvisionTenantCommand): Promise<TenantProvisionedResponseDto> {
    // 1. Validar unicidad del CIF
    const cifExists = await this.tenantRepository.existsByCif(Cif.create(command.cif));
    if (cifExists) {
      throw new CifAlreadyExistsError(command.cif);
    }

    // 2. Crear aggregate Tenant
    const tenant = Tenant.create({
      name: command.name,
      cif: command.cif,
      type: command.collectivityType,
      contactEmail: command.contactEmail,
    });

    // Variables para rastrear el progreso de la saga (necesarias para rollback)
    let currentStep = 'createDatabase';
    let credentials: { username: string; password: string } | undefined;

    try {
      // 3a. Crear base de datos del tenant
      currentStep = 'createDatabase';
      await this.databaseProvisioningService.createDatabase(tenant.databaseName);

      // 3b. Crear usuario de BD del tenant
      currentStep = 'createDatabaseUser';
      credentials = await this.databaseProvisioningService.createDatabaseUser(
        tenant.databaseName,
        tenant.id.toValue(),
      );

      // 3c. Otorgar permisos al usuario
      currentStep = 'grantPermissions';
      await this.databaseProvisioningService.grantPermissions(
        tenant.databaseName,
        credentials.username,
      );

      // 3d. Construir URL de conexión
      const databaseUrl = this.databaseProvisioningService.buildDatabaseUrl(
        tenant.databaseName,
        credentials.username,
        credentials.password,
      );

      // 3e. Ejecutar migraciones
      currentStep = 'runMigrations';
      await this.databaseProvisioningService.runMigrations(databaseUrl);

      // 3f. Seedear roles predefinidos
      currentStep = 'seedRoles';
      await this.databaseProvisioningService.seedRoles(databaseUrl);

      // 3g. Hashear contraseña del admin con Argon2
      currentStep = 'hashPassword';
      const passwordHash = await argon2.hash(command.adminPassword);

      // 3h. Crear usuario administrador inicial
      currentStep = 'createAdminUser';
      const adminUserId = await this.databaseProvisioningService.createAdminUser({
        databaseUrl,
        email: command.adminEmail,
        name: command.adminName,
        passwordHash,
        roleId: 'PRESIDENT',
      });

      // 3i. Registrar eventos de dominio con datos completos
      currentStep = 'emitEvents';
      tenant.registerProvisionedEvent(
        new TenantProvisionedEvent({
          tenantId: tenant.id.toValue(),
          organizationName: tenant.name,
          organizationType: tenant.type.value,
          adminUserId,
          adminEmail: command.adminEmail,
          cif: tenant.cif.value,
        }),
      );
      tenant.registerProvisionedEvent(
        new UserCreatedEvent({
          userId: adminUserId,
          email: command.adminEmail,
          role: 'PRESIDENT',
          tenantId: tenant.id.toValue(),
          createdAt: new Date(),
        }),
      );

      // 3j. Guardar tenant en DB-Main
      currentStep = 'saveTenant';
      await this.tenantRepository.save(tenant);

      // 4. Retornar respuesta exitosa
      return new TenantProvisionedResponseDto(tenant.id.toValue(), tenant.slug.value, adminUserId);
    } catch (error) {
      // 5. Compensación: rollback de la infraestructura creada
      await this.databaseProvisioningService.rollback(tenant.databaseName, credentials?.username);

      // 6. Reportar error con contexto
      this.errorReporter.captureException(error as Error, {
        step: currentStep,
        tenantId: tenant.id.toValue(),
        tenantName: tenant.name,
        compensations: ['rollback'],
      });

      // 7. Lanzar error de dominio
      throw new TenantProvisioningFailedError(currentStep, error as Error);
    }
  }
}
