import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListMembersQuery } from './list-members.query';
import { MemberListResponseDto } from '../dtos/member-list-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';

/**
 * Handler de la query para listar socios con filtros opcionales (UC-006).
 * Soporta filtrado por status, memberTypeId y búsqueda textual.
 */
@QueryHandler(ListMembersQuery)
export class ListMembersHandler implements IQueryHandler<ListMembersQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(query: ListMembersQuery): Promise<MemberListResponseDto[]> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);
    this.memberTypeRepository.setTenantId(query.tenantId);

    // 1. Consultar socios con filtros
    const members = await this.memberRepository.findAll({
      status: query.status,
      memberTypeId: query.memberTypeId,
      search: query.search,
    });

    // 2. Resolver nombres de tipos de socio (obtener todos para mapear)
    const memberTypes = await this.memberTypeRepository.findAll();
    const typeNameMap = new Map<string, string>();
    for (const mt of memberTypes) {
      typeNameMap.set(mt.id.toValue(), mt.name);
    }

    // 3. Mapear a DTOs
    return members.map((member) => {
      const typeName = typeNameMap.get(member.memberTypeId.toValue());
      return MemberListResponseDto.fromDomain(member, typeName);
    });
  }
}
