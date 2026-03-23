import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para desactivar un tipo de socio.
 * No elimina el registro, solo lo marca como inactivo.
 */
export class DeactivateMemberTypeCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del tipo de socio a desactivar. */
    public readonly memberTypeId: string,
  ) {}
}
