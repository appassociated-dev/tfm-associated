import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListMemberTypesQuery } from './list-member-types.query';
import { MemberTypeResponseDto } from '../dtos/member-type-response.dto';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';

/**
 * Handler de la query para listar tipos de socio.
 * Soporta filtrado por estado activo.
 */
@QueryHandler(ListMemberTypesQuery)
export class ListMemberTypesHandler implements IQueryHandler<ListMemberTypesQuery> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(query: ListMemberTypesQuery): Promise<MemberTypeResponseDto[]> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(query.tenantId);

    const memberTypes = await this.memberTypeRepository.findAll();

    // Filtrar por estado activo si se especifica
    const filtered =
      query.active !== undefined
        ? memberTypes.filter((mt) => mt.active === query.active)
        : memberTypes;

    return filtered.map((mt) => MemberTypeResponseDto.fromDomain(mt));
  }
}
