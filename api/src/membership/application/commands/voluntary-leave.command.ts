import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para procesar la baja voluntaria de un socio (UC-013).
 * Contiene los datos necesarios para ejecutar la baja voluntaria.
 */
export class ProcessVoluntaryLeaveCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** ID del socio que solicita la baja. */
    public readonly memberId: string,
    /** Tipo de cálculo de fecha efectiva de baja. */
    public readonly effectiveDateType: string,
    /** Motivo de la baja voluntaria. */
    public readonly reason: string,
  ) {}
}
