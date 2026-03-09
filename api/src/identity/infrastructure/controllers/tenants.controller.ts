import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProvisionTenantDto } from '../../application/dtos/provision-tenant.dto';
import { TenantProvisionedResponseDto } from '../../application/dtos/tenant-provisioned-response.dto';
import { ProvisionTenantCommand } from '../../application/commands/provision-tenant.command';
import { SuperadminGuard } from '../guards/superadmin.guard';

/**
 * Controlador REST para la gestión de tenants (colectividades).
 * Endpoint base: /api/v1/tenants
 */
@ApiTags('Tenants')
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Provisiona un nuevo tenant con su BD aislada, roles y usuario administrador.
   * Flujo completo: crear BD → usuario PG → permisos → migraciones → roles → admin.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SuperadminGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Provisionar un nuevo tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant provisionado exitosamente',
    type: TenantProvisionedResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'CIF ya existe en otro tenant',
  })
  @ApiResponse({
    status: 422,
    description: 'Datos de entrada inválidos',
  })
  async provision(@Body() dto: ProvisionTenantDto): Promise<TenantProvisionedResponseDto> {
    const command = new ProvisionTenantCommand(
      dto.name,
      dto.collectivityType,
      dto.cif,
      dto.contactEmail,
      dto.adminName,
      dto.adminEmail,
      dto.adminPassword,
    );

    return this.commandBus.execute(command);
  }
}
