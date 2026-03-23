import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { RecordPaymentDto } from '../../application/dtos/record-payment.dto';
import { RecordMultiChargePaymentDto } from '../../application/dtos/record-multi-charge-payment.dto';
import { PaymentResponseDto } from '../../application/dtos/payment-response.dto';
import { PendingChargeResponseDto } from '../../application/dtos/pending-charge-response.dto';
import { AccountBalanceResponseDto } from '../../application/dtos/account-balance-response.dto';
import { MemberSearchResultDto } from '../../application/dtos/member-search-result.dto';
import { RecordPaymentCommand } from '../../application/commands/record-payment.command';
import { RecordMultiChargePaymentCommand } from '../../application/commands/record-multi-charge-payment.command';
import { GetPaymentsByAccountQuery } from '../../application/queries/get-payments-by-account.query';
import { GetPendingChargesQuery } from '../../application/queries/get-pending-charges.query';
import { GetAccountBalanceQuery } from '../../application/queries/get-account-balance.query';
import { GetReceiptQuery } from '../../application/queries/get-receipt.query';
import { SearchMembersForPaymentQuery } from '../../application/queries/search-members-for-payment.query';

/**
 * Controlador REST para operaciones globales de pagos (UC-021).
 * Endpoint base: /api/v1/treasury
 *
 * Incluye:
 * - GET /payments/:id/receipt — Descarga del recibo PDF de un pago
 * - GET /search-members — Búsqueda de socios para registro de cobros
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Payments')
@Controller('v1/treasury')
export class PaymentsGlobalController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * Obtiene el recibo PDF de un pago.
   * Si el recibo no existe en BD, lo regenera bajo demanda (Riesgo 3).
   * Retorna application/pdf para descarga o visualización inline.
   */
  @Get('payments/:id/receipt')
  @RequirePermissions('treasury:payments:read')
  @ApiOperation({ summary: 'Obtener recibo PDF de un pago' })
  @ApiResponse({ status: 200, description: 'Recibo PDF generado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async getReceipt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
    @Res() res: Response,
  ): Promise<void> {
    const query = new GetReceiptQuery(req.tenantId, id);
    const pdfBuffer: Buffer = await this.queryBus.execute(query);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  }

  /**
   * Busca socios por nombre, apellidos, número de socio o DNI.
   * Retorna resultados con balance pendiente para facilitar el registro de cobros.
   */
  @Get('search-members')
  @RequirePermissions('treasury:payments:read')
  @ApiOperation({ summary: 'Buscar socios para registro de cobros' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Término de búsqueda (nombre, apellidos, número de socio o DNI)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de socios coincidentes con balance pendiente',
    type: [MemberSearchResultDto],
  })
  async searchMembers(
    @Query('q') q: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<MemberSearchResultDto[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }

    const query = new SearchMembersForPaymentQuery(req.tenantId, q.trim());
    return this.queryBus.execute(query);
  }
}

/**
 * Controlador REST para pagos asociados a una cuenta de socio (UC-021).
 * Endpoint base: /api/v1/treasury/member-accounts/:accountId
 *
 * Incluye:
 * - POST /payments — Registro de cobro individual
 * - POST /payments/multi — Registro de cobro multi-cargo
 * - GET /payments — Listar pagos de la cuenta
 * - GET /pending-charges — Listar cargos pendientes (alternativa al endpoint de charges)
 * - GET /balance — Obtener balance pendiente
 *
 * NOTA: El endpoint GET /charges ya existe en MemberAccountChargesController (UC-019).
 * No se duplica aquí.
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Payments')
@Controller('v1/treasury/member-accounts/:accountId')
export class MemberAccountPaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── Rutas estáticas (sin :id) ──────────────────────────────────

  /**
   * Registra un cobro individual sobre un cargo pendiente.
   * Genera automáticamente referencia de pago, número de recibo y recibo PDF.
   */
  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:payments:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Registrar un cobro individual' })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado exitosamente',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio o cargo no encontrado' })
  @ApiResponse({ status: 409, description: 'El cargo ya está pagado (FE-4)' })
  @ApiResponse({
    status: 422,
    description: 'Sobre-pago (FE-1), fecha futura (FE-2), cargo cancelado',
  })
  async recordPayment(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: Request & { tenantId: string; user?: { id: string } },
  ): Promise<PaymentResponseDto> {
    const command = new RecordPaymentCommand(
      req.tenantId,
      accountId,
      dto.chargeId,
      dto.amount,
      dto.paymentMethod,
      dto.paymentDate,
      dto.notes ?? null,
      req.user?.id ?? 'system', // registeredBy: usuario autenticado
    );

    return this.commandBus.execute(command);
  }

  /**
   * Registra un cobro sobre múltiples cargos pendientes.
   * Crea un pago por cada cargo con referencia compartida.
   * Cada pago cubre el importe restante completo del cargo.
   */
  @Post('payments/multi')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('treasury:payments:create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Registrar cobro de múltiples cargos' })
  @ApiResponse({
    status: 201,
    description: 'Pagos registrados exitosamente',
    type: [PaymentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio o cargo no encontrado' })
  @ApiResponse({ status: 409, description: 'Algún cargo ya está pagado (FE-4)' })
  @ApiResponse({ status: 422, description: 'Fecha futura (FE-2), cargo cancelado' })
  async recordMultiChargePayment(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() dto: RecordMultiChargePaymentDto,
    @Req() req: Request & { tenantId: string; user?: { id: string } },
  ): Promise<PaymentResponseDto[]> {
    const command = new RecordMultiChargePaymentCommand(
      req.tenantId,
      accountId,
      dto.chargeIds,
      dto.paymentMethod,
      dto.paymentDate,
      dto.notes ?? null,
      req.user?.id ?? 'system',
    );

    return this.commandBus.execute(command);
  }

  /**
   * Lista los pagos registrados de una cuenta de socio.
   * Ordenados por fecha de pago descendente (más recientes primero).
   */
  @Get('payments')
  @RequirePermissions('treasury:payments:read')
  @ApiOperation({ summary: 'Listar pagos de una cuenta de socio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos de la cuenta',
    type: [PaymentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  async listPayments(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<PaymentResponseDto[]> {
    const query = new GetPaymentsByAccountQuery(req.tenantId, accountId);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene los cargos pendientes (PENDING o PARTIALLY_PAID) de una cuenta de socio.
   * Útil para seleccionar cargos a cobrar en la interfaz de registro de cobros.
   */
  @Get('pending-charges')
  @RequirePermissions('treasury:charges:read')
  @ApiOperation({ summary: 'Obtener cargos pendientes de una cuenta de socio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos pendientes',
    type: [PendingChargeResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  async getPendingCharges(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<PendingChargeResponseDto[]> {
    const query = new GetPendingChargesQuery(req.tenantId, accountId);
    return this.queryBus.execute(query);
  }

  /**
   * Obtiene el balance pendiente de una cuenta de socio.
   * Incluye datos del socio, total pendiente, número de cargos y fecha de vencimiento más antigua.
   */
  @Get('balance')
  @RequirePermissions('treasury:payments:read')
  @ApiOperation({ summary: 'Obtener balance pendiente de una cuenta de socio' })
  @ApiResponse({
    status: 200,
    description: 'Balance pendiente de la cuenta',
    type: AccountBalanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cuenta de socio no encontrada' })
  async getBalance(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<AccountBalanceResponseDto> {
    const query = new GetAccountBalanceQuery(req.tenantId, accountId);
    return this.queryBus.execute(query);
  }
}
