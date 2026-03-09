import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cambiar el tenant activo del usuario.
 * Permite a usuarios multi-tenant navegar entre colectividades.
 */
export class SwitchTenantCommand implements ICommand {
  constructor(
    /** ID del usuario que cambia de tenant. */
    public readonly userId: string,
    /** ID del nuevo tenant al que se desea cambiar. */
    public readonly newTenantId: string,
  ) {}
}
