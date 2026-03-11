import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetChargesByAccountQuery } from './get-charges-by-account.query';
import { ChargeResponseDto } from '../dtos/charge-response.dto';
import { CHARGE_REPOSITORY, ChargeRepository } from '../../domain/repositories/charge.repository';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { ChargeStatus } from '../../domain/value-objects/charge-status';
import { MemberAccountNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener cargos de una cuenta de socio.
 * Opcionalmente filtra por estado del cargo.
 */
@QueryHandler(GetChargesByAccountQuery)
export class GetChargesByAccountHandler implements IQueryHandler<GetChargesByAccountQuery> {
  constructor(
    @Inject(CHARGE_REPOSITORY)
    private readonly chargeRepository: ChargeRepository,
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(query: GetChargesByAccountQuery): Promise<ChargeResponseDto[]> {
    // 1. Establecer tenantId en los repositorios (ADR-002)
    this.chargeRepository.setTenantId(query.tenantId);
    this.memberAccountRepository.setTenantId(query.tenantId);
    this.feePlanRepository.setTenantId(query.tenantId);

    // 2. Verificar que la cuenta existe
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);
    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // 3. Obtener cargos: filtrar por estado si se indica
    let charges;
    if (query.status === 'PENDING') {
      charges = await this.chargeRepository.findPendingByMemberAccountId(accountId);
    } else {
      charges = await this.chargeRepository.findByMemberAccountId(accountId);

      // Filtrar por estado si se proporcionó uno distinto de PENDING
      if (query.status) {
        const statusFilter = ChargeStatus.fromString(query.status);
        charges = charges.filter((c) => c.status.equals(statusFilter));
      }
    }

    // 4. Enriquecer con nombre del plan si la suscripción tiene plan asociado
    const feePlans = await this.feePlanRepository.findAll();
    const planMap = new Map(feePlans.map((p) => [p.id.toValue(), p.name]));

    // Obtener nombres de planes via las suscripciones de la cuenta
    const subscriptionPlanMap = new Map<string, string>();
    for (const subscription of account.subscriptions) {
      const planName = planMap.get(subscription.feePlanId.toValue());
      if (planName) {
        subscriptionPlanMap.set(subscription.id.toValue(), planName);
      }
    }

    // 5. Mapear a DTOs
    return charges.map((charge) => {
      const feePlanName = charge.subscriptionId
        ? subscriptionPlanMap.get(charge.subscriptionId.toValue())
        : undefined;
      return ChargeResponseDto.fromDomain(charge, feePlanName);
    });
  }
}
