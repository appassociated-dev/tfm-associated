import {
  Controller,
  Post,
  Get,
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
import { OpenFiscalYearDto } from '../../application/dtos/open-fiscal-year.dto';
import { CloseFiscalYearDto } from '../../application/dtos/close-fiscal-year.dto';
import { FiscalYearResponseDto } from '../../application/dtos/fiscal-year-response.dto';
import { OpenFiscalYearResultDto } from '../../application/dtos/open-fiscal-year-result.dto';
import { CloseFiscalYearResultDto } from '../../application/dtos/close-fiscal-year-result.dto';
import { FiscalYearComparisonDto } from '../../application/dtos/fiscal-year-comparison.dto';
import { OpenFiscalYearCommand } from '../../application/commands/open-fiscal-year.command';
import { CloseFiscalYearCommand } from '../../application/commands/close-fiscal-year.command';
import { GetFiscalYearQuery } from '../../application/queries/get-fiscal-year.query';
import { GetActiveFiscalYearQuery } from '../../application/queries/get-active-fiscal-year.query';
import { ListFiscalYearsQuery } from '../../application/queries/list-fiscal-years.query';
import { CompareFiscalYearsQuery } from '../../application/queries/compare-fiscal-years.query';

/**
 * Controlador REST para la gestión de ejercicios fiscales (UC-010).
 * Endpoint base: /api/v1/fiscal-years
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Fiscal Years')
@ApiBearerAuth()
@Controller('v1/fiscal-years')
export class FiscalYearsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Crea y abre un nuevo ejercicio fiscal en el tenant actual.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('membership:fiscal-years:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear y abrir un ejercicio fiscal' })
  @ApiResponse({
    status: 201,
    description: 'Ejercicio fiscal creado y abierto exitosamente',
    type: OpenFiscalYearResultDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un ejercicio fiscal abierto o con nombre duplicado',
  })
  @ApiResponse({ status: 422, description: 'Datos inválidos o periodo solapado' })
  async create(
    @Body() dto: OpenFiscalYearDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<OpenFiscalYearResultDto> {
    const command = new OpenFiscalYearCommand(
      req.tenantId,
      dto.name,
      dto.type,
      dto.startDate,
      dto.endDate,
      dto.previousFiscalYearId ?? null,
      dto.carryOverMembers,
      dto.applyAutomaticTransitions,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista todos los ejercicios fiscales del tenant actual.
   */
  @Get()
  @RequirePermissions('membership:fiscal-years:read')
  @ApiOperation({ summary: 'Listar ejercicios fiscales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ejercicios fiscales',
    type: [FiscalYearResponseDto],
  })
  async list(@Req() req: Request & { tenantId: string }): Promise<FiscalYearResponseDto[]> {
    const query = new ListFiscalYearsQuery(req.tenantId);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene el ejercicio fiscal activo (en estado OPEN).
   * IMPORTANTE: Esta ruta debe estar ANTES de GET /:id para evitar conflictos.
   */
  @Get('active')
  @RequirePermissions('membership:fiscal-years:read')
  @ApiOperation({ summary: 'Obtener el ejercicio fiscal activo' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio fiscal activo encontrado',
    type: FiscalYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No hay ejercicio fiscal activo' })
  async getActive(@Req() req: Request & { tenantId: string }): Promise<FiscalYearResponseDto> {
    const query = new GetActiveFiscalYearQuery(req.tenantId);
    return this.queryBus.execute(query);
  }

  /**
   * Compara estadísticas entre ejercicios fiscales.
   * IMPORTANTE: Esta ruta debe estar ANTES de GET /:id para evitar conflictos.
   */
  @Get('compare')
  @RequirePermissions('membership:fiscal-years:read')
  @ApiOperation({ summary: 'Comparar ejercicios fiscales' })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description: 'UUIDs separados por coma de los ejercicios a comparar',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparación de ejercicios fiscales',
    type: FiscalYearComparisonDto,
  })
  async compare(
    @Req() req: Request & { tenantId: string },
    @Query('ids') ids: string,
  ): Promise<FiscalYearComparisonDto> {
    const fiscalYearIds = ids.split(',').map((id) => id.trim());
    const query = new CompareFiscalYearsQuery(req.tenantId, fiscalYearIds);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene un ejercicio fiscal por su ID.
   */
  @Get(':id')
  @RequirePermissions('membership:fiscal-years:read')
  @ApiOperation({ summary: 'Obtener un ejercicio fiscal por ID' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio fiscal encontrado',
    type: FiscalYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ejercicio fiscal no encontrado' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<FiscalYearResponseDto> {
    const query = new GetFiscalYearQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Cierra un ejercicio fiscal existente.
   * Permite forzar el cierre ignorando advertencias pendientes.
   */
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:fiscal-years:close')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Cerrar un ejercicio fiscal' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio fiscal cerrado exitosamente',
    type: CloseFiscalYearResultDto,
  })
  @ApiResponse({ status: 404, description: 'Ejercicio fiscal no encontrado' })
  @ApiResponse({ status: 422, description: 'No se puede cerrar el ejercicio fiscal' })
  async close(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CloseFiscalYearDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<CloseFiscalYearResultDto> {
    const command = new CloseFiscalYearCommand(req.tenantId, id, dto.force);
    return this.commandBus.execute(command);
  }
}
