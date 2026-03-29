import { Inject, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberTypeChangedEvent } from '../../../membership/domain/events/member-type-changed.event';
import { UpdateSubscriptionDiscountCommand } from '../commands/update-subscription-discount.command';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';

/**
 * Handler de integración: escucha MemberTypeChangedEvent de BC-Membership
 * y recalcula el descuento de la suscripción activa del socio en BC-Treasury (ADR-008).
 *
 * Idempotente: sobrescribir el descuento con el mismo valor produce el mismo resultado.
 */
@EventsHandler(MemberTypeChangedEvent)
export class OnMemberTypeChangedTreasuryHandler implements IEventHandler<MemberTypeChangedEvent> {
  private readonly logger = new Logger(OnMemberTypeChangedTreasuryHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
  ) {}

  async handle(event: MemberTypeChangedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // Establecer tenant en todos los repositorios (ADR-002)
      this.memberAccountRepository.setTenantId(event.tenantId);
      this.memberTypeFeePlanRepository.setTenantId(event.tenantId);

      // Buscar la cuenta del socio
      const account = await this.memberAccountRepository.findByMemberId(event.payload.memberId);
      if (!account) {
        this.logger.warn(
          `[${event.eventType}] cuenta no encontrada para memberId=${event.payload.memberId} — ignorado.`,
        );
        return;
      }

      // Buscar la suscripción activa
      const activeSubscription = account.subscriptions.find((sub) => sub.isActive());
      if (!activeSubscription) {
        this.logger.log(
          `[${event.eventType}] memberId=${event.payload.memberId} no tiene suscripción activa — ignorado.`,
        );
        return;
      }

      // Obtener el descuento por defecto del nuevo tipo de socio (usado en el TODO siguiente)
      const _defaultPlan = await this.memberTypeFeePlanRepository.findDefault(
        event.payload.newTypeId,
      );

      // TODO: calcular descuento real desde _defaultPlan cuando esté disponible (ENT-018 / feePlan discount model)
      const newTypeDiscount = 0;
      const reason = `Cambio de tipo de socio: ${event.payload.previousTypeName} → ${event.payload.newTypeName}`;

      // Despachar actualización de descuento
      await this.commandBus.execute(
        new UpdateSubscriptionDiscountCommand(
          event.tenantId,
          account.id.toValue(),
          activeSubscription.id.toValue(),
          newTypeDiscount,
          reason,
          null,
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
