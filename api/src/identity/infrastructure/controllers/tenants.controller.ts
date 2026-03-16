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
import { Public } from '../auth/public.decorator';

/**
 * Controlador REST para la gestión de tenants (colectividades).
 * Endpoint base: /api/v1/tenants
 *
 * ARQUITECTURA: @Public() + @UseGuards(SuperadminGuard) es el patrón CORRECTO
 * y DEFINITIVO para endpoints de bootstrap/provisión (UC-001, ADR-006, ADR-007).
 *
 * Razonamiento:
 * - La provisión es una operación de bootstrap: no puede existir un JWT válido
 *   antes de que exista el tenant, los roles y el usuario administrador inicial.
 *   Esto crea un chicken-and-egg: sin tenant no hay usuario, sin usuario no hay JWT.
 * - @Public() desactiva el JwtAuthGuard global (ADR-006), permitiendo que el request
 *   avance sin un Bearer token. Esto NO deja el endpoint abierto.
 * - @UseGuards(SuperadminGuard) protege el endpoint con un mecanismo alternativo:
 *   valida un API Key estático vía header X-Api-Key (ADR-007, RNF-003).
 *   Solo el administrador del sistema posee esta clave.
 * - Este patrón es exclusivo para operaciones de infraestructura que preceden al
 *   ciclo de vida del tenant. NO debe replicarse para endpoints de negocio regulares.
 *
 * Refs: UC-001 (provisión de tenant), ADR-006 (JWT + Passport), ADR-007 (RBAC Guards)
 */
@ApiTags('Tenants')
@Controller('v1/tenants')
export class TenantsController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Provisiona un nuevo tenant con su BD aislada, roles y usuario administrador.
   * Flujo completo: crear BD → usuario PG → permisos → migraciones → roles → admin.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
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
