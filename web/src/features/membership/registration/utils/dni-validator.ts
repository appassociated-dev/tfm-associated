import i18n from '@/i18n/i18n';

// Tabla oficial de letras para validación de DNI/NIE español
const DNI_LETTER_TABLE = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Patrón para DNI: 8 dígitos + 1 letra
const DNI_PATTERN = /^(\d{8})([A-Za-z])$/;

// Patrón para NIE: X/Y/Z + 7 dígitos + 1 letra
const NIE_PATTERN = /^([XYZxyz])(\d{7})([A-Za-z])$/;

// Mapeo de prefijo NIE a dígito equivalente
const NIE_PREFIX_MAP: Record<string, string> = {
  X: '0',
  Y: '1',
  Z: '2',
};

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida un DNI español (8 dígitos + 1 letra).
 * Aplica el algoritmo mod 23 con la tabla oficial de letras.
 */
export function validateDni(dni: string): ValidationResult {
  const trimmed = dni.trim();

  if (!trimmed) {
    return { valid: false, error: i18n.t('membership:registration.validation.dni.dniEmpty') };
  }

  const match = trimmed.match(DNI_PATTERN);

  if (!match) {
    return {
      valid: false,
      error: i18n.t('membership:registration.validation.dni.dniInvalidFormat'),
    };
  }

  const [, digits, letter] = match;
  // Calcular la letra esperada con el algoritmo mod 23
  const expectedLetter = DNI_LETTER_TABLE[Number(digits) % 23];

  if (letter.toUpperCase() !== expectedLetter) {
    return {
      valid: false,
      error: i18n.t('membership:registration.validation.dni.dniInvalidLetter'),
    };
  }

  return { valid: true };
}

/**
 * Valida un NIE español (X/Y/Z + 7 dígitos + 1 letra).
 * Reemplaza el prefijo por su equivalente numérico y aplica mod 23.
 */
export function validateNie(nie: string): ValidationResult {
  const trimmed = nie.trim();

  if (!trimmed) {
    return { valid: false, error: i18n.t('membership:registration.validation.dni.nieEmpty') };
  }

  const match = trimmed.match(NIE_PATTERN);

  if (!match) {
    return {
      valid: false,
      error: i18n.t('membership:registration.validation.dni.nieInvalidFormat'),
    };
  }

  const [, prefix, digits, letter] = match;

  // Reemplazar prefijo por su equivalente numérico y concatenar con los 7 dígitos
  const numericValue = NIE_PREFIX_MAP[prefix.toUpperCase()] + digits;
  const expectedLetter = DNI_LETTER_TABLE[Number(numericValue) % 23];

  if (letter.toUpperCase() !== expectedLetter) {
    return {
      valid: false,
      error: i18n.t('membership:registration.validation.dni.nieInvalidLetter'),
    };
  }

  return { valid: true };
}

/**
 * Detecta si el documento es DNI o NIE y delega la validación correspondiente.
 * - DNI: empieza con un dígito
 * - NIE: empieza con X, Y o Z
 */
export function validateIdentityDocument(document: string): ValidationResult {
  const trimmed = document.trim();

  if (!trimmed) {
    return { valid: false, error: i18n.t('membership:registration.validation.dni.documentEmpty') };
  }

  const firstChar = trimmed[0].toUpperCase();

  // Si empieza con dígito, es un DNI
  if (/\d/.test(firstChar)) {
    return validateDni(trimmed);
  }

  // Si empieza con X, Y o Z, es un NIE
  if (['X', 'Y', 'Z'].includes(firstChar)) {
    return validateNie(trimmed);
  }

  // Cualquier otro caso no es reconocido
  return {
    valid: false,
    error: i18n.t('membership:registration.validation.dni.unrecognizedFormat'),
  };
}

/**
 * Calcula la edad a partir de una fecha de nacimiento (formato ISO o yyyy-mm-dd).
 * Tiene en cuenta si ya pasó el cumpleaños en el año actual.
 */
export function calculateAge(birthDate: string): number {
  // Normalizar: extraer solo la parte de fecha (YYYY-MM-DD) antes de cualquier 'T'
  const datePart = birthDate.split('T')[0];
  // Parsear como fecha local para evitar el desfase UTC+1/+2 en España
  const parts = datePart.split('-');
  if (parts.length !== 3) return -1;
  const [year, month, day] = parts.map(Number);
  const birth = new Date(year, month - 1, day);

  // Verificar que la fecha es válida
  if (isNaN(birth.getTime())) {
    return -1;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  // Comprobar si aún no cumplió años este año
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
