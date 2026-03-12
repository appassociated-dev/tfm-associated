import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenFiscalYearHandler } from '../open-fiscal-year.handler';
import { OpenFiscalYearCommand } from '../open-fiscal-year.command';
import { FiscalYearRepository } from '../../../domain/repositories/fiscal-year.repository';
import { FiscalYear } from '../../../domain/aggregates/fiscal-year';
import {
  FiscalYearAlreadyOpenError,
  FiscalYearOverlappingDatesError,
} from '../../../domain/exceptions';

/** Helper para crear un FiscalYear reconstituido. */
function createExistingFiscalYear(overrides: Record<string, unknown> = {}): FiscalYear {
  return FiscalYear.reconstitute({
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Ejercicio 2025',
    type: 'NATURAL_YEAR',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'OPEN',
    previousFiscalYearId: null,
    membersAtStart: 50,
    membersAtEnd: null,
    reportId: null,
    createdAt: new Date('2025-01-01'),
    closedAt: null,
    ...overrides,
  });
}

describe('OpenFiscalYearHandler', () => {
  let handler: OpenFiscalYearHandler;
  let repository: FiscalYearRepository;

  const validCommand = new OpenFiscalYearCommand(
    '660e8400-e29b-41d4-a716-446655440001', // tenantId
    'Ejercicio 2026',
    'NATURAL_YEAR',
    '2026-01-01',
    '2026-12-31',
    null, // previousFiscalYearId
    false, // carryOverMembers
    false, // applyAutomaticTransitions
  );

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findActive: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      findByName: vi.fn().mockResolvedValue(null),
      existsOpenFiscalYear: vi.fn().mockResolvedValue(false),
      findOverlapping: vi.fn().mockResolvedValue([]),
    };

    handler = new OpenFiscalYearHandler(repository);
  });

  it('debería crear y abrir un ejercicio fiscal exitosamente', async () => {
    const result = await handler.execute(validCommand);

    expect(result).toBeDefined();
    expect(result.fiscalYear).toBeDefined();
    expect(result.fiscalYear.name).toBe('Ejercicio 2026');
    expect(result.fiscalYear.type).toBe('NATURAL_YEAR');
    expect(result.fiscalYear.status).toBe('OPEN');
    expect(result.carriedOverMembers).toBe(0);
    expect(result.appliedTransitions).toEqual([]);
    expect(repository.setTenantId).toHaveBeenCalledWith(validCommand.tenantId);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si ya existe un ejercicio abierto', async () => {
    (repository.existsOpenFiscalYear as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(handler.execute(validCommand)).rejects.toThrow(FiscalYearAlreadyOpenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si las fechas se solapan con un ejercicio existente', async () => {
    const existing = createExistingFiscalYear({
      status: 'CLOSED',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
      name: 'Temporada 2026-2027',
    });

    (repository.findOverlapping as ReturnType<typeof vi.fn>).mockResolvedValue([existing]);

    await expect(handler.execute(validCommand)).rejects.toThrow(FiscalYearOverlappingDatesError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si las fechas del periodo son inválidas', async () => {
    const invalidCommand = new OpenFiscalYearCommand(
      '660e8400-e29b-41d4-a716-446655440001',
      'Ejercicio Inválido',
      'NATURAL_YEAR',
      '2026-12-31', // startDate > endDate
      '2026-01-01',
      null,
      false,
      false,
    );

    await expect(handler.execute(invalidCommand)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería establecer el tenantId antes de operar', async () => {
    await handler.execute(validCommand);

    expect(repository.setTenantId).toHaveBeenCalledWith(validCommand.tenantId);
    expect(repository.setTenantId).toHaveBeenCalledBefore(
      repository.existsOpenFiscalYear as ReturnType<typeof vi.fn>,
    );
  });
});
