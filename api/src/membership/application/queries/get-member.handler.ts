import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetMemberQuery } from './get-member.query';
import { MemberResponseDto } from '../dtos/member-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener la ficha completa de un socio (UC-006).
 * Busca por ID, enmascara IBAN y retorna MemberResponseDto.
 */
@QueryHandler(GetMemberQuery)
export class GetMemberHandler implements IQueryHandler<GetMemberQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(query: GetMemberQuery): Promise<MemberResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);
    this.memberTypeRepository.setTenantId(query.tenantId);

    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(query.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(query.memberId);
    }

    // 2. Resolver nombre del tipo de socio
    const memberType = await this.memberTypeRepository.findById(member.memberTypeId);

    // 3. Retornar MemberResponseDto (IBAN ya se enmascara en fromDomain)
    return MemberResponseDto.fromDomain(member, memberType?.name);
  }
}
