import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetActiveSubscriptionQuery } from './get-active-subscription.query';
import { SubscriptionResponseDto } from '../dtos/subscription-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { MemberAccountNotFoundError, SubscriptionNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener la suscripción periódica activa de una cuenta de socio.
 * Lanza SubscriptionNotFoundError si no existe suscripción activa.
 */
@QueryHandler(GetActiveSubscriptionQuery)
export class GetActiveSubscriptionHandler implements IQueryHandler<GetActiveSubscriptionQuery> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(query: GetActiveSubscriptionQuery): Promise<SubscriptionResponseDto> {
    // Establecer tenantId en los repositorios para usar la BD correcta (ADR-002)
    this.memberAccountRepository.setTenantId(query.tenantId);
    this.feePlanRepository.setTenantId(query.tenantId);

    // Buscar la cuenta de socio
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);

    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // Obtener la suscripción periódica activa
    const activeSubscription = account.getActivePeriodicSubscription();

    if (!activeSubscription) {
      throw new SubscriptionNotFoundError('active');
    }

    // Enriquecer con info del plan
    const feePlan = await this.feePlanRepository.findById(activeSubscription.feePlanId);
    const planInfo = feePlan ? { name: feePlan.name, code: feePlan.code.value } : undefined;

    // Calcular cargos pendientes de la cuenta (REQ-SPU-001)
    const pendingChargesCount = account.getPendingCharges().length;

    return SubscriptionResponseDto.fromDomain(activeSubscription, planInfo, pendingChargesCount);
  }
}
