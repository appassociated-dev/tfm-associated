import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenCommand } from './refresh-token.command';
import { RefreshResponseDto } from '../dtos/refresh-response.dto';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { TOKEN_SERVICE, TokenService, JwtPayload } from '../../domain/ports/token-service.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { InvalidRefreshTokenError } from '../../domain/exceptions/invalid-refresh-token.error';

/** Tiempo de expiración del access token en segundos (15 minutos). */
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;

/** Días de validez del refresh token. */
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Handler del comando de renovación de tokens.
 * Implementa rotación de refresh tokens: revoca el actual y emite uno nuevo.
 * Para resolver el tenant context, consulta la primera membresía activa del usuario.
 */
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly prismaMain: PrismaMainService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshResponseDto> {
    // 1. Hashear el token entrante para buscar en persistencia
    const tokenHash = this.tokenService.hashRefreshToken(command.refreshToken);

    // 2. Buscar token por hash
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new InvalidRefreshTokenError();
    }

    // 3. Verificar que no esté expirado ni revocado
    if (storedToken.revokedAt !== null || storedToken.expiresAt.getTime() < Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    // 4. Revocar token actual (rotación)
    await this.refreshTokenRepository.revoke(tokenHash);

    // 5. Buscar usuario
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    // 6. Obtener membresía activa para resolver tenant context
    const membership = await this.prismaMain.tenantMembership.findFirst({
      where: { userId: storedToken.userId, active: true },
      include: { tenant: true, role: true },
    });

    if (!membership) {
      throw new InvalidRefreshTokenError();
    }

    const permissions = (membership.role.permissions as string[]) ?? [];

    // 7. Generar nuevo access token
    const payload: JwtPayload = {
      sub: user.id.toValue(),
      tenantId: membership.tenant.id,
      email: user.email.value,
      name: user.name,
      rol: membership.role.code,
      permissions,
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);

    // 8. Generar nuevo refresh token (rotación)
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newRefreshTokenHash = this.tokenService.hashRefreshToken(newRefreshToken);

    await this.refreshTokenRepository.create({
      tokenHash: newRefreshTokenHash,
      userId: user.id.toValue(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    // 9. Construir respuesta
    const response = new RefreshResponseDto();
    response.accessToken = newAccessToken;
    response.refreshToken = newRefreshToken;
    response.expiresIn = ACCESS_TOKEN_EXPIRY_SECONDS;

    return response;
  }
}
