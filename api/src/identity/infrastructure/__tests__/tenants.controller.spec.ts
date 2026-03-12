import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantsController } from '../controllers/tenants.controller';
import { ProvisionTenantCommand } from '../../application/commands/provision-tenant.command';
import { ProvisionTenantDto } from '../../application/dtos/provision-tenant.dto';
import { TenantProvisionedResponseDto } from '../../application/dtos/tenant-provisioned-response.dto';
import type { CommandBus } from '@nestjs/cqrs';

describe('TenantsController', () => {
  let controller: TenantsController;
  let commandBus: { execute: ReturnType<typeof vi.fn> };

  const validDto = {
    name: 'Peña El Buen Gusto',
    collectivityType: 'PENA',
    cif: 'A28015550',
    contactEmail: 'contacto@pena.es',
    adminName: 'Juan García',
    adminEmail: 'admin@pena.es',
    adminPassword: 'SecurePass123',
  };

  const expectedResponse = new TenantProvisionedResponseDto(
    'tenant-id-123',
    'pena-el-buen-gusto',
    'admin-id-456',
  );

  beforeEach(() => {
    vi.clearAllMocks();

    commandBus = {
      execute: vi.fn().mockResolvedValue(expectedResponse),
    };

    controller = new TenantsController(commandBus as unknown as CommandBus);
  });

  it('debería crear un ProvisionTenantCommand a partir del DTO y ejecutarlo', async () => {
    const result = await controller.provision(validDto as ProvisionTenantDto);

    expect(commandBus.execute).toHaveBeenCalledOnce();

    // Verificar que se creó el comando correcto
    const executedCommand = commandBus.execute.mock.calls[0][0];
    expect(executedCommand).toBeInstanceOf(ProvisionTenantCommand);
    expect(executedCommand.name).toBe('Peña El Buen Gusto');
    expect(executedCommand.collectivityType).toBe('PENA');
    expect(executedCommand.cif).toBe('A28015550');
    expect(executedCommand.contactEmail).toBe('contacto@pena.es');
    expect(executedCommand.adminName).toBe('Juan García');
    expect(executedCommand.adminEmail).toBe('admin@pena.es');
    expect(executedCommand.adminPassword).toBe('SecurePass123');

    // Verificar respuesta
    expect(result).toBe(expectedResponse);
  });

  it('debería retornar el resultado del CommandBus directamente', async () => {
    const result = await controller.provision(validDto as ProvisionTenantDto);

    expect(result.tenantId).toBe('tenant-id-123');
    expect(result.slug).toBe('pena-el-buen-gusto');
    expect(result.adminUserId).toBe('admin-id-456');
  });

  it('debería propagar errores del CommandBus', async () => {
    const error = new Error('Provisioning failed');
    commandBus.execute.mockRejectedValue(error);

    await expect(controller.provision(validDto as ProvisionTenantDto)).rejects.toThrow(
      'Provisioning failed',
    );
  });
});
