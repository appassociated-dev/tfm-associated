import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { CreateFeePlanDto } from '../../application/dtos/create-fee-plan.dto';
import { UpdateFeePlanDto } from '../../application/dtos/update-fee-plan.dto';
import { LinkMemberTypesDto } from '../../application/dtos/link-member-types.dto';
import { ImportTemplateDto } from '../../application/dtos/import-template.dto';
import { FeePlanResponseDto } from '../../application/dtos/fee-plan-response.dto';
import { FeePlanTemplateResponseDto } from '../../application/dtos/fee-plan-template-response.dto';
import { CreateFeePlanCommand } from '../../application/commands/create-fee-plan.command';
import { UpdateFeePlanCommand } from '../../application/commands/update-fee-plan.command';
import { DeactivateFeePlanCommand } from '../../application/commands/deactivate-fee-plan.command';
import { ActivateFeePlanCommand } from '../../application/commands/activate-fee-plan.command';
import { ImportFeePlanTemplateCommand } from '../../application/commands/import-fee-plan-template.command';
import { LinkMemberTypesCommand } from '../../application/commands/link-member-types.command';
import { GetFeePlanQuery } from '../../application/queries/get-fee-plan.query';
import { ListFeePlansQuery } from '../../application/queries/list-fee-plans.query';
import { GetFeePlanTemplatesQuery } from '../../application/queries/get-fee-plan-templates.query';

/**
 * Controlador REST para la gestión de planes de cuota (UC-017).
 * Endpoint base: /api/v1/treasury/fee-plans
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 *
 * IMPORTANTE: Las rutas estáticas (templates, import-template) se declaran
 * ANTES de las rutas con parámetro (:id) para evitar conflictos de enrutamiento.
 */
