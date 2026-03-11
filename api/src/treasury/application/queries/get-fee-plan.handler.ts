import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFeePlanQuery } from './get-fee-plan.query';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener un plan de cuota por ID.
 */
@QueryHandler(GetFeePlanQuery)
export class GetFeePlanHandler implements IQueryHandler<GetFeePlanQuery> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(query: GetFeePlanQuery): Promise<FeePlanResponseDto> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(query.tenantId);

    const feePlanId = FeePlanId.fromString(query.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);

    if (!feePlan) {
      throw new FeePlanNotFoundError(query.feePlanId);
    }

    return FeePlanResponseDto.fromDomain(feePlan);
  }
}
