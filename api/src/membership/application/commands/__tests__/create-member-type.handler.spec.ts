import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateMemberTypeHandler } from '../create-member-type.handler';
import { CreateMemberTypeCommand } from '../create-member-type.command';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import {
  MemberTypeCodeAlreadyExistsError,
  InvalidMemberTypeDataError,
  MemberTypeNotFoundError,
} from '../../../domain/exceptions';

describe('CreateMemberTypeHandler', () => {
  let handler: CreateMemberTypeHandler;
  let repository: MemberTypeRepository;

  const validCommand = new CreateMemberTypeCommand(
    'tenant-uuid-1234-5678-abcdefghijkl',
    'NUMERARIO',
    'Hermano Numerario',
    'Hermano de pleno derecho.',
    18,
    null,
    true,
    true,
    6,
    24,
    null,
    {},
    'COFRADIA',
  );

  beforeEach(() => {
    repository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByCode: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      existsByCode: vi.fn().mockResolvedValue(false),
      existsAsTransitionTarget: vi.fn().mockResolvedValue(false),
    };

    handler = new CreateMemberTypeHandler(repository);
  });

  it('debería crear un tipo de socio exitosamente', async () => {
    const result = await handler.execute(validCommand);

    expect(result).toBeDefined();
    expect(result.code).toBe('NUMERARIO');
    expect(result.name).toBe('Hermano Numerario');
    expect(result.votingRight).toBe(true);
    expect(result.active).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el código ya existe', async () => {
    (repository.existsByCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(handler.execute(validCommand)).rejects.toThrow(MemberTypeCodeAlreadyExistsError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el código tiene formato inválido', async () => {
    const invalidCommand = new CreateMemberTypeCommand(
      'tenant-uuid',
      'x', // Código demasiado corto
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

    await expect(handler.execute(invalidCommand)).rejects.toThrow(InvalidMemberTypeDataError);
  });

  it('debería lanzar error si la transición destino no existe', async () => {
    const targetId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const commandWithTarget = new CreateMemberTypeCommand(
      'tenant-uuid',
      'NUMERARIO',
      'Hermano Numerario',
      'Desc',
      18,
      null,
      true,
      true,
      6,
      24,
      targetId,
      {},
      'COFRADIA',
    );

    (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(handler.execute(commandWithTarget)).rejects.toThrow(MemberTypeNotFoundError);
  });

  it('debería validar datos del aggregate (nombre vacío)', async () => {
    const invalidCommand = new CreateMemberTypeCommand(
      'tenant-uuid',
      'NUMERARIO',
      '', // Nombre vacío
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

    await expect(handler.execute(invalidCommand)).rejects.toThrow(InvalidMemberTypeDataError);
  });
});
