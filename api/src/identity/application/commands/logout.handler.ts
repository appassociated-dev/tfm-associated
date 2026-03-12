import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './logout.command';
import { TOKEN_SERVICE, TokenService } from '../../domain/ports/token-service.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';

/**
 * Handler del comando de cierre de sesión.
 * Revoca el refresh token proporcionado para invalidar la sesión.
 */
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    // 1. Hashear el refresh token para buscar en persistencia
    const tokenHash = this.tokenService.hashRefreshToken(command.refreshToken);

    // 2. Revocar el token (si no existe, la operación es idempotente)
    await this.refreshTokenRepository.revoke(tokenHash);
  }
}
