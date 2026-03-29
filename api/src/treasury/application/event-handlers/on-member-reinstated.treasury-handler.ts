import { Inject, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberReinstatedEvent } from '../../../membership/domain/events/member-reinstated.event';
import { CreateSubscriptionCommand } from '../commands/create-subscription.command';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';

/**
 * Handler de integración: escucha MemberReinstatedEvent de BC-Membership
 * y crea una nueva suscripción para el socio rehabilitado en BC-Treasury (ADR-008).
 *
 * Verifica idempotencia: si el socio ya tiene suscripción activa, no crea una nueva.
 * Requiere consultar MemberAccount (para accountId) y MemberTypeFeePlan (para feePlanId).
 */
@EventsHandler(MemberReinstatedEvent)
export class OnMemberReinstatedTreasuryHandler implements IEventHandler<MemberReinstatedEvent> {
  private readonly logger = new Logger(OnMemberReinstatedTreasuryHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
  ) {}

  async handle(event: MemberReinstatedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // Establecer tenant en todos los repositorios/puertos (ADR-002)
      this.memberAccountRepository.setTenantId(event.tenantId);
      this.memberTypeFeePlanRepository.setTenantId(event.tenantId);
      this.memberQueryPort.setTenantId(event.tenantId);

      // Buscar la cuenta del socio
      const account = await this.memberAccountRepository.findByMemberId(event.payload.memberId);
      if (!account) {
        this.logger.warn(
          `[${event.eventType}] cuenta no encontrada para memberId=${event.payload.memberId} — ignorado.`,
        );
        return;
      }

      // Verificar idempotencia: si ya hay suscripción activa, no crear otra
      const hasActiveSubscription = account.subscriptions.some((sub) => sub.isActive());
      if (hasActiveSubscription) {
        this.logger.log(
          `[${event.eventType}] memberId=${event.payload.memberId} ya tiene suscripción activa — no-op.`,
        );
        return;
      }

      // Obtener tipo de socio para resolver el plan por defecto
      const member = await this.memberQueryPort.findById(event.payload.memberId);
      if (!member) {
        this.logger.warn(
          `[${event.eventType}] socio no encontrado en BC-Membership para memberId=${event.payload.memberId}.`,
        );
        return;
      }

      // Buscar el plan de cuota por defecto para el tipo de socio
      const defaultPlan = await this.memberTypeFeePlanRepository.findDefault(member.memberTypeId);
      if (!defaultPlan) {
        this.logger.warn(
          `[${event.eventType}] no hay plan por defecto para memberTypeId=${member.memberTypeId}.`,
        );
        return;
      }

      // Despachar el comando de creación de suscripción
      await this.commandBus.execute(
        new CreateSubscriptionCommand(
          event.tenantId,
          account.id.toValue(),
          defaultPlan.feePlanId,
          0, // typeDiscount: se recalculará según el plan
          0, // personalDiscount: sin descuento personal inicial
          null, // personalDiscountReason: no aplica
        ),
      );
    } catch (error) {
      // Aislamiento de errores: nunca propagar al OutboxProcessor (RNF-067)
      this.logger.error(
        `[${event.eventType}] error procesando evento ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
