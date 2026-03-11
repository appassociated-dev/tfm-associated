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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { GenerateMonthlyChargesDto } from '../../application/dtos/generate-monthly-charges.dto';
import { GenerateSubscriptionChargesDto } from '../../application/dtos/generate-subscription-charges.dto';
import { GenerationResultDto } from '../../application/dtos/generation-result.dto';
import { ChargeResponseDto } from '../../application/dtos/charge-response.dto';
import { GenerateMonthlyChargesCommand } from '../../application/commands/generate-monthly-charges.command';
import { GenerateSubscriptionChargesCommand } from '../../application/commands/generate-subscription-charges.command';
import { GetChargesByAccountQuery } from '../../application/queries/get-charges-by-account.query';

/**
 * Controlador REST para operaciones globales de cargos (UC-019).
 * Endpoint base: /api/v1/treasury/charges
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Charges')
@Controller('v1/treasury/charges')
export class ChargesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Genera cargos periódicos masivos para un mes/año dado.
   * Evalúa todas las suscripciones activas y genera cargos según billingMonths del plan.
   */
  @Post('generate-monthly')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('treasury:charges:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Generar cargos mensuales masivos' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la generación masiva de cargos',
    type: GenerationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async generateMonthly(
    @Body() dto: GenerateMonthlyChargesDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<GenerationResultDto> {
    const command = new GenerateMonthlyChargesCommand(req.tenantId, dto.month, dto.year);

    return this.commandBus.execute(command);
  }

  /**
   * Consulta el log de generación de cargos para un periodo dado.
   * Por ahora retorna array vacío — implementación completa en UC posterior.
   */
  @Get('generation-log')
  @RequirePermissions('treasury:charges:read')
  @ApiOperation({ summary: 'Consultar log de generación de cargos' })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Mes (1-12)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Año' })
  @ApiResponse({
    status: 200,
    description: 'Log de generación (vacío en MVP — implementación futura)',
  })
  async getGenerationLog(
    @Query('month') _month?: number,
    @Query('year') _year?: number,
    @Req() _req?: Request & { tenantId: string },
  ): Promise<unknown[]> {
    // Implementación futura — por ahora retorna array vacío
    return [];
  }
}

/**
 * Controlador REST para cargos asociados a una cuenta de socio (UC-019).
 * Endpoint base: /api/v1/treasury/member-accounts/:accountId/charges
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Charges')
@Controller('v1/treasury/member-accounts/:accountId/charges')
export class MemberAccountChargesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Lista los cargos de una cuenta de socio, opcionalmente filtrados por estado.
   */
  @Get()
  @RequirePermissions('treasury:charges:read')
  @ApiOperation({ summary: 'Listar cargos de una cuenta de socio' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Estado del cargo (PENDING, PAID, PARTIALLY_PAID, RETURNED, CANCELLED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos de la cuenta',
    type: [ChargeResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  async list(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Query('status') status: string | undefined,
    @Req() req: Request & { tenantId: string },
  ): Promise<ChargeResponseDto[]> {
    const query = new GetChargesByAccountQuery(req.tenantId, accountId, status);
    return this.queryBus.execute(query);
  }

  /**
   * Genera cargos prorrateados para una suscripción específica dentro de una cuenta.
   * Se usa al crear una nueva suscripción a mitad de ejercicio fiscal.
   */
  @Post('generate-subscription')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:charges:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Generar cargos prorrateados para una suscripción' })
  @ApiResponse({
    status: 201,
    description: 'Cargos generados exitosamente',
    type: [ChargeResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Cuenta o suscripción no encontrada' })
  @ApiResponse({ status: 422, description: 'Plan de cuota no encontrado o inactivo' })
  async generateSubscriptionCharges(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() dto: GenerateSubscriptionChargesDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<ChargeResponseDto[]> {
    const command = new GenerateSubscriptionChargesCommand(
      req.tenantId,
      accountId,
      dto.subscriptionId,
    );

    return this.commandBus.execute(command);
  }
}
