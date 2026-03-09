import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SwitchTenantCommand } from './switch-tenant.command';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, TokenService, JwtPayload } from '../../domain/ports/token-service.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { TenantAccessDeniedError } from '../../domain/exceptions/tenant-access-denied.error';

/** Tiempo de expiración del access token en segundos (15 minutos). */
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;

/** Días de validez del refresh token. */
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Handler del comando de cambio de tenant.
 * Verifica que el usuario tenga membresía en el tenant destino,
 * genera nuevos tokens con el contexto del nuevo tenant.
 */
@CommandHandler(SwitchTenantCommand)
export class SwitchTenantHandler implements ICommandHandler<SwitchTenantCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly prismaMain: PrismaMainService,
  ) {}

  async execute(command: SwitchTenantCommand): Promise<LoginResponseDto> {
    // 1. Buscar usuario
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new TenantAccessDeniedError(command.newTenantId);
    }

    // 2. Verificar membresía en el tenant destino
    const membership = await this.prismaMain.tenantMembership.findFirst({
      where: {
        userId: command.userId,
        tenantId: command.newTenantId,
        active: true,
      },
      include: { tenant: true, role: true },
    });

    if (!membership) {
      throw new TenantAccessDeniedError(command.newTenantId);
    }

    const permissions = (membership.role.permissions as string[]) ?? [];

    // 3. Revocar refresh tokens anteriores del usuario
    await this.refreshTokenRepository.revokeAllForUser(command.userId);

    // 4. Generar nuevo access token con contexto del nuevo tenant
    const payload: JwtPayload = {
      sub: user.id.toValue(),
      tenantId: membership.tenant.id,
      email: user.email.value,
      name: user.name,
      rol: membership.role.code,
      permissions,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);

    // 5. Generar nuevo refresh token
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

    await this.refreshTokenRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id.toValue(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    // 6. Construir respuesta
    const response = new LoginResponseDto();
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;
    response.expiresIn = ACCESS_TOKEN_EXPIRY_SECONDS;
    response.user = {
      id: user.id.toValue(),
      email: user.email.value,
      name: user.name,
    };
    response.tenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
    };
    response.role = membership.role.code;

    return response;
  }
}
