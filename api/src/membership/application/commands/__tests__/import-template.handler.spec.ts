import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportTemplateHandler } from '../import-template.handler';
import { ImportTemplateCommand } from '../import-template.command';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { InvalidMemberTypeDataError } from '../../../domain/exceptions';

describe('ImportTemplateHandler', () => {
  let handler: ImportTemplateHandler;
  let repository: MemberTypeRepository;

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

    handler = new ImportTemplateHandler(repository);
  });

  it('debería importar plantillas de cofradía exitosamente', async () => {
    const command = new ImportTemplateCommand('tenant-1', 'COFRADIA');
    const result = await handler.execute(command);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('NUMERARIO');
    expect(result[1].code).toBe('HONORARIO');
    expect(result[2].code).toBe('ASPIRANTE');
    expect(result[3].code).toBe('MENOR_EDAD');
    expect(repository.save).toHaveBeenCalledTimes(4);
  });

  it('debería importar plantillas de peña exitosamente', async () => {
    const command = new ImportTemplateCommand('tenant-1', 'PENA');
    const result = await handler.execute(command);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('ADULTO');
    expect(repository.save).toHaveBeenCalledTimes(4);
  });

  it('debería importar plantillas de club deportivo exitosamente', async () => {
    const command = new ImportTemplateCommand('tenant-1', 'CLUB_DEPORTIVO');
    const result = await handler.execute(command);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('SOCIO_CLUB');
  });

  it('debería importar plantillas de asociación cultural exitosamente', async () => {
    const command = new ImportTemplateCommand('tenant-1', 'ASOCIACION_CULTURAL');
    const result = await handler.execute(command);

    expect(result.length).toBe(4);
    expect(result[0].code).toBe('ORDINARIO');
  });

  it('debería lanzar error si el tipo de colectividad no tiene plantillas', async () => {
    const command = new ImportTemplateCommand('tenant-1', 'INVALID_TYPE');

    await expect(handler.execute(command)).rejects.toThrow(InvalidMemberTypeDataError);
  });

  it('debería saltar tipos que ya existen (importación parcial)', async () => {
    // Simular que NUMERARIO ya existe
    (repository.existsByCode as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(true) // NUMERARIO ya existe
      .mockResolvedValueOnce(false) // HONORARIO no existe
      .mockResolvedValueOnce(false) // ASPIRANTE no existe
      .mockResolvedValueOnce(false); // MENOR_EDAD no existe

    const command = new ImportTemplateCommand('tenant-1', 'COFRADIA');
    const result = await handler.execute(command);

    expect(result.length).toBe(3); // Solo 3 creados (NUMERARIO fue saltado)
    expect(repository.save).toHaveBeenCalledTimes(3);
  });
});
