import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type BankDetailsProps = {
  iban: string;
  [key: string]: unknown;
};

/** Longitud mínima de un IBAN válido. */
const IBAN_MIN_LENGTH = 15;
/** Longitud máxima de un IBAN válido. */
const IBAN_MAX_LENGTH = 34;

/** Expresión regular para formato IBAN: solo letras y dígitos. */
const IBAN_FORMAT_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]+$/;

/**
 * Error lanzado cuando el IBAN es inválido.
 */
export class IbanInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_IBAN';

  constructor(reason: string) {
    super(`IBAN inválido: ${reason}`);
    this.name = 'IbanInvalidError';
  }
}

/**
 * Value Object que representa los datos bancarios de un socio.
 * Validación IBAN: mover 4 primeros caracteres al final, convertir letras a números
 * (A=10, B=11...), verificar módulo 97 = 1.
 */
export class BankDetails extends ValueObject<BankDetailsProps> {
  get iban(): string {
    return this.props.iban;
  }

  /**
   * Crea un BankDetails validado con algoritmo mod 97.
   */
  static create(iban: string): Result<BankDetails, IbanInvalidError> {
    // Normalizar: eliminar espacios, convertir a mayúsculas
    const normalized = (iban ?? '').replace(/\s/g, '').toUpperCase();

    if (!normalized) {
      return {
        ok: false,
        error: new IbanInvalidError('El IBAN no puede estar vacío.'),
      };
    }

    if (normalized.length < IBAN_MIN_LENGTH || normalized.length > IBAN_MAX_LENGTH) {
      return {
        ok: false,
        error: new IbanInvalidError(
          `Longitud inválida: ${normalized.length}. Esperado: ${IBAN_MIN_LENGTH}-${IBAN_MAX_LENGTH} caracteres.`,
        ),
      };
    }

    if (!IBAN_FORMAT_REGEX.test(normalized)) {
      return {
        ok: false,
        error: new IbanInvalidError(
          `Formato inválido: '${normalized}'. Debe comenzar con 2 letras + 2 dígitos + alfanumérico.`,
        ),
      };
    }

    // Validación mod 97
    if (!BankDetails.validateMod97(normalized)) {
      return {
        ok: false,
        error: new IbanInvalidError(`El IBAN '${normalized}' no pasa la validación mod 97.`),
      };
    }

    return { ok: true, value: new BankDetails({ iban: normalized }) };
  }

  /**
   * Retorna el IBAN enmascarado mostrando solo los primeros 4 y últimos 4 caracteres.
   * Ejemplo: "ES91****************1332"
   */
  getMaskedIban(): string {
    const iban = this.props.iban;
    if (iban.length <= 8) {
      return iban;
    }
    const start = iban.slice(0, 4);
    const end = iban.slice(-4);
    const masked = '*'.repeat(iban.length - 8);
    return `${start}${masked}${end}`;
  }

  /**
   * Validación IBAN con algoritmo mod 97 (ISO 13616).
   * 1. Mover los 4 primeros caracteres al final.
   * 2. Convertir letras a números (A=10, B=11, ..., Z=35).
   * 3. El número resultante mod 97 debe ser 1.
   */
  private static validateMod97(iban: string): boolean {
    // Mover los 4 primeros caracteres al final
    const rearranged = iban.slice(4) + iban.slice(0, 4);

    // Convertir letras a números
    let numericString = '';
    for (const char of rearranged) {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // A=10, B=11, ..., Z=35
        numericString += (code - 55).toString();
      } else {
        numericString += char;
      }
    }

    // Calcular mod 97 usando aritmética de precisión arbitraria (chunks)
    let remainder = 0;
    for (const char of numericString) {
      remainder = (remainder * 10 + parseInt(char, 10)) % 97;
    }

    return remainder === 1;
  }
}
