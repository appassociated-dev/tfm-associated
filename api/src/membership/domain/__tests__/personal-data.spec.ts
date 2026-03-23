import { describe, it, expect } from 'vitest';
import { PersonalData, PersonalDataInvalidError } from '../value-objects/personal-data';

describe('PersonalData', () => {
  const validProps = {
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-06-15'),
  };

  describe('create()', () => {
    it('debería crear PersonalData con datos válidos', () => {
      const result = PersonalData.create(validProps);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Juan');
        expect(result.value.surnames).toBe('García López');
        expect(result.value.birthDate).toEqual(new Date('1990-06-15'));
      }
    });

    it('debería recortar espacios en nombre y apellidos', () => {
      const result = PersonalData.create({
        ...validProps,
        name: '  Juan  ',
        surnames: '  García López  ',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Juan');
        expect(result.value.surnames).toBe('García López');
      }
    });

    it('debería rechazar nombre vacío', () => {
      const result = PersonalData.create({ ...validProps, name: '' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(PersonalDataInvalidError);
      }
    });

    it('debería rechazar nombre solo con espacios', () => {
      const result = PersonalData.create({ ...validProps, name: '   ' });
      expect(result.ok).toBe(false);
    });

    it('debería rechazar apellidos vacíos', () => {
      const result = PersonalData.create({ ...validProps, surnames: '' });
      expect(result.ok).toBe(false);
    });

    it('debería rechazar fecha de nacimiento futura', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const result = PersonalData.create({ ...validProps, birthDate: future });
      expect(result.ok).toBe(false);
    });

    it('debería aceptar fecha de nacimiento de hoy', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = PersonalData.create({ ...validProps, birthDate: today });
      expect(result.ok).toBe(true);
    });
  });

  describe('getAge()', () => {
    it('debería calcular la edad correctamente', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      birthDate.setMonth(0, 1); // 1 de enero hace 30 años
      const result = PersonalData.create({ ...validProps, birthDate });
      expect(result.ok).toBe(true);
      if (result.ok) {
        // La edad puede ser 30 o 29 dependiendo del día actual
        expect(result.value.getAge()).toBeGreaterThanOrEqual(29);
        expect(result.value.getAge()).toBeLessThanOrEqual(30);
      }
    });

    it('debería devolver 0 para un bebé nacido hoy', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = PersonalData.create({ ...validProps, birthDate: today });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getAge()).toBe(0);
      }
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro PersonalData con los mismos datos', () => {
      const a = PersonalData.create(validProps);
      const b = PersonalData.create(validProps);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });
  });
});
