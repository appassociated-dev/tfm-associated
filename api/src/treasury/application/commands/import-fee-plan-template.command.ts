import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para importar plantillas predefinidas de planes de cuota.
 * Crea planes de cuota a partir de templates según el tipo de colectividad.
 */
export class ImportFeePlanTemplateCommand implements ICommand {
  constructor(
    /** ID del tenant donde se importan las plantillas. */
    public readonly tenantId: string,
    /** Tipo de colectividad: ASSOCIATION, CLUB, FEDERATION. */
    public readonly collectivityType: string,
  ) {}
}
