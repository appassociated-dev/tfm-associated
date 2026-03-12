import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeactivateMemberTypeHandler } from '../deactivate-member-type.handler';
import { DeactivateMemberTypeCommand } from '../deactivate-member-type.command';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { MemberType } from '../../../domain/aggregates/member-type';
import {
  MemberTypeNotFoundError,
  MemberTypeIsTransitionTargetError,
} from '../../../domain/exceptions';

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

describe('DeactivateMemberTypeHandler', () => {
  let handler: DeactivateMemberTypeHandler;
  let repository: MemberTypeRepository;

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByCode: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      existsByCode: vi.fn().mockResolvedValue(false),
      existsAsTransitionTarget: vi.fn().mockResolvedValue(false),
    };

    handler = new DeactivateMemberTypeHandler(repository);
  });

  it('debería desactivar un tipo de socio exitosamente', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberType);
    (repository.existsAsTransitionTarget as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const command = new DeactivateMemberTypeCommand('tenant-1', memberType.id.toValue());
    await handler.execute(command);

    expect(memberType.active).toBe(false);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el tipo de socio no existe', async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new DeactivateMemberTypeCommand(
      'tenant-1',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotFoundError);
  });

  it('debería lanzar error si es destino de transición', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberType);
    (repository.existsAsTransitionTarget as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = new DeactivateMemberTypeCommand('tenant-1', memberType.id.toValue());

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeIsTransitionTargetError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
