import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetReinstatementSummaryQuery } from './reinstatement-summary.query';
import { ReinstatementSummaryResponseDto } from '../dtos/reinstatement-summary-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  SUBSCRIPTION_QUERY_PORT,
  SubscriptionQueryPort,
} from '../../domain/ports/subscription-query.port';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberNotFoundError, MemberCannotReinstateError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el resumen previo a la rehabilitación de un socio (UC-013).
 * Calcula deuda pendiente, penalización y cuota de reinscripción.
 * El socio debe estar en estado de baja rehabilitable.
 */
@QueryHandler(GetReinstatementSummaryQuery)
export class GetReinstatementSummaryHandler implements IQueryHandler<GetReinstatementSummaryQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(SUBSCRIPTION_QUERY_PORT)
    private readonly subscriptionQueryPort: SubscriptionQueryPort,
  ) {}

  async execute(query: GetReinstatementSummaryQuery): Promise<ReinstatementSummaryResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);
    this.subscriptionQueryPort.setTenantId(query.tenantId);

    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(query.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(query.memberId);
    }

    // 2. Verificar que el socio está en estado de baja rehabilitable
    if (!member.canReinstate()) {
      throw new MemberCannotReinstateError(member.getCurrentStatus().value);
    }

    // 3. Obtener deuda pendiente
    const pendingDebt = await this.subscriptionQueryPort.getTotalPendingDebt(query.memberId);

    // 4. Calcular penalización y cuota de reinscripción
    // Nota: En esta versión MVP, penalización y nueva cuota de inscripción son 0.
    // Se podrán configurar por tenant en futuras versiones.
    const penalty = 0;
    const newRegistrationFee = 0;
    const keepSeniority = true;

    // 5. Calcular total a pagar
    const totalToPay = pendingDebt + penalty + newRegistrationFee;

    // 6. Construir nombre completo del socio
    const memberName = member.personalData
      ? `${member.personalData.name} ${member.personalData.surnames}`
      : '';

    // 7. Construir respuesta
    return ReinstatementSummaryResponseDto.fromResult({
      memberId: query.memberId,
      memberName,
      leaveDate: member.leaveDate ?? new Date(),
      leaveType: member.getCurrentStatus().value,
      pendingDebt,
      penalty,
      newRegistrationFee,
      totalToPay,
      keepSeniority,
    });
  }
}
