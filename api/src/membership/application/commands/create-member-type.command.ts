import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para crear un nuevo tipo de socio.
 * Contiene todos los datos necesarios para definir una categoría de socio.
 */
export class CreateMemberTypeCommand implements ICommand {
  constructor(
    /** ID del tenant donde se crea el tipo de socio. */
    public readonly tenantId: string,
    /** Código único del tipo de socio (2-10 caracteres alfanuméricos). */
    public readonly code: string,
    /** Nombre del tipo de socio. */
    public readonly name: string,
    /** Descripción del tipo de socio. */
    public readonly description: string,
    /** Edad mínima permitida (null = sin límite inferior). */
    public readonly ageRangeMin: number | null,
    /** Edad máxima permitida (null = sin límite superior). */
    public readonly ageRangeMax: number | null,
    /** Si los socios de este tipo tienen derecho a voto. */
    public readonly votingRight: boolean,
    /** Si los socios de este tipo pueden ocupar cargos. */
    public readonly eligibleForOffice: boolean,
    /** Meses mínimos de antigüedad para votar. */
    public readonly minimumSeniorityForVoting: number,
    /** Meses mínimos de antigüedad para ocupar cargo. */
    public readonly minimumSeniorityForOffice: number,
    /** ID del tipo de socio al que se transiciona automáticamente (null = sin transición). */
    public readonly automaticTransitionTargetId: string | null,
    /** Configuración de reglas específica del tipo de colectividad. */
    public readonly rulesConfig: object,
    /** Tipo de colectividad del tenant. */
    public readonly collectivityType: string,
  ) {}
}
