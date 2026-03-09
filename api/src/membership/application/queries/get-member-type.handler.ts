import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetMemberTypeQuery } from './get-member-type.query';
import { MemberTypeResponseDto } from '../dtos/member-type-response.dto';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberTypeNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener un tipo de socio por ID.
 */
@QueryHandler(GetMemberTypeQuery)
export class GetMemberTypeHandler implements IQueryHandler<GetMemberTypeQuery> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(query: GetMemberTypeQuery): Promise<MemberTypeResponseDto> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(query.tenantId);

    const memberTypeId = MemberTypeId.fromString(query.memberTypeId);
    const memberType = await this.memberTypeRepository.findById(memberTypeId);

    if (!memberType) {
      throw new MemberTypeNotFoundError(query.memberTypeId);
    }

    return MemberTypeResponseDto.fromDomain(memberType);
  }
}
