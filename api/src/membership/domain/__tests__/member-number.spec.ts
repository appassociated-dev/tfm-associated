import { describe, it, expect } from 'vitest';
import { MemberNumber, MemberNumberInvalidError } from '../value-objects/member-number';

describe('MemberNumber', () => {
  describe('fromSequence()', () => {
    it('debería crear un MemberNumber con formato cero-padded a 5 dígitos', () => {
      const result = MemberNumber.fromSequence(342);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('00342');
      }
    });

    it('debería crear "00001" para secuencia 1', () => {
      const result = MemberNumber.fromSequence(1);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('00001');
      }
    });

    it('debería crear "99999" para secuencia 99999', () => {
      const result = MemberNumber.fromSequence(99999);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('99999');
      }
    });

    it('debería manejar números mayores a 5 dígitos sin truncar', () => {
      const result = MemberNumber.fromSequence(100000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('100000');
      }
    });

    it('debería rechazar secuencia 0', () => {
      const result = MemberNumber.fromSequence(0);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(MemberNumberInvalidError);
      }
    });

    it('debería rechazar secuencia negativa', () => {
      const result = MemberNumber.fromSequence(-1);
      expect(result.ok).toBe(false);
    });
  });

  describe('fromString()', () => {
    it('debería crear un MemberNumber desde un string válido', () => {
      const result = MemberNumber.fromString('00342');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe('00342');
      }
    });

    it('debería rechazar un string vacío', () => {
      const result = MemberNumber.fromString('');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un string solo con espacios', () => {
      const result = MemberNumber.fromString('   ');
      expect(result.ok).toBe(false);
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro MemberNumber con el mismo valor', () => {
      const a = MemberNumber.fromSequence(42);
      const b = MemberNumber.fromSequence(42);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });

    it('debería ser diferente a otro MemberNumber con distinto valor', () => {
      const a = MemberNumber.fromSequence(42);
      const b = MemberNumber.fromSequence(43);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(false);
      }
    });
  });
});
