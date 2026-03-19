import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFeePlanQuery } from './get-fee-plan.query';
import { FeePlanResponseDto, LinkedMemberTypeDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';
import {
  MEMBER_TYPE_QUERY_PORT,
  MemberTypeQueryPort,
} from '../../domain/ports/member-type-query.port';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener un plan de cuota por ID.
 * Incluye las vinculaciones a tipos de socio (linkedMemberTypes).
 */
@QueryHandler(GetFeePlanQuery)
export class GetFeePlanHandler implements IQueryHandler<GetFeePlanQuery> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
    @Inject(MEMBER_TYPE_QUERY_PORT)
    private readonly memberTypeQueryPort: MemberTypeQueryPort,
  ) {}

  async execute(query: GetFeePlanQuery): Promise<FeePlanResponseDto> {
    // Establecer tenantId en los repositorios para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(query.tenantId);
    this.memberTypeFeePlanRepository.setTenantId(query.tenantId);
    this.memberTypeQueryPort.setTenantId(query.tenantId);

    const feePlanId = FeePlanId.fromString(query.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);

    if (!feePlan) {
      throw new FeePlanNotFoundError(query.feePlanId);
    }

    const dto = FeePlanResponseDto.fromDomain(feePlan);

    // Obtener vinculaciones a tipos de socio
    const assignments = await this.memberTypeFeePlanRepository.findByFeePlanId(feePlanId);

    // Resolver nombres de tipos de socio desde BC-Membership vía puerto anti-corrupción
    const linkedMemberTypes: LinkedMemberTypeDto[] = [];

    for (const assignment of assignments) {
      const memberType = await this.memberTypeQueryPort.findById(assignment.memberTypeId);

      const linked = new LinkedMemberTypeDto();
      linked.memberTypeId = assignment.memberTypeId;
      linked.memberTypeName = memberType?.name ?? 'Desconocido';
      linked.feePlanId = assignment.feePlanId;
      linked.isDefault = assignment.isDefault;
      linked.order = assignment.order;
      linked.active = assignment.active;

      linkedMemberTypes.push(linked);
    }

    dto.linkedMemberTypes = linkedMemberTypes;

    return dto;
  }
}
