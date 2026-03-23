import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompareFiscalYearsHandler } from '../compare-fiscal-years.handler';
import { CompareFiscalYearsQuery } from '../compare-fiscal-years.query';
import { FiscalYearRepository } from '../../../domain/repositories/fiscal-year.repository';
import { FiscalYear } from '../../../domain/aggregates/fiscal-year';
import { FiscalYearNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';

/** Helper para crear un FiscalYear reconstituido. */
function createFiscalYear(id: string, name: string, membersAtEnd: number | null): FiscalYear {
  return FiscalYear.reconstitute({
    id,
    name,
    type: 'NATURAL_YEAR',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'CLOSED',
    previousFiscalYearId: null,
    membersAtStart: 50,
    membersAtEnd,
    reportId: null,
    createdAt: new Date('2025-01-01'),
    closedAt: new Date('2025-12-31'),
  });
}

describe('CompareFiscalYearsHandler', () => {
  let handler: CompareFiscalYearsHandler;
  let repository: FiscalYearRepository;

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findActive: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      findByName: vi.fn().mockResolvedValue(null),
      existsOpenFiscalYear: vi.fn().mockResolvedValue(false),
      findOverlapping: vi.fn().mockResolvedValue([]),
    };

    handler = new CompareFiscalYearsHandler(repository);
  });

  it('debería comparar ejercicios fiscales con datos completos', async () => {
    const fy1Id = '550e8400-e29b-41d4-a716-446655440001';
    const fy2Id = '550e8400-e29b-41d4-a716-446655440002';

    const fy1 = createFiscalYear(fy1Id, 'Ejercicio 2024', 45);
    const fy2 = createFiscalYear(fy2Id, 'Ejercicio 2025', 60);

    (repository.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(fy1)
      .mockResolvedValueOnce(fy2);

    const query = new CompareFiscalYearsQuery(TENANT_ID, [fy1Id, fy2Id]);
    const result = await handler.execute(query);

    expect(result.years).toHaveLength(2);
    expect(result.years[0].fiscalYearId).toBe(fy1Id);
    expect(result.years[0].name).toBe('Ejercicio 2024');
    expect(result.years[0].activeMembers).toBe(45);
    expect(result.years[1].fiscalYearId).toBe(fy2Id);
    expect(result.years[1].activeMembers).toBe(60);
  });

  it('debería usar membersAtStart cuando membersAtEnd es null', async () => {
    const fyId = '550e8400-e29b-41d4-a716-446655440001';
    const fy = createFiscalYear(fyId, 'Ejercicio 2025', null);

    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(fy);

    const query = new CompareFiscalYearsQuery(TENANT_ID, [fyId]);
    const result = await handler.execute(query);

    expect(result.years[0].activeMembers).toBe(50); // membersAtStart
  });

  it('debería lanzar error si un ejercicio no existe', async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new CompareFiscalYearsQuery(TENANT_ID, ['550e8400-e29b-41d4-a716-446655440099']);

    await expect(handler.execute(query)).rejects.toThrow(FiscalYearNotFoundError);
  });

  it('debería retornar valores MVP (newMembers=0, leavingMembers=0, retentionRate=0)', async () => {
    const fyId = '550e8400-e29b-41d4-a716-446655440001';
    const fy = createFiscalYear(fyId, 'Ejercicio 2025', 60);

    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(fy);

    const query = new CompareFiscalYearsQuery(TENANT_ID, [fyId]);
    const result = await handler.execute(query);

    expect(result.years[0].newMembers).toBe(0);
    expect(result.years[0].leavingMembers).toBe(0);
    expect(result.years[0].retentionRate).toBe(0);
  });
});
