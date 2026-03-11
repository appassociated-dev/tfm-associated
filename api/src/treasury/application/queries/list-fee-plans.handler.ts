import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListFeePlansQuery } from './list-fee-plans.query';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';

/**
 * Handler de la query para listar planes de cuota.
 * Soporta filtrado por estado activo.
 */
@QueryHandler(ListFeePlansQuery)
export class ListFeePlansHandler implements IQueryHandler<ListFeePlansQuery> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(query: ListFeePlansQuery): Promise<FeePlanResponseDto[]> {
    // Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.feePlanRepository.setTenantId(query.tenantId);

    const feePlans = await this.feePlanRepository.findAll();

    // Filtrar por estado activo si se especifica
    const filtered =
      query.active !== undefined ? feePlans.filter((fp) => fp.active === query.active) : feePlans;

    return filtered.map((fp) => FeePlanResponseDto.fromDomain(fp));
  }
}
