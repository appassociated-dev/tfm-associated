import { describe, it, expect } from 'vitest';
import { BankDetails, IbanInvalidError } from '../value-objects/bank-details';

describe('BankDetails', () => {
  // IBAN válido de ejemplo (España)
  const VALID_IBAN = 'ES9121000418450200051332';

  describe('create()', () => {
    it('debería aceptar un IBAN español válido', () => {
      const result = BankDetails.create(VALID_IBAN);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.iban).toBe('ES9121000418450200051332');
      }
    });

    it('debería normalizar IBAN eliminando espacios y convirtiendo a mayúsculas', () => {
      const result = BankDetails.create('es91 2100 0418 4502 0005 1332');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.iban).toBe('ES9121000418450200051332');
      }
    });

    it('debería rechazar un IBAN con mod 97 inválido', () => {
      const result = BankDetails.create('ES0021000418450200051332');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(IbanInvalidError);
      }
    });

    it('debería rechazar un IBAN vacío', () => {
      const result = BankDetails.create('');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un IBAN demasiado corto', () => {
      const result = BankDetails.create('ES91');
      expect(result.ok).toBe(false);
    });

    it('debería rechazar un IBAN con caracteres especiales', () => {
      const result = BankDetails.create('ES91-2100-0418-4502-0005-1332');
      expect(result.ok).toBe(false);
    });

    it('debería aceptar IBAN de otros países (GB)', () => {
      // IBAN de ejemplo UK: GB29 NWBK 6016 1331 9268 19
      const result = BankDetails.create('GB29NWBK60161331926819');
      expect(result.ok).toBe(true);
    });
  });

  describe('getMaskedIban()', () => {
    it('debería enmascarar el IBAN mostrando solo los primeros 4 y últimos 4 caracteres', () => {
      const result = BankDetails.create(VALID_IBAN);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const masked = result.value.getMaskedIban();
        expect(masked).toBe('ES91****************1332');
      }
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro BankDetails con el mismo IBAN', () => {
      const a = BankDetails.create(VALID_IBAN);
      const b = BankDetails.create(VALID_IBAN);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });
  });
});
