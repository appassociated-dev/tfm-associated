import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para iniciar sesión de un usuario.
 * Incluye metadatos de la petición para auditoría y seguridad.
 */
export class LoginCommand implements ICommand {
  constructor(
    /** Email del usuario. */
    public readonly email: string,
    /** Contraseña del usuario. */
    public readonly password: string,
    /** Dirección IP del cliente. */
    public readonly ipAddress: string,
    /** User-Agent del navegador/cliente. */
    public readonly userAgent: string,
  ) {}
}
