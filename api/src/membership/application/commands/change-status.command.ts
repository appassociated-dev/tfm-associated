import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cambiar el estado de un socio.
 * Contiene los datos necesarios para ejecutar una transición de estado.
 */
export class ChangeStatusCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** ID del socio cuyo estado se cambia. */
    public readonly memberId: string,
    /** Nuevo estado destino. */
    public readonly newStatus: string,
    /** Motivo del cambio de estado. */
    public readonly reason: string,
    /** ID del usuario que ejecuta el cambio (o SYSTEM). */
    public readonly changedBy: string,
  ) {}
}
