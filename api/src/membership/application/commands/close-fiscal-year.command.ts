import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cerrar un ejercicio fiscal existente.
 * Permite forzar el cierre ignorando advertencias pendientes.
 */
export class CloseFiscalYearCommand implements ICommand {
  constructor(
    /** ID del tenant donde se cierra el ejercicio fiscal. */
    public readonly tenantId: string,
    /** ID del ejercicio fiscal a cerrar. */
    public readonly fiscalYearId: string,
    /** Si se debe forzar el cierre ignorando advertencias. */
    public readonly force: boolean,
  ) {}
}
