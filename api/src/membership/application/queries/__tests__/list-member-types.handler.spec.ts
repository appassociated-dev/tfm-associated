import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListMemberTypesHandler } from '../list-member-types.handler';
import { ListMemberTypesQuery } from '../list-member-types.query';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { MemberType } from '../../../domain/aggregates/member-type';

/** Helper para crear un MemberType válido para tests. */
function createTestMemberType(code: string, active = true): MemberType {
  const result = MemberType.create({
    code,
    name: `Tipo ${code}`,
    description: 'Desc',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    collectivityType: 'COFRADIA',
    tenantId: 'tenant-1',
  });

  if (!result.ok) throw result.error;
  const mt = result.value;
  if (!active) mt.deactivate();
  return mt;
}

describe('ListMemberTypesHandler', () => {
  let handler: ListMemberTypesHandler;
  let repository: MemberTypeRepository;

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      existsAsTransitionTarget: vi.fn(),
    };

    handler = new ListMemberTypesHandler(repository);
  });

  it('debería devolver todos los tipos de socio sin filtro', async () => {
    const types = [createTestMemberType('TIPO_A'), createTestMemberType('TIPO_B', false)];
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(types);

    const query = new ListMemberTypesQuery('tenant-1');
    const result = await handler.execute(query);

    expect(result.length).toBe(2);
  });

  it('debería filtrar solo activos cuando active=true', async () => {
    const types = [createTestMemberType('TIPO_A'), createTestMemberType('TIPO_B', false)];
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(types);

    const query = new ListMemberTypesQuery('tenant-1', true);
    const result = await handler.execute(query);

    expect(result.length).toBe(1);
    expect(result[0].active).toBe(true);
  });

  it('debería filtrar solo inactivos cuando active=false', async () => {
    const types = [createTestMemberType('TIPO_A'), createTestMemberType('TIPO_B', false)];
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(types);

    const query = new ListMemberTypesQuery('tenant-1', false);
    const result = await handler.execute(query);

    expect(result.length).toBe(1);
    expect(result[0].active).toBe(false);
  });

  it('debería devolver lista vacía si no hay tipos', async () => {
    (repository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new ListMemberTypesQuery('tenant-1');
    const result = await handler.execute(query);

    expect(result.length).toBe(0);
  });
});
