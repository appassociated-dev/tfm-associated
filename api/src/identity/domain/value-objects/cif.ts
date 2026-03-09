import { ValueObject } from '../../../shared/domain';

type CifProps = {
  value: string;
  [key: string]: unknown;
};

/** Letras válidas como primer carácter de un CIF español. */
const VALID_CIF_LETTERS = 'ABCDEFGHJKLMNPQRSUVW';

/** Tipos cuyo carácter de control es siempre una LETRA. */
const LETTER_CONTROL_TYPES = 'KLMPQRSVW';

/** Tipos cuyo carácter de control es siempre un DÍGITO. */
const DIGIT_CONTROL_TYPES = 'ABEH';

/** Mapa de valor numérico a letra de control. */
const CONTROL_LETTER_MAP = 'JABCDEFGHI';

/**
 * Value Object que representa un CIF español (Código de Identificación Fiscal).
 * Valida formato y dígito/letra de control según el algoritmo oficial.
 */
export class Cif extends ValueObject<CifProps> {
  get value(): string {
    return this.props.value;
  }

  /** Crea un Cif validado. Lanza error si el formato o control son inválidos. */
  static create(value: string): Cif {
    if (!value || value.length !== 9) {
      throw new Error(`CIF inválido: "${value}" debe tener exactamente 9 caracteres.`);
    }

    const letter = value[0].toUpperCase();
    const digits = value.substring(1, 8);
    const control = value[8];

    if (!VALID_CIF_LETTERS.includes(letter)) {
      throw new Error(`CIF inválido: la letra inicial "${letter}" no es válida.`);
    }

    if (!/^\d{7}$/.test(digits)) {
      throw new Error(`CIF inválido: "${value}" debe contener 7 dígitos centrales.`);
    }

    if (!Cif.isValidControl(letter, digits, control.toUpperCase())) {
      throw new Error(`CIF inválido: el carácter de control "${control}" no es correcto.`);
    }

    return new Cif({ value: value.toUpperCase() });
  }

  /** Valida el carácter de control del CIF según el tipo de entidad. */
  private static isValidControl(type: string, digits: string, control: string): boolean {
    const controlValue = Cif.computeControlValue(digits);
    const expectedDigit = controlValue.toString();
    const expectedLetter = CONTROL_LETTER_MAP[controlValue];

    if (LETTER_CONTROL_TYPES.includes(type)) {
      return control === expectedLetter;
    }

    if (DIGIT_CONTROL_TYPES.includes(type)) {
      return control === expectedDigit;
    }

    // Tipos mixtos (C, D, F, G, J, N, U, W): aceptan dígito o letra
    return control === expectedDigit || control === expectedLetter;
  }

  /** Calcula el valor numérico de control (0-9). */
  private static computeControlValue(digits: string): number {
    let sumOdd = 0;
    let sumEven = 0;

    for (let i = 0; i < 7; i++) {
      const digit = parseInt(digits[i], 10);

      if (i % 2 === 0) {
        // Posiciones impares (1, 3, 5, 7 → índices 0, 2, 4, 6): multiplicar por 2
        const doubled = digit * 2;
        sumOdd += doubled > 9 ? doubled - 9 : doubled;
      } else {
        // Posiciones pares (2, 4, 6 → índices 1, 3, 5): sumar directamente
        sumEven += digit;
      }
    }

    const total = sumOdd + sumEven;
    return (10 - (total % 10)) % 10;
  }
}
