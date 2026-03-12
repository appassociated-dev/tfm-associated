import {
  Controller,
  Post,
  Get,
  Put,
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
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { CreateMemberDto } from '../../application/dtos/create-member.dto';
import { UpdateMemberDto } from '../../application/dtos/update-member.dto';
import { MemberResponseDto } from '../../application/dtos/member-response.dto';
import { MemberListResponseDto } from '../../application/dtos/member-list-response.dto';
import { CreateMemberCommand } from '../../application/commands/create-member.command';
import { UpdateMemberCommand } from '../../application/commands/update-member.command';
import { GetMemberQuery } from '../../application/queries/get-member.query';
import { ListMembersQuery } from '../../application/queries/list-members.query';

/**
 * Controlador REST para la gestión de fichas de socio (UC-006).
 * Endpoint base: /api/v1/members
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Members')
@ApiBearerAuth()
@Controller('v1/members')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MembersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Crea un nuevo socio con ficha completa.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('membership:members:create')
  @ApiOperation({ summary: 'Crear un socio con ficha completa' })
  @ApiResponse({
    status: 201,
    description: 'Socio creado exitosamente',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 409, description: 'DNI o email duplicado' })
  @ApiResponse({ status: 422, description: 'Datos inválidos o edad incompatible' })
  async create(
    @Body() dto: CreateMemberDto,
    @Req() req: Request & { tenantId: string; user: { userId: string } },
  ): Promise<MemberResponseDto> {
    const command = new CreateMemberCommand(
      req.tenantId,
      dto.name,
      dto.surnames,
      dto.birthDate,
      dto.documentType,
      dto.documentNumber,
      dto.email,
      dto.phone ?? null,
      dto.address ?? null,
      dto.postalCode ?? null,
      dto.city ?? null,
      dto.iban ?? null,
      dto.memberTypeId,
      dto.customFields ?? {},
      dto.initialStatus ?? 'ACTIVE',
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista socios con filtros opcionales.
   */
  @Get()
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Listar socios con filtros' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrar por estado (ACTIVE, APPLICANT, SUSPENDED, etc.)',
  })
  @ApiQuery({
    name: 'memberTypeId',
    required: false,
    type: String,
    description: 'Filtrar por tipo de socio (UUID)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda textual por nombre, apellidos o email',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de socios',
    type: [MemberListResponseDto],
  })
  async list(
    @Req() req: Request & { tenantId: string },
    @Query('status') status?: string,
    @Query('memberTypeId') memberTypeId?: string,
    @Query('search') search?: string,
  ): Promise<MemberListResponseDto[]> {
    const query = new ListMembersQuery(req.tenantId, status, memberTypeId, search);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene la ficha completa de un socio por ID.
   */
  @Get(':id')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Obtener ficha de socio por ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Ficha del socio',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<MemberResponseDto> {
    const query = new GetMemberQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Actualiza los datos de un socio existente.
   * No permite cambiar documentType ni documentNumber (inmutables).
   */
  @Put(':id')
  @RequirePermissions('membership:members:update')
  @ApiOperation({ summary: 'Actualizar datos de un socio' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Socio actualizado',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 409, description: 'Email duplicado o conflicto de concurrencia' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<MemberResponseDto> {
    const command = new UpdateMemberCommand(
      req.tenantId,
      id,
      dto.name,
      dto.surnames,
      dto.email,
      dto.phone,
      dto.address,
      dto.postalCode,
      dto.city,
      dto.iban,
      dto.customFields,
    );

    return this.commandBus.execute(command);
  }
}
