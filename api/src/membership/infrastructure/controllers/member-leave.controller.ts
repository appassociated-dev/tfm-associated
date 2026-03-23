import {
  Controller,
  Post,
  Get,
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
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { VoluntaryLeaveDto } from '../../application/dtos/voluntary-leave.dto';
import { ReinstateMemberDto } from '../../application/dtos/reinstate-member.dto';
import { LeaveResponseDto } from '../../application/dtos/leave-response.dto';
import { LeaveSummaryResponseDto } from '../../application/dtos/leave-summary-response.dto';
import { ReinstatementSummaryResponseDto } from '../../application/dtos/reinstatement-summary-response.dto';
import { ReinstatementResponseDto } from '../../application/dtos/reinstatement-response.dto';
import { StatusHistoryResponseDto } from '../../application/dtos/status-history-response.dto';
import { AvailableTransitionsDto } from '../../application/dtos/available-transitions.dto';
import { ProcessVoluntaryLeaveCommand } from '../../application/commands/voluntary-leave.command';
import { ProcessNonpaymentLeaveCommand } from '../../application/commands/nonpayment-leave.command';
import { ReinstateMemberCommand } from '../../application/commands/reinstate-member.command';
import { GetLeaveSummaryQuery } from '../../application/queries/leave-summary.query';
import { GetReinstatementSummaryQuery } from '../../application/queries/reinstatement-summary.query';
import { GetStatusHistoryQuery } from '../../application/queries/get-status-history.query';
import { GetAvailableTransitionsQuery } from '../../application/queries/get-available-transitions.query';

/**
 * Controlador REST para la baja y rehabilitación de socios (UC-013).
 * Endpoint base: /api/v1/members
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Members - Leave & Reinstatement')
@ApiBearerAuth()
@Controller('v1/members')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MemberLeaveController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Obtiene el resumen previo a la baja de un socio.
   * Incluye suscripciones activas, cargos pendientes y opciones de fecha efectiva.
   */
  @Get(':id/leave-summary')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Obtener resumen previo a la baja de un socio (UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de baja del socio',
    type: LeaveSummaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  async getLeaveSummary(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<LeaveSummaryResponseDto> {
    const query = new GetLeaveSummaryQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Procesa la baja voluntaria de un socio.
   * Requiere tipo de fecha efectiva y motivo de la baja.
   */
  @Post(':id/voluntary-leave')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:members:deactivate')
  @ApiOperation({ summary: 'Procesar baja voluntaria de un socio (UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Baja voluntaria procesada',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 422, description: 'No se puede dar de baja al socio' })
  async voluntaryLeave(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: VoluntaryLeaveDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<LeaveResponseDto> {
    const command = new ProcessVoluntaryLeaveCommand(
      req.tenantId,
      id,
      dto.effectiveDateType,
      dto.reason,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Procesa la baja por impago de un socio.
   * No requiere parámetros adicionales — verifica deuda pendiente automáticamente.
   */
  @Post(':id/nonpayment-leave')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:members:deactivate')
  @ApiOperation({ summary: 'Procesar baja por impago de un socio (UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Baja por impago procesada',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 422, description: 'No se puede dar de baja o no tiene deuda' })
  async nonpaymentLeave(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<LeaveResponseDto> {
    const command = new ProcessNonpaymentLeaveCommand(req.tenantId, id);
    return this.commandBus.execute(command);
  }

  /**
   * Obtiene el resumen previo a la rehabilitación de un socio.
   * El socio debe estar en estado VOLUNTARY_LEAVE o NONPAYMENT_LEAVE.
   */
  @Get(':id/reinstatement-summary')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Obtener resumen previo a la rehabilitación de un socio (UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de rehabilitación del socio',
    type: ReinstatementSummaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 422, description: 'El socio no puede ser rehabilitado' })
  async getReinstatementSummary(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<ReinstatementSummaryResponseDto> {
    const query = new GetReinstatementSummaryQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Rehabilita un socio dado de baja.
   * Requiere confirmación explícita del pago de deuda pendiente.
   */
  @Post(':id/reinstate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:members:reinstate')
  @ApiOperation({ summary: 'Rehabilitar un socio dado de baja (UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Socio rehabilitado exitosamente',
    type: ReinstatementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 422, description: 'No se puede rehabilitar al socio' })
  async reinstate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ReinstateMemberDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<ReinstatementResponseDto> {
    const command = new ReinstateMemberCommand(req.tenantId, id, dto.paymentConfirmed);
    return this.commandBus.execute(command);
  }

  /**
   * Consulta las transiciones de estado disponibles para un socio.
   * Reutiliza el handler existente de UC-007 (GetAvailableTransitionsHandler).
   */
  @Get(':id/available-transitions')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Consultar transiciones disponibles (UC-007/UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Transiciones disponibles',
    type: AvailableTransitionsDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  async getAvailableTransitions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<AvailableTransitionsDto> {
    const query = new GetAvailableTransitionsQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Consulta el historial de estados de un socio.
   * Reutiliza el handler existente de UC-007 (GetStatusHistoryHandler).
   */
  @Get(':id/status-history')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Consultar historial de estados (UC-007/UC-013)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({
    status: 200,
    description: 'Historial de estados',
    type: StatusHistoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  async getStatusHistory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<StatusHistoryResponseDto> {
    const query = new GetStatusHistoryQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }
}
