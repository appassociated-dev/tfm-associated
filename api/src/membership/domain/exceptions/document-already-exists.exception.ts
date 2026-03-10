/**
 * Error de dominio lanzado cuando ya existe un socio con el mismo documento de identidad.
 * HTTP 409 Conflict (mapeado por sufijo ALREADY_EXISTS en DomainExceptionFilter).
 */
export class DocumentAlreadyExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.DOCUMENT_ALREADY_EXISTS';

  constructor(
    /** Número de documento duplicado. */
    public readonly documentNumber: string,
    /** Nombre del socio existente. */
    public readonly existingMemberName?: string,
    /** Número de socio del miembro existente. */
    public readonly existingMemberNumber?: string,
  ) {
    const extra =
      existingMemberName && existingMemberNumber
        ? `: ${existingMemberName} (nº ${existingMemberNumber})`
        : '';
    super(`Ya existe un socio con DNI ${documentNumber}${extra}`);
    this.name = 'DocumentAlreadyExistsError';
  }
}
