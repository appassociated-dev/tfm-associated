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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermissions } from '../../../shared/infrastructure/guards/require-permissions.decorator';
import { SimpleRegistrationDto } from '../../application/dtos/simple-registration.dto';
import { SimpleRegistrationResponseDto } from '../../application/dtos/simple-registration-response.dto';
import { DniCheckResponseDto } from '../../application/dtos/dni-check-response.dto';
import { PreconditionsResponseDto } from '../../application/dtos/preconditions-response.dto';
import { SimpleRegistrationCommand } from '../../application/commands/simple-registration.command';
import { CheckDniQuery } from '../../application/queries/check-dni.query';
import { ValidatePreconditionsQuery } from '../../application/queries/validate-preconditions.query';

/**
 * Controlador REST para el alta simple de socios (UC-011).
 * Endpoint base: /api/v1/members
 *
 * Todos los endpoints requieren autenticación JWT y permisos RBAC.
 * El tenantId se extrae del request (establecido por TenantMiddleware/JWT).
 */
@ApiTags('Registration')
@ApiBearerAuth()
@Controller('v1/members')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RegistrationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Registra un nuevo socio mediante alta simple.
   * Crea el socio y los artefactos de tesorería (MemberAccount, FeeSubscription, Charge).
   */
  @Post('simple-registration')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('membership:members:create')
  @ApiOperation({ summary: 'Alta simple de socio (UC-011)' })
  @ApiResponse({
    status: 201,
    description: 'Socio registrado exitosamente',
    type: SimpleRegistrationResponseDto,
  })
  @ApiResponse({ status: 409, description: 'DNI/NIE duplicado en el tenant' })
  @ApiResponse({
    status: 412,
    description:
      'Precondiciones no cumplidas (sin ejercicio fiscal, sin tipos de socio, sin plan de alta)',
  })
  @ApiResponse({ status: 422, description: 'Edad no elegible o datos con formato inválido' })
  async simpleRegistration(
    @Body() dto: SimpleRegistrationDto,
    @Req() req: Request & { tenantId: string; user: { userId: string } },
  ): Promise<SimpleRegistrationResponseDto> {
    const command = new SimpleRegistrationCommand(
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
      dto.memberTypeId,
    );

    return this.commandBus.execute(command);
  }

  /**
   * Verifica si un documento de identidad ya está registrado en el tenant.
   */
  @Get('check-dni/:documentType/:documentNumber')
  @RequirePermissions('membership:members:read')
  @ApiOperation({ summary: 'Verificar existencia de DNI/NIE en el tenant' })
  @ApiParam({
    name: 'documentType',
    type: String,
    description: 'Tipo de documento (DNI, NIE)',
  })
  @ApiParam({
    name: 'documentNumber',
    type: String,
    description: 'Número de documento de identidad',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la verificación',
    type: DniCheckResponseDto,
  })
  async checkDni(
    @Param('documentType') documentType: string,
    @Param('documentNumber') documentNumber: string,
    @Req() req: Request & { tenantId: string },
  ): Promise<DniCheckResponseDto> {
    const query = new CheckDniQuery(req.tenantId, documentType, documentNumber);
    return this.queryBus.execute(query);
  }

  /**
   * Valida las precondiciones necesarias para el alta simple.
   * Comprueba: ejercicio fiscal abierto, tipos de socio activos, plan de alta activo.
   */
  @Get('preconditions')
  @RequirePermissions('membership:members:create')
  @ApiOperation({ summary: 'Validar precondiciones para alta simple' })
  @ApiResponse({
    status: 200,
    description: 'Estado de las precondiciones',
    type: PreconditionsResponseDto,
  })
  async validatePreconditions(
    @Req() req: Request & { tenantId: string },
  ): Promise<PreconditionsResponseDto> {
    const query = new ValidatePreconditionsQuery(req.tenantId);
    return this.queryBus.execute(query);
  }
}
