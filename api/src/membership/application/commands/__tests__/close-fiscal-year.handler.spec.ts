import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloseFiscalYearHandler } from '../close-fiscal-year.handler';
import { CloseFiscalYearCommand } from '../close-fiscal-year.command';
import { FiscalYearRepository } from '../../../domain/repositories/fiscal-year.repository';
import { FiscalYear } from '../../../domain/aggregates/fiscal-year';
import {
  FiscalYearNotFoundError,
  FiscalYearInvalidTransitionError,
} from '../../../domain/exceptions';

const FISCAL_YEAR_ID = '550e8400-e29b-41d4-a716-446655440001';
const TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';

/** Helper para crear un FiscalYear reconstituido. */
function createExistingFiscalYear(overrides: Record<string, unknown> = {}): FiscalYear {
  return FiscalYear.reconstitute({
    id: FISCAL_YEAR_ID,
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

describe('CloseFiscalYearHandler', () => {
  let handler: CloseFiscalYearHandler;
  let repository: FiscalYearRepository;

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createExistingFiscalYear()),
      findActive: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      findByName: vi.fn().mockResolvedValue(null),
      existsOpenFiscalYear: vi.fn().mockResolvedValue(false),
      findOverlapping: vi.fn().mockResolvedValue([]),
    };

    handler = new CloseFiscalYearHandler(repository);
  });

  it('debería cerrar un ejercicio fiscal abierto exitosamente', async () => {
    const command = new CloseFiscalYearCommand(TENANT_ID, FISCAL_YEAR_ID, false);

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.fiscalYear.status).toBe('CLOSED');
    expect(result.fiscalYear.closedAt).toBeDefined();
    expect(result.warnings).toEqual([]);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el ejercicio no existe', async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new CloseFiscalYearCommand(TENANT_ID, FISCAL_YEAR_ID, false);

    await expect(handler.execute(command)).rejects.toThrow(FiscalYearNotFoundError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el ejercicio no está abierto', async () => {
    const closedFiscalYear = createExistingFiscalYear({ status: 'CLOSED', closedAt: new Date() });
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(closedFiscalYear);

    const command = new CloseFiscalYearCommand(TENANT_ID, FISCAL_YEAR_ID, false);

    await expect(handler.execute(command)).rejects.toThrow(FiscalYearInvalidTransitionError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el ejercicio está en preparación', async () => {
    const prepFiscalYear = createExistingFiscalYear({ status: 'PREPARATION' });
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(prepFiscalYear);

    const command = new CloseFiscalYearCommand(TENANT_ID, FISCAL_YEAR_ID, false);

    await expect(handler.execute(command)).rejects.toThrow(FiscalYearInvalidTransitionError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería establecer el tenantId antes de operar', async () => {
    const command = new CloseFiscalYearCommand(TENANT_ID, FISCAL_YEAR_ID, false);

    await handler.execute(command);

    expect(repository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
