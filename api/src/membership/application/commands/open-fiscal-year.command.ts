import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para abrir un nuevo ejercicio fiscal.
 * Contiene todos los datos necesarios para definir y abrir un ejercicio.
 */
export class OpenFiscalYearCommand implements ICommand {
  constructor(
    /** ID del tenant donde se crea el ejercicio fiscal. */
    public readonly tenantId: string,
    /** Nombre del ejercicio fiscal. */
    public readonly name: string,
    /** Tipo de ejercicio fiscal (NATURAL_YEAR, SPORTS_SEASON, CONFRATERNITY, CUSTOM). */
    public readonly type: string,
    /** Fecha de inicio del ejercicio (ISO 8601). */
    public readonly startDate: string,
    /** Fecha de fin del ejercicio (ISO 8601). */
    public readonly endDate: string,
    /** ID del ejercicio fiscal anterior (null si es el primero). */
    public readonly previousFiscalYearId: string | null,
    /** Si se deben trasladar los socios del ejercicio anterior. */
    public readonly carryOverMembers: boolean,
    /** Si se deben aplicar transiciones automáticas de tipo de socio. */
    public readonly applyAutomaticTransitions: boolean,
  ) {}
}
