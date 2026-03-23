import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Tipos de documento de identidad soportados. */
export enum DocumentType {
  DNI = 'DNI',
  NIE = 'NIE',
  PASSPORT = 'PASSPORT',
}

type IdentityDocumentProps = {
  type: DocumentType;
  number: string;
  [key: string]: unknown;
};

/** Tabla de letras de control para DNI/NIE español. */
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/** Longitud mínima para pasaporte. */
const PASSPORT_MIN_LENGTH = 5;
/** Longitud máxima para pasaporte. */
const PASSPORT_MAX_LENGTH = 20;

/** Expresión regular para formato DNI: 8 dígitos + 1 letra. */
const DNI_REGEX = /^(\d{8})([A-Z])$/;

/** Expresión regular para formato NIE: X/Y/Z + 7 dígitos + 1 letra. */
const NIE_REGEX = /^([XYZ])(\d{7})([A-Z])$/;

/** Expresión regular para formato pasaporte: alfanumérico. */
const PASSPORT_REGEX = /^[A-Z0-9]+$/i;

/**
 * Error lanzado cuando el documento de identidad es inválido.
 */
export class DocumentInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_IDENTITY_DOCUMENT';

  constructor(reason: string) {
    super(`Documento de identidad inválido: ${reason}`);
    this.name = 'DocumentInvalidError';
  }
}

/**
 * Value Object que representa un documento de identidad (DNI, NIE o Pasaporte).
 *
 * Validaciones:
 * - DNI: 8 dígitos + letra de control (mod 23)
 * - NIE: X/Y/Z + 7 dígitos + letra de control (X→0, Y→1, Z→2, mod 23)
 * - Pasaporte: alfanumérico, 5-20 caracteres
 */
export class IdentityDocument extends ValueObject<IdentityDocumentProps> {
  get type(): DocumentType {
    return this.props.type;
  }

  get number(): string {
    return this.props.number;
  }

  /**
   * Crea un IdentityDocument validado según el tipo de documento.
   */
  static create(
    type: DocumentType,
    number: string,
  ): Result<IdentityDocument, DocumentInvalidError> {
    const trimmed = (number ?? '').trim().toUpperCase();

    if (!trimmed) {
      return {
        ok: false,
        error: new DocumentInvalidError('El número de documento no puede estar vacío.'),
      };
    }

    switch (type) {
      case DocumentType.DNI:
        return IdentityDocument.validateDni(trimmed);
      case DocumentType.NIE:
        return IdentityDocument.validateNie(trimmed);
      case DocumentType.PASSPORT:
        return IdentityDocument.validatePassport(trimmed);
      default:
        return {
          ok: false,
          error: new DocumentInvalidError(`Tipo de documento no soportado: '${type}'.`),
        };
    }
  }

  /** Valida y crea un DNI español. */
  private static validateDni(number: string): Result<IdentityDocument, DocumentInvalidError> {
    const match = number.match(DNI_REGEX);
    if (!match) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Formato de DNI inválido: '${number}'. Esperado: 8 dígitos + letra.`,
        ),
      };
    }

    const digits = parseInt(match[1], 10);
    const letter = match[2];
    const expectedLetter = DNI_LETTERS[digits % 23];

    if (letter !== expectedLetter) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Letra de control incorrecta para DNI '${number}'. Esperada: '${expectedLetter}'.`,
        ),
      };
    }

    return {
      ok: true,
      value: new IdentityDocument({ type: DocumentType.DNI, number }),
    };
  }

  /** Valida y crea un NIE español. */
  private static validateNie(number: string): Result<IdentityDocument, DocumentInvalidError> {
    const match = number.match(NIE_REGEX);
    if (!match) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Formato de NIE inválido: '${number}'. Esperado: X/Y/Z + 7 dígitos + letra.`,
        ),
      };
    }

    const prefix = match[1];
    const digits = match[2];
    const letter = match[3];

    // Reemplazar prefijo: X→0, Y→1, Z→2
    const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const fullNumber = parseInt(prefixMap[prefix] + digits, 10);
    const expectedLetter = DNI_LETTERS[fullNumber % 23];

    if (letter !== expectedLetter) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Letra de control incorrecta para NIE '${number}'. Esperada: '${expectedLetter}'.`,
        ),
      };
    }

    return {
      ok: true,
      value: new IdentityDocument({ type: DocumentType.NIE, number }),
    };
  }

  /** Valida y crea un pasaporte. */
  private static validatePassport(number: string): Result<IdentityDocument, DocumentInvalidError> {
    if (number.length < PASSPORT_MIN_LENGTH || number.length > PASSPORT_MAX_LENGTH) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Longitud de pasaporte inválida: ${number.length}. Esperado: ${PASSPORT_MIN_LENGTH}-${PASSPORT_MAX_LENGTH} caracteres.`,
        ),
      };
    }

    if (!PASSPORT_REGEX.test(number)) {
      return {
        ok: false,
        error: new DocumentInvalidError(
          `Formato de pasaporte inválido: '${number}'. Solo se permiten caracteres alfanuméricos.`,
        ),
      };
    }

    return {
      ok: true,
      value: new IdentityDocument({ type: DocumentType.PASSPORT, number }),
    };
  }
}
