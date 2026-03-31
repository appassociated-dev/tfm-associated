import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListFeePlansQuery } from './list-fee-plans.query';
import { FeePlanResponseDto } from '../dtos/fee-plan-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';
import { MemberTypeFeePlan } from '../../domain/entities/member-type-fee-plan';

/**
 * Handler de la query para listar planes de cuota.
 * Soporta filtrado por estado activo y por tipo de socio (AD-2, REQ-SPU-005).
 * Cuando se filtra por memberTypeId, enriquece el DTO con isDefault y displayOrder
 * de la tabla junction MemberTypeFeePlan (AD-3, REQ-SPU-006).
 */
@QueryHandler(ListFeePlansQuery)
export class ListFeePlansHandler implements IQueryHandler<ListFeePlansQuery> {
  constructor(
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
  ) {}

  async execute(query: ListFeePlansQuery): Promise<FeePlanResponseDto[]> {
    // Establecer tenantId en ambos repositorios (ADR-002)
    this.feePlanRepository.setTenantId(query.tenantId);
    this.memberTypeFeePlanRepository.setTenantId(query.tenantId);

    // Obtener planes con conteo de suscripciones activas (AD-1, REQ-SPU-008)
    const plansWithCount = await this.feePlanRepository.findAllWithCount();

    // Filtrar por estado activo si se especifica
    let filtered =
      query.active !== undefined
        ? plansWithCount.filter(({ feePlan }) => feePlan.active === query.active)
        : plansWithCount;

    // Filtrar por tipo de socio si se especifica (AD-2, REQ-SPU-005)
    // El dataset es pequeño (< 20 planes por tenant, AD-5): composición en memoria
    let junctionMap: Map<string, MemberTypeFeePlan> | null = null;
    if (query.memberTypeId) {
      const junctionEntries = await this.memberTypeFeePlanRepository.findByMemberTypeId(
        query.memberTypeId,
      );

      // Construir mapa feePlanId → junction para enriquecimiento O(1)
      junctionMap = new Map(junctionEntries.map((j) => [j.feePlanId, j]));

      // Solo conservar planes que tengan vinculación con el tipo de socio
      filtered = filtered.filter(({ feePlan }) => junctionMap!.has(feePlan.id.toValue()));

      // Ordenar por displayOrder ASC (AD-3)
      filtered.sort((a, b) => {
        const orderA = junctionMap!.get(a.feePlan.id.toValue())?.order ?? 0;
        const orderB = junctionMap!.get(b.feePlan.id.toValue())?.order ?? 0;
        return orderA - orderB;
      });
    }

    return filtered.map(({ feePlan, activeSubscriptionsCount }) => {
      const dto = FeePlanResponseDto.fromDomain(feePlan);
      dto.activeSubscriptionsCount = activeSubscriptionsCount;

      // Enriquecer con datos de junction solo cuando se filtra por memberTypeId (REQ-SPU-006)
      if (junctionMap) {
        const junction = junctionMap.get(feePlan.id.toValue());
        if (junction) {
          dto.isDefault = junction.isDefault;
          dto.displayOrder = junction.order;
        }
      }

      return dto;
    });
  }
}
