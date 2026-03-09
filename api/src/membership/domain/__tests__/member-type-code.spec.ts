import { describe, it, expect } from 'vitest';
import { MemberTypeCode } from '../value-objects/member-type-code';

describe('MemberTypeCode', () => {
  // --- Creación válida ---

  it('debería crear un MemberTypeCode con código válido de 2 caracteres', () => {
    const result = MemberTypeCode.create('AB');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('AB');
    }
  });

  it('debería crear un MemberTypeCode con código válido de 10 caracteres', () => {
    const result = MemberTypeCode.create('ABCDE12345');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('ABCDE12345');
    }
  });

  it('debería aceptar códigos con guion bajo', () => {
    const result = MemberTypeCode.create('SOC_JUV');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('SOC_JUV');
    }
  });

  it('debería aceptar códigos numéricos', () => {
    const result = MemberTypeCode.create('T01');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('T01');
    }
  });

  it('debería convertir a mayúsculas automáticamente', () => {
    const result = MemberTypeCode.create('abc');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('ABC');
    }
  });

  // --- Creación inválida ---

  it('debería rechazar código con menos de 2 caracteres', () => {
    const result = MemberTypeCode.create('A');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Error);
    }
  });

  it('debería rechazar código con más de 10 caracteres', () => {
    const result = MemberTypeCode.create('ABCDE123456');

    expect(result.ok).toBe(false);
  });

  it('debería rechazar código vacío', () => {
    const result = MemberTypeCode.create('');

    expect(result.ok).toBe(false);
  });

  it('debería rechazar código con caracteres especiales', () => {
    const result = MemberTypeCode.create('AB@CD');

    expect(result.ok).toBe(false);
  });

  it('debería rechazar código con espacios', () => {
    const result = MemberTypeCode.create('AB CD');

    expect(result.ok).toBe(false);
  });

  it('debería rechazar código con guion medio', () => {
    const result = MemberTypeCode.create('AB-CD');

    expect(result.ok).toBe(false);
  });

  // --- Igualdad ---

  it('debería ser igual a otro MemberTypeCode con el mismo valor', () => {
    const result1 = MemberTypeCode.create('SOCIO');
    const result2 = MemberTypeCode.create('SOCIO');

    expect(result1.ok && result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.value.equals(result2.value)).toBe(true);
    }
  });

  it('debería ser diferente a otro MemberTypeCode con distinto valor', () => {
    const result1 = MemberTypeCode.create('SOCIO');
    const result2 = MemberTypeCode.create('JUVENIL');

    expect(result1.ok && result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.value.equals(result2.value)).toBe(false);
    }
  });
});
