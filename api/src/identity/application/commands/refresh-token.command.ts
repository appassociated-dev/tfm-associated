import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para renovar un token de acceso usando un refresh token.
 */
export class RefreshTokenCommand implements ICommand {
  constructor(
    /** Token de refresco válido. */
    public readonly refreshToken: string,
  ) {}
}
