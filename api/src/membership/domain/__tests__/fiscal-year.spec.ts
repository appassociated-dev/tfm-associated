import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { FiscalYear } from '../aggregates/fiscal-year';
import { FiscalYearPeriod } from '../value-objects/fiscal-year-period';
import { FiscalYearOpenedEvent } from '../events/fiscal-year-opened.event';
import { FiscalYearClosedEvent } from '../events/fiscal-year-closed.event';
import { FiscalYearInvalidTransitionError } from '../exceptions/fiscal-year-invalid-transition.exception';

/** Props válidas para crear un FiscalYear. */
const validProps = {
  name: 'Ejercicio 2026',
  type: 'NATURAL_YEAR',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  previousFiscalYearId: null as string | null,
};

describe('FiscalYear', () => {
  // --- create() con datos válidos ---

  it('debería crear un FiscalYear con estado PREPARATION', () => {
    const result = FiscalYear.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const fy = result.value;
      expect(uuidValidate(fy.id.toValue())).toBe(true);
      expect(fy.name).toBe('Ejercicio 2026');
      expect(fy.type.value).toBe('NATURAL_YEAR');
      expect(fy.status.value).toBe('PREPARATION');
      expect(fy.membersAtStart).toBe(0);
      expect(fy.membersAtEnd).toBeNull();
      expect(fy.closedAt).toBeNull();
      expect(fy.previousFiscalYearId).toBeNull();
      expect(fy.reportId).toBeNull();
      expect(fy.isOpen()).toBe(false);
      expect(fy.isClosed()).toBe(false);
    }
  });

  it('debería fallar con nombre vacío', () => {
    const result = FiscalYear.create({ ...validProps, name: '' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('vacío');
    }
  });

  it('debería fallar con tipo inválido', () => {
    const result = FiscalYear.create({ ...validProps, type: 'INVALID' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('inválido');
    }
  });

  // --- open() ---

  it('debería abrir un FiscalYear desde PREPARATION y emitir evento', () => {
    const result = FiscalYear.create(validProps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fy = result.value;
    fy.open(150);

    expect(fy.status.value).toBe('OPEN');
    expect(fy.membersAtStart).toBe(150);
    expect(fy.isOpen()).toBe(true);

    const events = fy.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FiscalYearOpenedEvent);

    const payload = (events[0] as FiscalYearOpenedEvent).payload;
    expect(payload.fiscalYearId).toBe(fy.id.toValue());
    expect(payload.carriedOverMembers).toBe(150);
  });

  it('debería lanzar error al abrir desde CLOSED', () => {
    const fy = FiscalYear.reconstitute({
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Ejercicio 2025',
      type: 'NATURAL_YEAR',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'CLOSED',
      previousFiscalYearId: null,
      membersAtStart: 100,
      membersAtEnd: 120,
      reportId: null,
      createdAt: new Date('2025-01-01'),
      closedAt: new Date('2025-12-31'),
    });

    expect(() => fy.open(100)).toThrow(FiscalYearInvalidTransitionError);
  });

  // --- close() ---

  it('debería cerrar un FiscalYear desde OPEN y emitir evento', () => {
    const result = FiscalYear.create(validProps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fy = result.value;
    fy.open(100);
    fy.pullDomainEvents(); // Limpiar evento de apertura

    fy.close(120, ['Aviso de prueba']);

    expect(fy.status.value).toBe('CLOSED');
    expect(fy.membersAtEnd).toBe(120);
    expect(fy.closedAt).toBeInstanceOf(Date);
    expect(fy.isClosed()).toBe(true);
    expect(fy.isOpen()).toBe(false);

    const events = fy.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FiscalYearClosedEvent);

    const payload = (events[0] as FiscalYearClosedEvent).payload;
    expect(payload.fiscalYearId).toBe(fy.id.toValue());
    expect(payload.membersAtEnd).toBe(120);
    expect(payload.warnings).toEqual(['Aviso de prueba']);
  });

  it('debería lanzar error al cerrar desde PREPARATION', () => {
    const result = FiscalYear.create(validProps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fy = result.value;
    expect(() => fy.close(100, [])).toThrow(FiscalYearInvalidTransitionError);
  });
});

describe('FiscalYearPeriod', () => {
  // --- create() ---

  it('debería crear un periodo con fechas válidas', () => {
    const result = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-12-31'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.startDate).toEqual(new Date('2026-01-01'));
      expect(result.value.endDate).toEqual(new Date('2026-12-31'));
    }
  });

  it('debería fallar con fechas invertidas', () => {
    const result = FiscalYearPeriod.create(new Date('2026-12-31'), new Date('2026-01-01'));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FISCAL_YEAR_PERIOD.INVALID');
      expect(result.error.message).toContain('anterior');
    }
  });

  it('debería fallar con fechas iguales', () => {
    const date = new Date('2026-06-15');
    const result = FiscalYearPeriod.create(date, date);

    expect(result.ok).toBe(false);
  });

  // --- overlaps() ---

  it('debería detectar periodos solapados', () => {
    const p1 = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-06-30'));
    const p2 = FiscalYearPeriod.create(new Date('2026-03-01'), new Date('2026-12-31'));

    expect(p1.ok && p2.ok).toBe(true);
    if (p1.ok && p2.ok) {
      expect(p1.value.overlaps(p2.value)).toBe(true);
      expect(p2.value.overlaps(p1.value)).toBe(true);
    }
  });

  it('debería detectar periodos no solapados', () => {
    const p1 = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-06-30'));
    const p2 = FiscalYearPeriod.create(new Date('2026-08-01'), new Date('2026-12-31'));

    expect(p1.ok && p2.ok).toBe(true);
    if (p1.ok && p2.ok) {
      expect(p1.value.overlaps(p2.value)).toBe(false);
      expect(p2.value.overlaps(p1.value)).toBe(false);
    }
  });

  it('debería detectar periodos adyacentes como solapados (extremos incluidos)', () => {
    const p1 = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-06-30'));
    const p2 = FiscalYearPeriod.create(new Date('2026-06-30'), new Date('2026-12-31'));

    expect(p1.ok && p2.ok).toBe(true);
    if (p1.ok && p2.ok) {
      expect(p1.value.overlaps(p2.value)).toBe(true);
    }
  });

  it('debería detectar periodo contenido dentro de otro', () => {
    const outer = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-12-31'));
    const inner = FiscalYearPeriod.create(new Date('2026-03-01'), new Date('2026-09-30'));

    expect(outer.ok && inner.ok).toBe(true);
    if (outer.ok && inner.ok) {
      expect(outer.value.overlaps(inner.value)).toBe(true);
      expect(inner.value.overlaps(outer.value)).toBe(true);
    }
  });

  // --- containsDate() ---

  it('debería contener una fecha dentro del periodo', () => {
    const result = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-12-31'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.containsDate(new Date('2026-06-15'))).toBe(true);
    }
  });

  it('debería contener las fechas extremo del periodo', () => {
    const result = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-12-31'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.containsDate(new Date('2026-01-01'))).toBe(true);
      expect(result.value.containsDate(new Date('2026-12-31'))).toBe(true);
    }
  });

  it('no debería contener una fecha fuera del periodo', () => {
    const result = FiscalYearPeriod.create(new Date('2026-01-01'), new Date('2026-12-31'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.containsDate(new Date('2025-12-31'))).toBe(false);
      expect(result.value.containsDate(new Date('2027-01-01'))).toBe(false);
    }
  });
});
