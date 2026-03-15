import { describe, it, expect, vi, afterEach } from 'vitest';

import { validateDni, validateNie, validateIdentityDocument, calculateAge } from './dni-validator';

// === Tests de validación de DNI español (algoritmo mod 23) ===

describe('validateDni', () => {
  it('deberia aceptar DNI valido 12345678Z (12345678 mod 23 = 14 → Z)', () => {
    const result = validateDni('12345678Z');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deberia aceptar DNI valido 00000000T (0 mod 23 = 0 → T)', () => {
    const result = validateDni('00000000T');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deberia aceptar DNI con letra en minuscula 12345678z', () => {
    const result = validateDni('12345678z');

    expect(result.valid).toBe(true);
  });

  it('deberia rechazar DNI con letra incorrecta 12345678A (esperada Z)', () => {
    const result = validateDni('12345678A');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('La letra del DNI no es correcta');
  });

  it('deberia rechazar DNI vacio', () => {
    const result = validateDni('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('El DNI no puede estar vacío');
  });

  it('deberia rechazar DNI con solo espacios', () => {
    const result = validateDni('   ');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('El DNI no puede estar vacío');
  });

  it('deberia rechazar DNI demasiado corto (7 digitos)', () => {
    const result = validateDni('1234567Z');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de DNI inválido');
  });

  it('deberia rechazar DNI demasiado largo (9 digitos)', () => {
    const result = validateDni('123456789Z');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de DNI inválido');
  });

  it('deberia rechazar DNI sin letra', () => {
    const result = validateDni('12345678');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de DNI inválido');
  });

  it('deberia aceptar DNI con espacios al inicio/final (trim)', () => {
    const result = validateDni('  12345678Z  ');

    expect(result.valid).toBe(true);
  });

  // Verificación de la tabla completa mod 23: 'TRWAGMYFPDXBNJZSQVHLCKE'
  it.each([
    ['00000000', 'T', 0],
    ['00000001', 'R', 1],
    ['00000002', 'W', 2],
    ['00000003', 'A', 3],
    ['00000004', 'G', 4],
    ['00000005', 'M', 5],
    ['00000006', 'Y', 6],
    ['00000007', 'F', 7],
    ['00000008', 'P', 8],
    ['00000009', 'D', 9],
    ['00000010', 'X', 10],
    ['00000011', 'B', 11],
    ['00000012', 'N', 12],
    ['00000013', 'J', 13],
    ['00000014', 'Z', 14],
    ['00000015', 'S', 15],
    ['00000016', 'Q', 16],
    ['00000017', 'V', 17],
    ['00000018', 'H', 18],
    ['00000019', 'L', 19],
    ['00000020', 'C', 20],
    ['00000021', 'K', 21],
    ['00000022', 'E', 22],
  ])('deberia validar la tabla mod 23 — %s mod 23 = %i → %s', (digits, expectedLetter) => {
    const result = validateDni(`${digits}${expectedLetter}`);

    expect(result.valid).toBe(true);
  });
});

// === Tests de validación de NIE español ===

describe('validateNie', () => {
  it('deberia aceptar NIE valido X0000000T (X→0, 00000000 mod 23 = 0 → T)', () => {
    const result = validateNie('X0000000T');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deberia aceptar NIE con prefijo Y — Y1234567X', () => {
    // Y→1, numero completo: 11234567, 11234567 mod 23 = ?
    // Calcular: 11234567 % 23 = 11234567 - (488459 * 23) = 11234567 - 11234557 = 10 → X
    const result = validateNie('Y1234567X');

    expect(result.valid).toBe(true);
  });

  it('deberia aceptar NIE con prefijo Z — Z0000000W', () => {
    // Z→2, numero completo: 20000000, 20000000 mod 23 = ?
    // 20000000 % 23 = 20000000 - (869565 * 23) = 20000000 - 19999995 = 5... no, recalcular
    // 869565 * 23 = 19999995, 20000000 - 19999995 = 5 → M
    // Entonces probemos con la letra correcta
    const result = validateNie('Z0000000M');

    expect(result.valid).toBe(true);
  });

  it('deberia aceptar NIE con letra en minuscula x0000000t', () => {
    const result = validateNie('x0000000t');

    expect(result.valid).toBe(true);
  });

  it('deberia rechazar NIE vacio', () => {
    const result = validateNie('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('El NIE no puede estar vacío');
  });

  it('deberia rechazar NIE sin letra final', () => {
    const result = validateNie('Z1234567');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de NIE inválido');
  });

  it('deberia rechazar NIE con prefijo invalido (no X/Y/Z)', () => {
    const result = validateNie('A1234567L');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de NIE inválido');
  });

  it('deberia rechazar NIE con letra incorrecta', () => {
    // X0000000 → T es la correcta, usando A deberia fallar
    const result = validateNie('X0000000A');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('La letra del NIE no es correcta');
  });

  it('deberia rechazar NIE con menos de 7 digitos', () => {
    const result = validateNie('X123456T');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato de NIE inválido');
  });
});

// === Tests del detector de tipo de documento ===

describe('validateIdentityDocument', () => {
  it('deberia detectar y validar un DNI (empieza con digito)', () => {
    const result = validateIdentityDocument('12345678Z');

    expect(result.valid).toBe(true);
  });

  it('deberia detectar y validar un NIE (empieza con X)', () => {
    const result = validateIdentityDocument('X0000000T');

    expect(result.valid).toBe(true);
  });

  it('deberia detectar y validar un NIE (empieza con Y)', () => {
    const result = validateIdentityDocument('Y1234567X');

    expect(result.valid).toBe(true);
  });

  it('deberia rechazar documento vacio', () => {
    const result = validateIdentityDocument('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('El documento no puede estar vacío');
  });

  it('deberia rechazar documento con formato no reconocido (empieza con A)', () => {
    const result = validateIdentityDocument('A1234567B');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Formato no reconocido');
  });

  it('deberia delegar errores de validacion de DNI invalido', () => {
    const result = validateIdentityDocument('12345678A');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('La letra del DNI no es correcta');
  });

  it('deberia delegar errores de validacion de NIE invalido', () => {
    const result = validateIdentityDocument('X0000000A');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('La letra del NIE no es correcta');
  });
});

// === Tests del cálculo de edad ===

describe('calculateAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deberia calcular la edad correctamente para una persona de 30 anos', () => {
    // Fijar la fecha a 2026-06-15 para tests deterministas
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));

    const result = calculateAge('1996-01-01');

    expect(result).toBe(30);
  });

  it('deberia retornar 0 para un bebe nacido hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));

    const result = calculateAge('2026-06-15');

    expect(result).toBe(0);
  });

  it('deberia retornar -1 para una fecha invalida', () => {
    const result = calculateAge('no-es-una-fecha');

    expect(result).toBe(-1);
  });

  it('deberia retornar -1 para string vacio', () => {
    const result = calculateAge('');

    expect(result).toBe(-1);
  });

  it('deberia restar un ano si el cumpleanos aun no ocurrio este ano', () => {
    vi.useFakeTimers();
    // Fecha actual: 15 de marzo de 2026
    vi.setSystemTime(new Date('2026-03-15'));

    // Nacido el 20 de diciembre de 1990 → cumple en diciembre, aun no cumplio
    const result = calculateAge('1990-12-20');

    expect(result).toBe(35);
  });

  it('deberia contar el ano si el cumpleanos ya paso este ano', () => {
    vi.useFakeTimers();
    // Fecha actual: 15 de diciembre de 2026
    vi.setSystemTime(new Date('2026-12-15'));

    // Nacido el 1 de enero de 1990 → ya cumplio
    const result = calculateAge('1990-01-01');

    expect(result).toBe(36);
  });

  it('deberia contar correctamente el dia exacto del cumpleanos', () => {
    vi.useFakeTimers();
    // Fecha actual: 15 de junio de 2026
    vi.setSystemTime(new Date('2026-06-15'));

    // Nacido el 15 de junio de 2000 → cumple HOY
    const result = calculateAge('2000-06-15');

    expect(result).toBe(26);
  });

  it('deberia manejar formato ISO con hora', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));

    const result = calculateAge('1996-01-01T00:00:00.000Z');

    expect(result).toBe(30);
  });
});
