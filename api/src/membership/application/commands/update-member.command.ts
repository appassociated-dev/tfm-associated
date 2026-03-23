import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para actualizar los datos de un socio existente (UC-006).
 * No permite cambiar documentType ni documentNumber (campos inmutables).
 */
export class UpdateMemberCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** ID del socio a actualizar. */
    public readonly memberId: string,
    /** Nombre del socio (opcional). */
    public readonly name: string | undefined,
    /** Apellidos del socio (opcional). */
    public readonly surnames: string | undefined,
    /** Email del socio (opcional). */
    public readonly email: string | undefined,
    /** Teléfono del socio (opcional). */
    public readonly phone: string | null | undefined,
    /** Dirección del socio (opcional). */
    public readonly address: string | null | undefined,
    /** Código postal del socio (opcional). */
    public readonly postalCode: string | null | undefined,
    /** Ciudad del socio (opcional). */
    public readonly city: string | null | undefined,
    /** IBAN del socio (opcional). */
    public readonly iban: string | null | undefined,
    /** Campos personalizados (opcional). */
    public readonly customFields: Record<string, unknown> | undefined,
  ) {}
}
