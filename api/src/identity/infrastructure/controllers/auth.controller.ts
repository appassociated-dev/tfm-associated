import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { RequestWithUser } from '../../../shared/infrastructure/types/request-with-user';
import { LoginCommand } from '../../application/commands/login.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import { LogoutCommand } from '../../application/commands/logout.command';
import { SwitchTenantCommand } from '../../application/commands/switch-tenant.command';
import { GetCurrentUserQuery } from '../../application/queries/get-current-user.query';
import { LoginRequestDto } from '../../application/dtos/login-request.dto';
import { LoginResponseDto } from '../../application/dtos/login-response.dto';
import { RefreshRequestDto } from '../../application/dtos/refresh-request.dto';
import { RefreshResponseDto } from '../../application/dtos/refresh-response.dto';
import { SwitchTenantRequestDto } from '../../application/dtos/switch-tenant-request.dto';
import { UserProfileDto } from '../../application/dtos/user-profile.dto';

/**
 * Controlador REST para autenticación multi-tenant (UC-002).
 * Endpoint base: /api/v1/auth
 *
 * Expone los flujos de:
 * - Login (público)
 * - Refresh token (público)
 * - Logout (autenticado)
 * - Switch tenant (autenticado)
 * - Perfil del usuario actual (autenticado)
 */
@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Autenticar usuario con email y contraseña.
   * Retorna tokens JWT y datos del usuario con su tenant activo.
   * Rate limiting estricto: 5 intentos por 10 min por IP, bloqueo 15 min (REQ-RL-002).
   */
  @Public()
  @Throttle({ login: { ttl: 600_000, limit: 5, blockDuration: 900_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuario' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Cuenta bloqueada' })
  async login(@Body() dto: LoginRequestDto, @Req() req: Request): Promise<LoginResponseDto> {
    const command = new LoginCommand(
      dto.email,
      dto.password,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
    return this.commandBus.execute(command);
  }

  /**
   * Renovar access token usando un refresh token válido.
   * Rate limiting moderado: 10 intentos por 10 min por IP (REQ-RL-002).
   */
  @Public()
  @Throttle({ login: { ttl: 600_000, limit: 10 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() dto: RefreshRequestDto): Promise<RefreshResponseDto> {
    const command = new RefreshTokenCommand(dto.refreshToken);
    return this.commandBus.execute(command);
  }

  /**
   * Cerrar sesión invalidando el refresh token proporcionado.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 204, description: 'Sesión cerrada' })
  async logout(@Req() req: RequestWithUser, @Body() body: { refreshToken: string }): Promise<void> {
    const command = new LogoutCommand(req.user.userId, body.refreshToken);
    await this.commandBus.execute(command);
  }

  /**
   * Cambiar el tenant activo del usuario autenticado.
   * Genera nuevos tokens con el contexto del nuevo tenant.
   */
  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar de tenant activo' })
  @ApiResponse({
    status: 200,
    description: 'Tenant cambiado exitosamente',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin acceso al tenant' })
  async switchTenant(
    @Req() req: RequestWithUser,
    @Body() dto: SwitchTenantRequestDto,
  ): Promise<LoginResponseDto> {
    const command = new SwitchTenantCommand(req.user.userId, dto.tenantId);
    return this.commandBus.execute(command);
  }

  /**
   * Obtener el perfil del usuario autenticado con su tenant y permisos.
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserProfileDto,
  })
  async me(@Req() req: RequestWithUser): Promise<UserProfileDto> {
    const query = new GetCurrentUserQuery(req.user.userId, req.user.tenantId);
    return this.queryBus.execute(query);
  }
}
