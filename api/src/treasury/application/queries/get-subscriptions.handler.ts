import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetSubscriptionsQuery } from './get-subscriptions.query';
import { SubscriptionHistoryResponseDto } from '../dtos/subscription-history-response.dto';
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
import { MemberAccountNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el historial de suscripciones de una cuenta de socio.
 * Enriquece cada suscripción con el nombre y código del plan asociado.
 */
@QueryHandler(GetSubscriptionsQuery)
export class GetSubscriptionsHandler implements IQueryHandler<GetSubscriptionsQuery> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
  ) {}

  async execute(query: GetSubscriptionsQuery): Promise<SubscriptionHistoryResponseDto> {
    // Establecer tenantId en los repositorios para usar la BD correcta (ADR-002)
    this.memberAccountRepository.setTenantId(query.tenantId);
    this.feePlanRepository.setTenantId(query.tenantId);

    // Buscar la cuenta de socio
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);

    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // Obtener historial de suscripciones ordenado por fecha de alta descendente
    const subscriptionHistory = account.getSubscriptionHistory();

    // Obtener la suscripción periódica activa
    const activeSubscription = account.getActivePeriodicSubscription();

    // Enriquecer cada suscripción con info del plan
    const subscriptionDtos: SubscriptionResponseDto[] = [];
    for (const subscription of subscriptionHistory) {
      const feePlan = await this.feePlanRepository.findById(subscription.feePlanId);
      const planInfo = feePlan ? { name: feePlan.name, code: feePlan.code.value } : undefined;
      subscriptionDtos.push(SubscriptionResponseDto.fromDomain(subscription, planInfo));
    }

    // Construir DTO de la suscripción activa enriquecida
    let activeSubscriptionDto: SubscriptionResponseDto | null = null;
    if (activeSubscription) {
      const activePlan = await this.feePlanRepository.findById(activeSubscription.feePlanId);
      const activePlanInfo = activePlan
        ? { name: activePlan.name, code: activePlan.code.value }
        : undefined;
      activeSubscriptionDto = SubscriptionResponseDto.fromDomain(
        activeSubscription,
        activePlanInfo,
      );
    }

    return SubscriptionHistoryResponseDto.fromDomain(
      account,
      subscriptionDtos,
      activeSubscriptionDto,
    );
  }
}
