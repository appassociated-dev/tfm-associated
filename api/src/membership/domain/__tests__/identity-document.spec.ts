import { describe, it, expect } from 'vitest';
import {
  IdentityDocument,
  DocumentType,
  DocumentInvalidError,
} from '../value-objects/identity-document';

describe('IdentityDocument', () => {
  // --- DNI ---

  describe('DNI validation', () => {
    it('debería aceptar un DNI válido (12345678Z)', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '12345678Z');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe(DocumentType.DNI);
        expect(result.value.number).toBe('12345678Z');
      }
    });

    it('debería aceptar un DNI válido (00000000T)', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '00000000T');
      expect(result.ok).toBe(true);
    });

    it('debería aceptar un DNI válido (99999999R)', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '99999999R');
      expect(result.ok).toBe(true);
    });

    it('debería rechazar un DNI con letra incorrecta', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '12345678A');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(DocumentInvalidError);
      }
    });

    it('debería rechazar un DNI con formato inválido (menos de 8 dígitos)', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '1234567Z');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un DNI con formato inválido (sin letra)', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '123456789');
      expect(result.ok).toBe(false);
    });

    it('debería normalizar DNI a mayúsculas', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '12345678z');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.number).toBe('12345678Z');
      }
    });
  });

  // --- NIE ---

  describe('NIE validation', () => {
    it('debería aceptar un NIE válido con X (X1234567L)', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'X1234567L');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe(DocumentType.NIE);
        expect(result.value.number).toBe('X1234567L');
      }
    });

    it('debería aceptar un NIE válido con Y (Y1234567X)', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'Y1234567X');
      expect(result.ok).toBe(true);
    });

    it('debería aceptar un NIE válido con Z (Z1234567R)', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'Z1234567R');
      expect(result.ok).toBe(true);
    });

    it('debería rechazar un NIE con letra de control incorrecta', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'X1234567A');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un NIE con formato inválido', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'A1234567L');
      expect(result.ok).toBe(false);
    });

    it('debería normalizar NIE a mayúsculas', () => {
      const result = IdentityDocument.create(DocumentType.NIE, 'x1234567l');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.number).toBe('X1234567L');
      }
    });
  });

  // --- Pasaporte ---

  describe('Passport validation', () => {
    it('debería aceptar un pasaporte alfanumérico válido', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, 'AB123456');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.type).toBe(DocumentType.PASSPORT);
      }
    });

    it('debería aceptar un pasaporte de 5 caracteres (mínimo)', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, 'A1234');
      expect(result.ok).toBe(true);
    });

    it('debería aceptar un pasaporte de 20 caracteres (máximo)', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, '12345678901234567890');
      expect(result.ok).toBe(true);
    });

    it('debería rechazar un pasaporte demasiado corto (4 caracteres)', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, 'A123');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un pasaporte demasiado largo (21 caracteres)', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, '123456789012345678901');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un pasaporte con caracteres especiales', () => {
      const result = IdentityDocument.create(DocumentType.PASSPORT, 'AB-123.456');
      expect(result.ok).toBe(false);
    });
  });

  // --- General ---

  describe('general', () => {
    it('debería rechazar número vacío', () => {
      const result = IdentityDocument.create(DocumentType.DNI, '');
      expect(result.ok).toBe(false);
    });

    it('debería recortar espacios', () => {
      const result = IdentityDocument.create(DocumentType.DNI, ' 12345678Z ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.number).toBe('12345678Z');
      }
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro IdentityDocument con los mismos datos', () => {
      const a = IdentityDocument.create(DocumentType.DNI, '12345678Z');
      const b = IdentityDocument.create(DocumentType.DNI, '12345678Z');
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });

    it('debería ser diferente a otro con distinto número', () => {
      const a = IdentityDocument.create(DocumentType.DNI, '12345678Z');
      const b = IdentityDocument.create(DocumentType.DNI, '00000000T');
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(false);
      }
    });
  });
});
