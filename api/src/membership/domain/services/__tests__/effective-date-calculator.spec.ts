import { describe, it, expect } from 'vitest';
import { EffectiveDateCalculator } from '../effective-date-calculator';
import { EffectiveDateType } from '../../value-objects/effective-date-type';

describe('EffectiveDateCalculator', () => {
  describe('IMMEDIATE', () => {
    it('debe devolver la misma fecha de solicitud', () => {
      const requestDate = new Date('2026-07-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.IMMEDIATE,
      });

      expect(result.getTime()).toBe(requestDate.getTime());
    });

    it('debe devolver una copia independiente de la fecha original', () => {
      const requestDate = new Date('2026-03-10');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.IMMEDIATE,
      });

      // Verificar que es una copia, no la misma referencia
      expect(result).not.toBe(requestDate);
      expect(result.getTime()).toBe(requestDate.getTime());
    });
  });

  describe('END_OF_FISCAL_YEAR', () => {
    it('debe devolver 31 de diciembre del mismo año para fecha de julio', () => {
      const requestDate = new Date('2026-07-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_FISCAL_YEAR,
      });

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11); // diciembre = 11
      expect(result.getDate()).toBe(31);
    });

    it('debe devolver 31 de diciembre del mismo año para 1 de enero', () => {
      const requestDate = new Date('2026-01-01');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_FISCAL_YEAR,
      });

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });
  });

  describe('END_OF_NEXT_MONTH', () => {
    it('debe devolver 28 de febrero para solicitud del 15 de enero (año no bisiesto)', () => {
      // 2027 no es bisiesto
      const requestDate = new Date('2027-01-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_NEXT_MONTH,
      });

      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(1); // febrero = 1
      expect(result.getDate()).toBe(28);
    });

    it('debe devolver 29 de febrero para solicitud de enero en año bisiesto', () => {
      // 2028 es bisiesto
      const requestDate = new Date('2028-01-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_NEXT_MONTH,
      });

      expect(result.getFullYear()).toBe(2028);
      expect(result.getMonth()).toBe(1); // febrero = 1
      expect(result.getDate()).toBe(29);
    });

    it('debe devolver 31 de enero del año siguiente para solicitud del 15 de diciembre', () => {
      const requestDate = new Date('2026-12-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_NEXT_MONTH,
      });

      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0); // enero = 0
      expect(result.getDate()).toBe(31);
    });

    it('debe devolver 30 de abril para solicitud del 15 de marzo', () => {
      const requestDate = new Date('2026-03-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.END_OF_NEXT_MONTH,
      });

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // abril = 3
      expect(result.getDate()).toBe(30);
    });
  });

  describe('NOTICE_PERIOD', () => {
    it('debe sumar 30 días naturales desde el 15 de diciembre → 14 de enero siguiente', () => {
      const requestDate = new Date('2026-12-15');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.NOTICE_PERIOD,
        noticeDays: 30,
      });

      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0); // enero = 0
      expect(result.getDate()).toBe(14);
    });

    it('debe sumar 30 días naturales desde el 1 de julio → 31 de julio', () => {
      const requestDate = new Date('2026-07-01');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.NOTICE_PERIOD,
        noticeDays: 30,
      });

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(6); // julio = 6
      expect(result.getDate()).toBe(31);
    });

    it('debe devolver la misma fecha si noticeDays es 0', () => {
      const requestDate = new Date('2026-05-10');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.NOTICE_PERIOD,
        noticeDays: 0,
      });

      expect(result.getTime()).toBe(requestDate.getTime());
    });

    it('debe usar 0 días por defecto si noticeDays no se proporciona', () => {
      const requestDate = new Date('2026-05-10');

      const result = EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
        type: EffectiveDateType.NOTICE_PERIOD,
      });

      expect(result.getTime()).toBe(requestDate.getTime());
    });
  });

  describe('getAvailableOptions', () => {
    it('debe devolver 3 opciones sin noticeDays', () => {
      const requestDate = new Date('2026-06-15');

      const options = EffectiveDateCalculator.getAvailableOptions(requestDate);

      expect(options).toHaveLength(3);
      expect(options.map((o) => o.type)).toEqual([
        EffectiveDateType.IMMEDIATE,
        EffectiveDateType.END_OF_FISCAL_YEAR,
        EffectiveDateType.END_OF_NEXT_MONTH,
      ]);
    });

    it('debe devolver 4 opciones con noticeDays > 0', () => {
      const requestDate = new Date('2026-06-15');

      const options = EffectiveDateCalculator.getAvailableOptions(requestDate, 30);

      expect(options).toHaveLength(4);
      expect(options[3].type).toBe(EffectiveDateType.NOTICE_PERIOD);
      expect(options[3].label).toContain('30');
    });

    it('debe devolver 3 opciones con noticeDays = 0', () => {
      const requestDate = new Date('2026-06-15');

      const options = EffectiveDateCalculator.getAvailableOptions(requestDate, 0);

      expect(options).toHaveLength(3);
    });

    it('debe calcular las fechas correctamente para cada opción', () => {
      const requestDate = new Date('2026-06-15');

      const options = EffectiveDateCalculator.getAvailableOptions(requestDate, 30);

      // IMMEDIATE: misma fecha
      expect(options[0].effectiveDate.getTime()).toBe(requestDate.getTime());

      // END_OF_FISCAL_YEAR: 31 dic 2026
      expect(options[1].effectiveDate.getMonth()).toBe(11);
      expect(options[1].effectiveDate.getDate()).toBe(31);

      // END_OF_NEXT_MONTH: 31 jul 2026
      expect(options[2].effectiveDate.getMonth()).toBe(6);
      expect(options[2].effectiveDate.getDate()).toBe(31);

      // NOTICE_PERIOD: 15 jul 2026
      expect(options[3].effectiveDate.getMonth()).toBe(6);
      expect(options[3].effectiveDate.getDate()).toBe(15);
    });
  });

  describe('tipo no soportado', () => {
    it('debe lanzar error para tipo desconocido', () => {
      const requestDate = new Date('2026-01-01');

      expect(() =>
        EffectiveDateCalculator.calculateEffectiveDate(requestDate, {
          type: 'INVALID_TYPE' as EffectiveDateType,
        }),
      ).toThrow('Tipo de fecha efectiva no soportado');
    });
  });
});
