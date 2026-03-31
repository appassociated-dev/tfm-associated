import {
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { CreateMemberTypeDto } from '../../application/dtos/create-member-type.dto';
import { UpdateMemberTypeDto } from '../../application/dtos/update-member-type.dto';
import { ImportTemplateDto } from '../../application/dtos/import-template.dto';
import { MemberTypeResponseDto } from '../../application/dtos/member-type-response.dto';
import { MemberTypeTemplateDto } from '../../application/dtos/member-type-template.dto';
import { CreateMemberTypeCommand } from '../../application/commands/create-member-type.command';
import { UpdateMemberTypeCommand } from '../../application/commands/update-member-type.command';
import { DeactivateMemberTypeCommand } from '../../application/commands/deactivate-member-type.command';
import { ImportTemplateCommand } from '../../application/commands/import-template.command';
import { GetMemberTypeQuery } from '../../application/queries/get-member-type.query';
import { ListMemberTypesQuery } from '../../application/queries/list-member-types.query';
import { GetTemplatesQuery } from '../../application/queries/get-templates.query';

/**
 * Controlador REST para la gestión de tipos de socio (UC-008).
 * Endpoint base: /api/v1/member-types
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Member Types')
@ApiBearerAuth()
@Controller('v1/member-types')
export class MemberTypesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Crea un nuevo tipo de socio en el tenant actual.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('membership:member-types:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear un tipo de socio' })
  @ApiResponse({
    status: 201,
    description: 'Tipo de socio creado exitosamente',
    type: MemberTypeResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Código ya existe' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async create(
    @Body() dto: CreateMemberTypeDto,
    @Req() req: Request & { tenantId: string; user: { tenantType?: string } },
  ): Promise<MemberTypeResponseDto> {
    const command = new CreateMemberTypeCommand(
      req.tenantId,
      dto.code,
      dto.name,
      dto.description ?? '',
      dto.ageRangeMin ?? null,
      dto.ageRangeMax ?? null,
      dto.votingRight,
      dto.eligibleForOffice,
      dto.minimumSeniorityForVoting,
      dto.minimumSeniorityForOffice,
      dto.automaticTransitionTargetId ?? null,
      dto.rulesConfig,
      req.user?.tenantType ?? 'PENA',
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista todos los tipos de socio del tenant actual.
   * Permite filtrar por estado activo/inactivo.
   */
  @Get()
  @RequirePermissions('membership:member-types:read')
  @ApiOperation({ summary: 'Listar tipos de socio' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de socio',
    type: [MemberTypeResponseDto],
  })
  async list(
    @Req() req: Request & { tenantId: string },
    @Query('active') active?: string,
  ): Promise<MemberTypeResponseDto[]> {
    const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;

    const query = new ListMemberTypesQuery(req.tenantId, activeFilter);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene las plantillas de tipos de socio disponibles para un tipo de colectividad.
   */
  @Get('templates')
  @RequirePermissions('membership:member-types:read')
  @ApiOperation({ summary: 'Obtener plantillas de tipos de socio' })
  @ApiQuery({
    name: 'collectivityType',
    required: true,
    type: String,
    description: 'Tipo de colectividad (PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL)',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantillas disponibles',
    type: [MemberTypeTemplateDto],
  })
  async getTemplates(
    @Query('collectivityType') collectivityType: string,
  ): Promise<MemberTypeTemplateDto[]> {
    const query = new GetTemplatesQuery(collectivityType);
    return this.queryBus.execute(query);
  }

  /**
   * Importa plantillas de tipos de socio predefinidos para el tipo de colectividad.
   */
  @Post('import-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('membership:member-types:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Importar plantillas de tipos de socio' })
  @ApiResponse({
    status: 201,
    description: 'Plantillas importadas exitosamente',
    type: [MemberTypeResponseDto],
  })
  async importTemplate(
    @Body() dto: ImportTemplateDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<MemberTypeResponseDto[]> {
    const command = new ImportTemplateCommand(req.tenantId, dto.collectivityType);
    return this.commandBus.execute(command);
  }

  /**
   * Obtiene un tipo de socio por su ID.
   */
  @Get(':id')
  @RequirePermissions('membership:member-types:read')
  @ApiOperation({ summary: 'Obtener un tipo de socio por ID' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de socio encontrado',
    type: MemberTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo de socio no encontrado' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<MemberTypeResponseDto> {
    const query = new GetMemberTypeQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Actualiza un tipo de socio existente.
   * El código no se puede modificar.
   */
  @Put(':id')
  @RequirePermissions('membership:member-types:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Actualizar un tipo de socio' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de socio actualizado',
    type: MemberTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo de socio no encontrado' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateMemberTypeDto,
    @Req() req: Request & { tenantId: string; user: { tenantType?: string } },
  ): Promise<MemberTypeResponseDto> {
    const command = new UpdateMemberTypeCommand(
      req.tenantId,
      id,
      dto.name,
      dto.description ?? '',
      dto.ageRangeMin ?? null,
      dto.ageRangeMax ?? null,
      dto.votingRight,
      dto.eligibleForOffice,
      dto.minimumSeniorityForVoting,
      dto.minimumSeniorityForOffice,
      dto.automaticTransitionTargetId ?? null,
      dto.rulesConfig,
      req.user?.tenantType ?? 'PENA',
    );

    return this.commandBus.execute(command);
  }

  /**
   * Desactiva un tipo de socio (soft delete).
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('membership:member-types:update')
  @ApiOperation({ summary: 'Desactivar un tipo de socio' })
  @ApiResponse({ status: 204, description: 'Tipo de socio desactivado' })
  @ApiResponse({ status: 404, description: 'Tipo de socio no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede desactivar porque es destino de transición',
  })
  async deactivate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<void> {
    const command = new DeactivateMemberTypeCommand(req.tenantId, id);
    await this.commandBus.execute(command);
  }
}
