import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MembersController } from '../members.controller';
import { CreateMemberCommand } from '../../../application/commands/create-member.command';
import { UpdateMemberCommand } from '../../../application/commands/update-member.command';
import { GetMemberQuery } from '../../../application/queries/get-member.query';
import { ListMembersQuery } from '../../../application/queries/list-members.query';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import type { CreateMemberDto } from '../../../application/dtos/create-member.dto';
import type { UpdateMemberDto } from '../../../application/dtos/update-member.dto';

describe('MembersController', () => {
  let controller: MembersController;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let queryBus: { execute: ReturnType<typeof vi.fn> };

  const mockReq = {
    tenantId: 'tenant-uuid-1234',
    user: { userId: 'user-uuid-1234' },
  } as unknown as Request & { tenantId: string; user: { userId: string } };

  const mockMemberResponse = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    memberNumber: '00001',
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-05-15'),
    age: 35,
    documentType: 'DNI',
    documentNumber: '12345678Z',
    email: 'juan.garcia@ejemplo.com',
    phone: '+34666123456',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
    ibanMasked: 'ES91****************1332',
    memberTypeId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    memberTypeName: 'Hermano Numerario',
    currentStatus: 'ACTIVE',
    customFields: {},
    registrationDate: new Date(),
    leaveDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMemberListResponse = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    memberNumber: '00001',
    name: 'Juan',
    surnames: 'García López',
    email: 'juan.garcia@ejemplo.com',
    currentStatus: 'ACTIVE',
    memberTypeName: 'Hermano Numerario',
    registrationDate: new Date(),
  };

  beforeEach(() => {
    commandBus = { execute: vi.fn() };
    queryBus = { execute: vi.fn() };
    controller = new MembersController(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  describe('POST /members (create)', () => {
    it('debería crear un socio con ficha completa', async () => {
      commandBus.execute.mockResolvedValue(mockMemberResponse);

      const dto = {
        name: 'Juan',
        surnames: 'García López',
        birthDate: '1990-05-15',
        documentType: 'DNI',
        documentNumber: '12345678Z',
        email: 'juan.garcia@ejemplo.com',
        phone: '+34666123456',
        address: 'Calle Mayor 1',
        postalCode: '28001',
        city: 'Madrid',
        iban: 'ES9121000418450200051332',
        memberTypeId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        customFields: {},
        initialStatus: 'ACTIVE',
      };

      const result = await controller.create(dto as unknown as CreateMemberDto, mockReq);

      expect(result).toBe(mockMemberResponse);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(CreateMemberCommand));
    });

    it('debería pasar valores por defecto cuando hay campos opcionales', async () => {
      commandBus.execute.mockResolvedValue(mockMemberResponse);

      const dto = {
        name: 'Juan',
        surnames: 'García López',
        birthDate: '1990-05-15',
        documentType: 'DNI',
        documentNumber: '12345678Z',
        email: 'juan.garcia@ejemplo.com',
        memberTypeId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      await controller.create(dto as unknown as CreateMemberDto, mockReq);

      const command = commandBus.execute.mock.calls[0][0] as CreateMemberCommand;
      expect(command.phone).toBeNull();
      expect(command.address).toBeNull();
      expect(command.postalCode).toBeNull();
      expect(command.city).toBeNull();
      expect(command.iban).toBeNull();
      expect(command.initialStatus).toBe('ACTIVE');
    });
  });

  describe('GET /members (list)', () => {
    it('debería listar socios sin filtro', async () => {
      queryBus.execute.mockResolvedValue([mockMemberListResponse]);

      const result = await controller.list(mockReq);

      expect(result).toEqual([mockMemberListResponse]);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListMembersQuery));
    });

    it('debería pasar filtros de status y memberTypeId', async () => {
      queryBus.execute.mockResolvedValue([mockMemberListResponse]);

      await controller.list(mockReq, 'ACTIVE', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'juan');

      const query = queryBus.execute.mock.calls[0][0] as ListMembersQuery;
      expect(query.status).toBe('ACTIVE');
      expect(query.memberTypeId).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(query.search).toBe('juan');
    });

    it('debería funcionar sin filtros opcionales', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.list(mockReq);

      const query = queryBus.execute.mock.calls[0][0] as ListMembersQuery;
      expect(query.status).toBeUndefined();
      expect(query.memberTypeId).toBeUndefined();
      expect(query.search).toBeUndefined();
    });
  });

  describe('GET /members/:id (getOne)', () => {
    it('debería devolver un socio por ID', async () => {
      queryBus.execute.mockResolvedValue(mockMemberResponse);

      const result = await controller.getOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', mockReq);

      expect(result).toBe(mockMemberResponse);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetMemberQuery));
    });

    it('debería pasar tenantId y memberId correctos', async () => {
      queryBus.execute.mockResolvedValue(mockMemberResponse);

      await controller.getOne('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', mockReq);

      const query = queryBus.execute.mock.calls[0][0] as GetMemberQuery;
      expect(query.tenantId).toBe('tenant-uuid-1234');
      expect(query.memberId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });
  });

  describe('PUT /members/:id (update)', () => {
    it('debería actualizar un socio', async () => {
      commandBus.execute.mockResolvedValue(mockMemberResponse);

      const dto = {
        name: 'Juan Carlos',
        email: 'juancarlos@ejemplo.com',
      };

      const result = await controller.update(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dto as unknown as UpdateMemberDto,
        mockReq,
      );

      expect(result).toBe(mockMemberResponse);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdateMemberCommand));
    });

    it('debería pasar memberId y tenantId correctos', async () => {
      commandBus.execute.mockResolvedValue(mockMemberResponse);

      const dto = { name: 'Nuevo nombre' };
      await controller.update(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dto as unknown as UpdateMemberDto,
        mockReq,
      );

      const command = commandBus.execute.mock.calls[0][0] as UpdateMemberCommand;
      expect(command.tenantId).toBe('tenant-uuid-1234');
      expect(command.memberId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(command.name).toBe('Nuevo nombre');
    });
  });
});
