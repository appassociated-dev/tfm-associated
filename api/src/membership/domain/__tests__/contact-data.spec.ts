import { describe, it, expect } from 'vitest';
import { ContactData, ContactDataInvalidError } from '../value-objects/contact-data';

describe('ContactData', () => {
  const validProps = {
    email: 'juan@example.com',
    phone: '+34612345678',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
  };

  describe('create()', () => {
    it('debería crear ContactData con datos válidos completos', () => {
      const result = ContactData.create(validProps);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.email).toBe('juan@example.com');
        expect(result.value.phone).toBe('+34612345678');
        expect(result.value.address).toBe('Calle Mayor 1');
        expect(result.value.postalCode).toBe('28001');
        expect(result.value.city).toBe('Madrid');
      }
    });

    it('debería crear ContactData con solo email (campos opcionales null)', () => {
      const result = ContactData.create({
        email: 'juan@example.com',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.phone).toBeNull();
        expect(result.value.address).toBeNull();
        expect(result.value.postalCode).toBeNull();
        expect(result.value.city).toBeNull();
      }
    });

    it('debería normalizar el email a minúsculas y recortar espacios', () => {
      const result = ContactData.create({
        ...validProps,
        email: '  Juan@Example.COM  ',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.email).toBe('juan@example.com');
      }
    });

    it('debería rechazar email vacío', () => {
      const result = ContactData.create({ ...validProps, email: '' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ContactDataInvalidError);
      }
    });

    it('debería rechazar email sin formato válido', () => {
      const result = ContactData.create({ ...validProps, email: 'not-an-email' });
      expect(result.ok).toBe(false);
    });

    it('debería rechazar email sin dominio', () => {
      const result = ContactData.create({ ...validProps, email: 'juan@' });
      expect(result.ok).toBe(false);
    });

    it('debería rechazar email sin @', () => {
      const result = ContactData.create({ ...validProps, email: 'juanexample.com' });
      expect(result.ok).toBe(false);
    });

    it('debería aceptar email con subdominio', () => {
      const result = ContactData.create({ ...validProps, email: 'juan@mail.example.com' });
      expect(result.ok).toBe(true);
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro ContactData con los mismos datos', () => {
      const a = ContactData.create(validProps);
      const b = ContactData.create(validProps);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });
  });
});
