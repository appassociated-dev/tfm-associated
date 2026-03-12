import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateMemberTypeHandler } from '../update-member-type.handler';
import { UpdateMemberTypeCommand } from '../update-member-type.command';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { MemberType } from '../../../domain/aggregates/member-type';
import { MemberTypeNotFoundError, CircularTransitionError } from '../../../domain/exceptions';

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

describe('UpdateMemberTypeHandler', () => {
  let handler: UpdateMemberTypeHandler;
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

    handler = new UpdateMemberTypeHandler(repository);
  });

  it('debería actualizar un tipo de socio exitosamente', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberType);

    const command = new UpdateMemberTypeCommand(
      'tenant-1',
      memberType.id.toValue(),
      'Hermano Numerario Actualizado',
      'Descripción actualizada',
      18,
      null,
      true,
      false,
      6,
      24,
      null,
      {},
      'COFRADIA',
    );

    const result = await handler.execute(command);

    expect(result.name).toBe('Hermano Numerario Actualizado');
    expect(result.eligibleForOffice).toBe(false);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el tipo de socio no existe', async () => {
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new UpdateMemberTypeCommand(
      'tenant-1',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'Nombre',
      'Desc',
      null,
      null,
      false,
      false,
      0,
      0,
      null,
      {},
      'COFRADIA',
    );

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotFoundError);
  });

  it('debería lanzar error si la transición destino es a sí mismo', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberType);

    const command = new UpdateMemberTypeCommand(
      'tenant-1',
      memberType.id.toValue(),
      'Nombre',
      'Desc',
      null,
      null,
      false,
      false,
      0,
      0,
      memberType.id.toValue(), // Transición circular
      {},
      'COFRADIA',
    );

    await expect(handler.execute(command)).rejects.toThrow(CircularTransitionError);
  });

  it('debería lanzar error si la transición destino no existe', async () => {
    const memberType = createTestMemberType();
    (repository.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(memberType) // Primera llamada: buscar el tipo a actualizar
      .mockResolvedValueOnce(null); // Segunda llamada: buscar el tipo destino

    const command = new UpdateMemberTypeCommand(
      'tenant-1',
      memberType.id.toValue(),
      'Nombre',
      'Desc',
      null,
      null,
      false,
      false,
      0,
      0,
      'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      {},
      'COFRADIA',
    );

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotFoundError);
  });
});
