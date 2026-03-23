import { ICommand } from '@nestjs/cqrs';

/** Datos de una vinculación individual de tipo de socio a plan de cuota. */
export interface MemberTypeLinkData {
  memberTypeId: string;
  isDefault: boolean;
  order: number;
}

/**
 * Comando para vincular tipos de socio a un plan de cuota.
 * Permite definir plan por defecto y orden de presentación.
 */
export class LinkMemberTypesCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del plan de cuota al que se vinculan los tipos de socio. */
    public readonly feePlanId: string,
    /** Array de vinculaciones a crear. */
    public readonly links: MemberTypeLinkData[],
  ) {}
}
