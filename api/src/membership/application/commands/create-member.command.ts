import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para crear un nuevo socio con ficha completa (UC-006).
 * Contiene todos los datos necesarios para registrar la ficha del socio.
 */
export class CreateMemberCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** Nombre del socio. */
    public readonly name: string,
    /** Apellidos del socio. */
    public readonly surnames: string,
    /** Fecha de nacimiento (ISO string). */
    public readonly birthDate: string,
    /** Tipo de documento de identidad (DNI, NIE, PASSPORT). */
    public readonly documentType: string,
    /** Número de documento de identidad. */
    public readonly documentNumber: string,
    /** Email del socio. */
    public readonly email: string,
    /** Teléfono del socio (opcional). */
    public readonly phone: string | null,
    /** Dirección del socio (opcional). */
    public readonly address: string | null,
    /** Código postal del socio (opcional). */
    public readonly postalCode: string | null,
    /** Ciudad del socio (opcional). */
    public readonly city: string | null,
    /** IBAN del socio (opcional). */
    public readonly iban: string | null,
    /** ID del tipo de socio (UUID). */
    public readonly memberTypeId: string,
    /** Campos personalizados (JSONB). */
    public readonly customFields: Record<string, unknown>,
    /** Estado inicial: ACTIVE (por defecto) o APPLICANT. */
    public readonly initialStatus: string,
  ) {}
}
