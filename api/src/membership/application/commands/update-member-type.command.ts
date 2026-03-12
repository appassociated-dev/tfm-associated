import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para actualizar un tipo de socio existente.
 * No permite modificar el código (es inmutable tras la creación).
 */
export class UpdateMemberTypeCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del tipo de socio a actualizar. */
    public readonly memberTypeId: string,
    /** Nombre actualizado. */
    public readonly name: string,
    /** Descripción actualizada. */
    public readonly description: string,
    /** Edad mínima permitida. */
    public readonly ageRangeMin: number | null,
    /** Edad máxima permitida. */
    public readonly ageRangeMax: number | null,
    /** Derecho a voto. */
    public readonly votingRight: boolean,
    /** Elegible para cargo. */
    public readonly eligibleForOffice: boolean,
    /** Antigüedad mínima para votar (meses). */
    public readonly minimumSeniorityForVoting: number,
    /** Antigüedad mínima para cargo (meses). */
    public readonly minimumSeniorityForOffice: number,
    /** ID del tipo destino de transición automática. */
    public readonly automaticTransitionTargetId: string | null,
    /** Configuración de reglas. */
    public readonly rulesConfig: object,
    /** Tipo de colectividad del tenant. */
    public readonly collectivityType: string,
  ) {}
}
