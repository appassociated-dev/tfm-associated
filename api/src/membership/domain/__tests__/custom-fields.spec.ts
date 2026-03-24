import { describe, it, expect } from 'vitest';
import { CustomFields } from '../value-objects/custom-fields';

describe('CustomFields', () => {
  describe('create()', () => {
    it('debería crear CustomFields vacíos sin tipo de colectividad', () => {
      const result = CustomFields.create({});
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({});
      }
    });

    it('debería crear CustomFields con datos arbitrarios sin tipo de colectividad', () => {
      const data = { someField: 'value', anotherField: 42 };
      const result = CustomFields.create(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(data);
      }
    });

    // --- Cofradía (BROTHERHOOD) ---
    it('debería aceptar campos válidos para cofradía', () => {
      const data = {
        baptismDate: '2000-01-15',
        parish: 'San Juan',
        godparents: 'Pedro García',
        ruleSwornDate: '2020-03-20',
        medalImpositionDate: '2020-04-01',
        tunicType: 'Nazareno',
        processionPosition: 'Primera fila',
      };
      const result = CustomFields.create(data, 'BROTHERHOOD');
      expect(result.ok).toBe(true);
    });

    it('debería aceptar cofradía con solo campos opcionales parciales', () => {
      const data = { parish: 'San Juan' };
      const result = CustomFields.create(data, 'BROTHERHOOD');
      expect(result.ok).toBe(true);
    });

    // --- Club Deportivo (SPORTS_CLUB) ---
    it('debería aceptar campos válidos para club deportivo', () => {
      const data = {
        sportsCategory: 'Senior',
        federativeLicenseNumber: 'FED-12345',
        licenseExpiryDate: '2025-12-31',
        medicalCertificateDate: '2024-06-01',
        medicalCertificateExpiry: '2025-06-01',
      };
      const result = CustomFields.create(data, 'SPORTS_CLUB');
      expect(result.ok).toBe(true);
    });

    // --- Peña (SOCIAL_CLUB) ---
    it('debería aceptar campos válidos para peña festera', () => {
      const data = {
        shirtSize: 'L',
        pantsSize: '42',
        dietaryPreferences: 'Vegetariano',
        allergies: 'Gluten',
        volunteerAvailability: true,
        hasVehicle: false,
      };
      const result = CustomFields.create(data, 'SOCIAL_CLUB');
      expect(result.ok).toBe(true);
    });

    // --- Asociación Cultural (CULTURAL_ASSOCIATION) ---
    it('debería aceptar campos válidos para asociación cultural', () => {
      const data = {
        profession: 'Ingeniero',
        skills: ['Programación', 'Diseño'],
        areasOfInterest: ['Tecnología', 'Arte'],
        languages: ['Español', 'Inglés'],
        availability: 'Tardes',
      };
      const result = CustomFields.create(data, 'CULTURAL_ASSOCIATION');
      expect(result.ok).toBe(true);
    });

    // --- Campos no reconocidos ---
    it('debería ignorar campos no reconocidos sin error', () => {
      const data = {
        unknownField: 'value',
        anotherUnknown: 42,
      };
      const result = CustomFields.create(data, 'BROTHERHOOD');
      expect(result.ok).toBe(true);
    });

    it('debería ignorar tipo de colectividad desconocido', () => {
      const data = { someField: 'value' };
      const result = CustomFields.create(data, 'UNKNOWN_TYPE');
      expect(result.ok).toBe(true);
    });
  });

  describe('getValue()', () => {
    it('debería devolver el valor de un campo existente', () => {
      const result = CustomFields.create({ parish: 'San Juan' }, 'BROTHERHOOD');
      if (result.ok) {
        expect(result.value.getValue('parish')).toBe('San Juan');
      }
    });

    it('debería devolver undefined para un campo inexistente', () => {
      const result = CustomFields.create({ parish: 'San Juan' });
      if (result.ok) {
        expect(result.value.getValue('nonExistent')).toBeUndefined();
      }
    });
  });

  describe('equals()', () => {
    it('debería ser igual a otro CustomFields con los mismos datos', () => {
      const data = { parish: 'San Juan' };
      const a = CustomFields.create(data);
      const b = CustomFields.create(data);
      if (a.ok && b.ok) {
        expect(a.value.equals(b.value)).toBe(true);
      }
    });
  });
});
