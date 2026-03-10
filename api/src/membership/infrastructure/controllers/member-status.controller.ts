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
import { ChangeStatusDto } from '../../application/dtos/change-status.dto';
import { DelinquencyCheckDto } from '../../application/dtos/delinquency-check.dto';
import { ChangeStatusCommand } from '../../application/commands/change-status.command';
import { RunDelinquencyCheckCommand } from '../../application/commands/run-delinquency-check.command';
import { GetStatusHistoryQuery } from '../../application/queries/get-status-history.query';
import { GetAvailableTransitionsQuery } from '../../application/queries/get-available-transitions.query';
import { StatusHistoryResponseDto } from '../../application/dtos/status-history-response.dto';
import { AvailableTransitionsDto } from '../../application/dtos/available-transitions.dto';
import { DelinquencyCheckResultDto } from '../../application/dtos/delinquency-check-result.dto';

/**
 * Controlador REST para la gestión de estados de socio (UC-007).
 * Endpoint base: /api/v1/members
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Members - Status')
@ApiBearerAuth()
@Controller('v1/members')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MemberStatusController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Cambia el estado de un socio validando la transición.
   */
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:members:update-status')
  @ApiOperation({ summary: 'Cambiar estado de un socio' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({ status: 200, description: 'Estado cambiado' })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto de concurrencia' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async changeStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ChangeStatusDto,
    @Req() req: Request & { tenantId: string; user: { userId: string } },
  ) {
    const command = new ChangeStatusCommand(
      req.tenantId,
      id,
      dto.newStatus,
      dto.reason,
      req.user.userId,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Consulta el historial de estados de un socio.
   */
  @Get(':id/status-history')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Consultar historial de estados' })
  @ApiParam({ name: 'id', type: String, description: 'UUID del socio' })
  @ApiResponse({ status: 200, description: 'Historial de estados', type: StatusHistoryResponseDto })
  @ApiResponse({ status: 404, description: 'Socio no encontrado' })
  async getStatusHistory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<StatusHistoryResponseDto> {
    const query = new GetStatusHistoryQuery(req.tenantId, id);
    return this.queryBus.execute(query);
  }

  /**
   * Consulta las transiciones de estado disponibles para un socio.
   */
  @Get(':id/available-transitions')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Consultar transiciones disponibles' })
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
   * Ejecuta el proceso de verificación de morosidad.
   * Detecta socios con pagos vencidos y los transiciona a PENDING_PAYMENT.
   */
  @Post('delinquency-check')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('membership:members:update-status')
  @ApiOperation({ summary: 'Ejecutar detección de morosidad' })
  @ApiResponse({
    status: 200,
    description: 'Resultado del proceso de morosidad',
    type: DelinquencyCheckResultDto,
  })
  async runDelinquencyCheck(
    @Body() dto: DelinquencyCheckDto,
    @Req() req: Request & { tenantId: string },
  ): Promise<DelinquencyCheckResultDto> {
    const command = new RunDelinquencyCheckCommand(req.tenantId, dto.daysOverdue ?? 90);

    return this.commandBus.execute(command);
  }
}
