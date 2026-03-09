import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para importar plantillas de tipos de socio predefinidos.
 * Crea todos los tipos de socio de la plantilla para el tipo de colectividad indicado.
 */
export class ImportTemplateCommand implements ICommand {
  constructor(
    /** ID del tenant donde se importarán las plantillas. */
    public readonly tenantId: string,
    /** Tipo de colectividad para seleccionar las plantillas. */
    public readonly collectivityType: string,
  ) {}
}