@ApiTags('Fee Plans')
@Controller('v1/treasury/fee-plans')
export class FeePlansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── Rutas estáticas (sin :id) ──────────────────────────────────

  /**
   * Crea un nuevo plan de cuota en el tenant actual.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:fee-plans:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear un plan de cuota' })
  @ApiResponse({
    status: 201,
    description: 'Plan de cuota creado exitosamente',
    type: FeePlanResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Código ya existe' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async create(
    @Body() dto: CreateFeePlanDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<FeePlanResponseDto> {
    // Para ONE_TIME, la frecuencia no aplica pero el dominio requiere un valor válido
    const frequency = dto.frequency ?? (dto.type === 'ONE_TIME' ? 'MONTHLY' : 'MONTHLY');

    const command = new CreateFeePlanCommand(
      req.tenantId,
      dto.code,
      dto.name,
      dto.description ?? null,
      dto.type,
      frequency,
      dto.amount,
      dto.billingMonths,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista todos los planes de cuota del tenant actual.
   * Permite filtrar por estado activo/inactivo y por tipo de socio (REQ-SPU-005).
   * Cuando se filtra por memberTypeId, el DTO incluye isDefault y displayOrder (REQ-SPU-006).
   */
  @Get()
  @RequirePermissions('treasury:fee-plans:read')
  @ApiOperation({ summary: 'Listar planes de cuota' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiQuery({
    name: 'memberTypeId',
    required: false,
    type: String,
    description:
      'Filtrar por tipo de socio (UUID). Devuelve solo planes vinculados, con isDefault y displayOrder (REQ-SPU-005, REQ-SPU-006)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planes de cuota',
    type: [FeePlanResponseDto],
  })
  async list(
    @Req() req: Request & { tenantId: string },
    @Query('active') active?: string,
    @Query('memberTypeId') memberTypeId?: string,
  ): Promise<FeePlanResponseDto[]> {
    // Validar memberTypeId como UUID v4 cuando está presente (ParseUUIDPipe no soporta opcionales)
    if (memberTypeId !== undefined) {
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4Regex.test(memberTypeId)) {
        throw new BadRequestException('memberTypeId debe ser un UUID v4 válido.');
      }
    }

    const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;

    const query = new ListFeePlansQuery(req.tenantId, activeFilter, memberTypeId);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene las plantillas de planes de cuota disponibles para un tipo de colectividad.
   */
  @Get('templates')
  @RequirePermissions('treasury:fee-plans:read')
  @ApiOperation({ summary: 'Obtener plantillas de planes de cuota' })
  @ApiQuery({
    name: 'collectivityType',
    required: true,
    type: String,
    description: 'Tipo de colectividad (ASSOCIATION, CLUB, FEDERATION)',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantillas disponibles',
    type: [FeePlanTemplateResponseDto],
  })
  async getTemplates(
    @Query('collectivityType') collectivityType: string,
  ): Promise<FeePlanTemplateResponseDto[]> {
    const query = new GetFeePlanTemplatesQuery(collectivityType);
    return this.queryBus.execute(query);
  }

  /**
   * Importa plantillas de planes de cuota predefinidos para el tipo de colectividad.
   */
  @Post('import-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:fee-plans:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Importar plantillas de planes de cuota' })
  @ApiResponse({
    status: 201,
    description: 'Plantillas importadas exitosamente',
    type: [FeePlanResponseDto],
  })
  async importTemplate(
    @Body() dto: ImportTemplateDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<FeePlanResponseDto[]> {
    const command = new ImportFeePlanTemplateCommand(req.tenantId, dto.collectivityType);
    return this.commandBus.execute(command);
  }

  // ─── Rutas con parámetro (:id) ──────────────────────────────────

  /**
   * Obtiene un plan de cuota por su ID.
   */
  @Get(':id')
  @RequirePermissions('treasury:fee-plans:read')
  @ApiOperation({ summary: 'Obtener un plan de cuota por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan de cuota encontrado',
    type: FeePlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan de cuota no encontrado' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<FeePlanResponseDto> {
    const query = new GetFeePlanQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Actualiza un plan de cuota existente.
   * El código no se puede modificar.
   */
  @Put(':id')
  @RequirePermissions('treasury:fee-plans:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Actualizar un plan de cuota' })
  @ApiResponse({
    status: 200,
    description: 'Plan de cuota actualizado',
    type: FeePlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan de cuota no encontrado' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateFeePlanDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<FeePlanResponseDto> {
    // Para ONE_TIME, la frecuencia no aplica pero el dominio requiere un valor válido
    const frequency = dto.frequency ?? (dto.type === 'ONE_TIME' ? 'MONTHLY' : 'MONTHLY');

    const command = new UpdateFeePlanCommand(
      req.tenantId,
      id,
      dto.name,
      dto.description ?? null,
      dto.type,
      frequency,
      dto.amount,
      dto.billingMonths,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Desactiva un plan de cuota (soft delete).
   * No permite desactivar si tiene suscripciones activas.
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('treasury:fee-plans:update')
  @ApiOperation({ summary: 'Desactivar un plan de cuota' })
  @ApiResponse({ status: 204, description: 'Plan de cuota desactivado' })
  @ApiResponse({ status: 404, description: 'Plan de cuota no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede desactivar porque tiene suscripciones activas',
  })
  async deactivate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<void> {
    const command = new DeactivateFeePlanCommand(req.tenantId, id);
    await this.commandBus.execute(command);
  }

  /**
   * Activa un plan de cuota inactivo.
   */
  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('treasury:fee-plans:update')
  @ApiOperation({ summary: 'Activar un plan de cuota' })
  @ApiResponse({ status: 204, description: 'Plan de cuota activado' })
  @ApiResponse({ status: 404, description: 'Plan de cuota no encontrado' })
  async activate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<void> {
    const command = new ActivateFeePlanCommand(req.tenantId, id);
    await this.commandBus.execute(command);
  }

  /**
   * Vincula tipos de socio a un plan de cuota.
   * Permite definir plan por defecto y orden de presentación.
   */
  @Post(':id/link-member-types')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('treasury:fee-plans:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Vincular tipos de socio a un plan de cuota' })
  @ApiResponse({
    status: 204,
    description: 'Tipos de socio vinculados exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Plan de cuota no encontrado' })
  @ApiResponse({ status: 422, description: 'Datos inválidos o tipo de socio no encontrado' })
  async linkMemberTypes(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: LinkMemberTypesDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<void> {
    const command = new LinkMemberTypesCommand(
      req.tenantId,
      id,
      dto.links.map((link) => ({
        memberTypeId: link.memberTypeId,
        isDefault: link.isDefault,
        order: link.order,
      })),
    );
    await this.commandBus.execute(command);
  }
}
