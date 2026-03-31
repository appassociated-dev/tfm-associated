import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { CreateSubscriptionDto } from '../../application/dtos/create-subscription.dto';
import { ChangePlanDto } from '../../application/dtos/change-plan.dto';
import { CloseSubscriptionDto } from '../../application/dtos/close-subscription.dto';
import { UpdateDiscountDto } from '../../application/dtos/update-discount.dto';
import { SubscriptionResponseDto } from '../../application/dtos/subscription-response.dto';
import { SubscriptionHistoryResponseDto } from '../../application/dtos/subscription-history-response.dto';
import { CreateSubscriptionCommand } from '../../application/commands/create-subscription.command';
import { ChangeSubscriptionPlanCommand } from '../../application/commands/change-subscription-plan.command';
import { CloseSubscriptionCommand } from '../../application/commands/close-subscription.command';
import { UpdateSubscriptionDiscountCommand } from '../../application/commands/update-subscription-discount.command';
import { GetSubscriptionsQuery } from '../../application/queries/get-subscriptions.query';
import { GetActiveSubscriptionQuery } from '../../application/queries/get-active-subscription.query';

/**
 * Controlador REST para la gestión de suscripciones a planes de cuota (UC-018).
 * Endpoint base: /api/v1/treasury/member-accounts/:accountId/subscriptions
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 *
 * IMPORTANTE: Las rutas estáticas (active) se declaran
 * ANTES de las rutas con parámetro (:id) para evitar conflictos de enrutamiento.
 */
@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('v1/treasury/member-accounts/:accountId/subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── Rutas estáticas (sin :id) ──────────────────────────────────

  /**
   * Crea una nueva suscripción a un plan de cuota para la cuenta indicada.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:subscriptions:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear una suscripción a un plan de cuota' })
  @ApiResponse({
    status: 201,
    description: 'Suscripción creada exitosamente',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe una suscripción periódica activa' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async create(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() dto: CreateSubscriptionDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<SubscriptionResponseDto> {
    const command = new CreateSubscriptionCommand(
      req.tenantId,
      accountId,
      dto.feePlanId,
      dto.typeDiscount,
      dto.personalDiscount ?? 0,
      dto.personalDiscountReason ?? null,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista el historial de suscripciones de la cuenta de socio.
   */
  @Get()
  @RequirePermissions('treasury:subscriptions:read')
  @ApiOperation({ summary: 'Listar historial de suscripciones' })
  @ApiResponse({
    status: 200,
    description: 'Historial de suscripciones',
    type: SubscriptionHistoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  async list(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<SubscriptionHistoryResponseDto> {
    const query = new GetSubscriptionsQuery(req.tenantId, accountId);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene la suscripción periódica activa de la cuenta de socio.
   */
  @Get('active')
  @RequirePermissions('treasury:subscriptions:read')
  @ApiOperation({ summary: 'Obtener suscripción activa' })
  @ApiResponse({
    status: 200,
    description: 'Suscripción activa encontrada',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No existe suscripción activa' })
  async getActive(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<SubscriptionResponseDto> {
    const query = new GetActiveSubscriptionQuery(req.tenantId, accountId);
    return this.queryBus.execute(query);
  }

  // ─── Rutas con parámetro (:id) ──────────────────────────────────

  /**
   * Cambia el plan de cuota de una suscripción activa.
   * Cierra la suscripción actual y crea una nueva con el plan indicado.
   */
  @Post(':id/change-plan')
  @RequirePermissions('treasury:subscriptions:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Cambiar plan de cuota de una suscripción' })
  @ApiResponse({
    status: 200,
    description: 'Plan cambiado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Suscripción o cuenta no encontrada' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async changePlan(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ChangePlanDto,
    @Req() req: Request & { tenantId: string },
  ) {
    const command = new ChangeSubscriptionPlanCommand(
      req.tenantId,
      accountId,
      id,
      dto.newFeePlanId,
      new Date(dto.effectiveDate),
      dto.maintainDiscount ?? false,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Actualiza el descuento personal de una suscripción activa.
   * Recalcula el importe efectivo con el nuevo descuento.
   */
  @Patch(':id/discount')
  @RequirePermissions('treasury:subscriptions:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Actualizar descuento de una suscripción' })
  @ApiResponse({
    status: 200,
    description: 'Descuento actualizado exitosamente',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Suscripción o cuenta no encontrada' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async updateDiscount(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateDiscountDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<SubscriptionResponseDto> {
    const command = new UpdateSubscriptionDiscountCommand(
      req.tenantId,
      accountId,
      id,
      dto.newPersonalDiscount,
      dto.reason,
      dto.approvedBy ?? null,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Cierra (da de baja) una suscripción activa con un motivo de cancelación.
   */
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('treasury:subscriptions:update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Cerrar una suscripción' })
  @ApiResponse({ status: 200, description: 'Suscripción cerrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Suscripción o cuenta no encontrada' })
  async close(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CloseSubscriptionDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<{ message: string; subscriptionId: string; closedAt: Date }> {
    const command = new CloseSubscriptionCommand(req.tenantId, accountId, id, dto.cancelReason);
    await this.commandBus.execute(command);
    return {
      message: 'Suscripción cerrada exitosamente',
      subscriptionId: id,
      closedAt: new Date(),
    };
  }
}
