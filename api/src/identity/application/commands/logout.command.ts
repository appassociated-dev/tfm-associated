import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cerrar la sesión de un usuario.
 * Invalida el refresh token proporcionado.
 */
export class LogoutCommand implements ICommand {
  constructor(
    /** ID del usuario que cierra sesión. */
    public readonly userId: string,
    /** Token de refresco a invalidar. */
    public readonly refreshToken: string,
  ) {}
}
