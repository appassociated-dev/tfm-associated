import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetMemberTypeHandler } from '../get-member-type.handler';
import { GetMemberTypeQuery } from '../get-member-type.query';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { MemberType } from '../../../domain/aggregates/member-type';
import { MemberTypeNotFoundError } from '../../../domain/exceptions';

/** Helper para crear un MemberType válido para tests. */
function createTestMemberType(): MemberType {
  const result = MemberType.create({
    code: 'NUMERARIO',
    name: 'Hermano Numerario',
    description: 'Desc',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 6,
    minimumSeniorityForOffice: 24,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    collectivityType: 'COFRADIA',
    tenantId: 'tenant-1',
  });

  if (!result.ok) throw result.error;
  return result.value;
}

describe('GetMemberTypeHandler', () => {
  let handler: GetMemberTypeHandler;
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

    handler = new GetMemberTypeHandler(repository);
  });

  it('debería devolver un tipo de socio existente', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberType);

    const query = new GetMemberTypeQuery('tenant-1', memberType.id.toValue());
    const result = await handler.execute(query);

    expect(result.id).toBe(memberType.id.toValue());
    expect(result.code).toBe('NUMERARIO');
    expect(result.name).toBe('Hermano Numerario');
  });

  it('debería lanzar error si no se encuentra el tipo de socio', async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetMemberTypeQuery('tenant-1', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    await expect(handler.execute(query)).rejects.toThrow(MemberTypeNotFoundError);
  });
});
