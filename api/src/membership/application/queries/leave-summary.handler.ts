import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLeaveSummaryQuery } from './leave-summary.query';
import { LeaveSummaryResponseDto } from '../dtos/leave-summary-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  SUBSCRIPTION_QUERY_PORT,
  SubscriptionQueryPort,
} from '../../domain/ports/subscription-query.port';
import { MemberId } from '../../domain/value-objects/member-id';
import { EffectiveDateCalculator } from '../../domain/services/effective-date-calculator';
import { MemberNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el resumen previo a la baja de un socio (UC-013).
 * Reúne datos del socio, suscripciones activas, cargos pendientes y opciones de fecha efectiva.
 */
@QueryHandler(GetLeaveSummaryQuery)
export class GetLeaveSummaryHandler implements IQueryHandler<GetLeaveSummaryQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(SUBSCRIPTION_QUERY_PORT)
    private readonly subscriptionQueryPort: SubscriptionQueryPort,
  ) {}

  async execute(query: GetLeaveSummaryQuery): Promise<LeaveSummaryResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);
    this.subscriptionQueryPort.setTenantId(query.tenantId);

    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(query.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(query.memberId);
    }

    // 2. Obtener suscripciones activas
    const activeSubscriptions = await this.subscriptionQueryPort.getActiveSubscriptions(
      query.memberId,
    );

    // 3. Obtener cargos pendientes
    const pendingCharges = await this.subscriptionQueryPort.getPendingCharges(query.memberId);

    // 4. Calcular total de deuda pendiente
    const totalPendingDebt = await this.subscriptionQueryPort.getTotalPendingDebt(query.memberId);

    // 5. Calcular opciones de fecha efectiva
    const effectiveDateOptions = EffectiveDateCalculator.getAvailableOptions(new Date());

    // 6. Construir nombre completo del socio
    const memberName = member.personalData
      ? `${member.personalData.name} ${member.personalData.surnames}`
      : '';

    // 7. Obtener documento de identidad del socio
    const memberDni = member.identityDocument?.number;

    // 8. Construir respuesta
    return LeaveSummaryResponseDto.fromResult({
      memberId: query.memberId,
      memberName,
      memberNumber: member.memberNumber?.value ?? '',
      memberDni,
      currentStatus: member.getCurrentStatus().value,
      effectiveDateOptions,
      activeSubscriptions,
      pendingCharges,
      totalPendingDebt,
    });
  }
}
