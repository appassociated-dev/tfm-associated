import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemberTypesController } from '../member-types.controller';
import { CreateMemberTypeCommand } from '../../../application/commands/create-member-type.command';
import { UpdateMemberTypeCommand } from '../../../application/commands/update-member-type.command';
import { DeactivateMemberTypeCommand } from '../../../application/commands/deactivate-member-type.command';
import { ImportTemplateCommand } from '../../../application/commands/import-template.command';
import { GetMemberTypeQuery } from '../../../application/queries/get-member-type.query';
import { ListMemberTypesQuery } from '../../../application/queries/list-member-types.query';
import { GetTemplatesQuery } from '../../../application/queries/get-templates.query';

describe('MemberTypesController', () => {
  let controller: MemberTypesController;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let queryBus: { execute: ReturnType<typeof vi.fn> };

  const mockReq = {
    tenantId: 'tenant-uuid-1234',
    user: { tenantType: 'COFRADIA' },
  } as any;

  const mockResponseDto = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    commandBus = { execute: vi.fn() };
    queryBus = { execute: vi.fn() };
    controller = new MemberTypesController(commandBus as any, queryBus as any);
  });

  describe('POST /member-types (create)', () => {
    it('debería crear un tipo de socio', async () => {
      commandBus.execute.mockResolvedValue(mockResponseDto);

      const dto = {
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
      };

      const result = await controller.create(dto as any, mockReq);

      expect(result).toBe(mockResponseDto);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(CreateMemberTypeCommand));
    });
  });

  describe('GET /member-types (list)', () => {
    it('debería listar tipos de socio sin filtro', async () => {
      queryBus.execute.mockResolvedValue([mockResponseDto]);

      const result = await controller.list(mockReq);

      expect(result).toEqual([mockResponseDto]);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListMemberTypesQuery));
    });

    it('debería pasar filtro active=true', async () => {
      queryBus.execute.mockResolvedValue([mockResponseDto]);

      await controller.list(mockReq, 'true');

      expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
    });

    it('debería pasar filtro active=false', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.list(mockReq, 'false');

      expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });
  });

  describe('GET /member-types/templates', () => {
    it('debería devolver plantillas', async () => {
      const templates = [{ code: 'NUMERARIO', name: 'Hermano Numerario' }];
      queryBus.execute.mockResolvedValue(templates);

      const result = await controller.getTemplates('COFRADIA');

      expect(result).toEqual(templates);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetTemplatesQuery));
    });
  });

  describe('POST /member-types/import-template', () => {
    it('debería importar plantillas', async () => {
      commandBus.execute.mockResolvedValue([mockResponseDto]);

      const dto = { collectivityType: 'COFRADIA' };
      const result = await controller.importTemplate(dto as any, mockReq);

      expect(result).toEqual([mockResponseDto]);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(ImportTemplateCommand));
    });
  });

  describe('GET /member-types/:id', () => {
    it('debería devolver un tipo de socio por ID', async () => {
      queryBus.execute.mockResolvedValue(mockResponseDto);

      const result = await controller.getOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', mockReq);

      expect(result).toBe(mockResponseDto);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetMemberTypeQuery));
    });
  });

  describe('PUT /member-types/:id', () => {
    it('debería actualizar un tipo de socio', async () => {
      commandBus.execute.mockResolvedValue(mockResponseDto);

      const dto = {
        name: 'Hermano Numerario Actualizado',
        description: 'Desc',
        ageRangeMin: 18,
        ageRangeMax: null,
        votingRight: true,
        eligibleForOffice: false,
        minimumSeniorityForVoting: 6,
        minimumSeniorityForOffice: 24,
        automaticTransitionTargetId: null,
        rulesConfig: {},
      };

      const result = await controller.update(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dto as any,
        mockReq,
      );

      expect(result).toBe(mockResponseDto);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdateMemberTypeCommand));
    });
  });

  describe('PATCH /member-types/:id/deactivate', () => {
    it('debería desactivar un tipo de socio', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.deactivate('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', mockReq);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DeactivateMemberTypeCommand));
    });
  });
});
