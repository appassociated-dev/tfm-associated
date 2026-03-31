import { Inject, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberDeactivatedEvent } from '../../../membership/domain/events/member-deactivated.event';
import { CloseSubscriptionCommand } from '../commands/close-subscription.command';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';

/**
 * Handler de integración: escucha MemberDeactivatedEvent de BC-Membership
 * y cierra todas las suscripciones activas del socio en BC-Treasury (ADR-008, REQ-IEC-008).
 *
 * Necesita acceder al repositorio para resolver el memberAccountId a partir del memberId,
 * ya que MemberDeactivatedEvent no incluye el ID de cuenta de tesorería.
 */
@EventsHandler(MemberDeactivatedEvent)
export class OnMemberDeactivatedTreasuryHandler implements IEventHandler<MemberDeactivatedEvent> {
  private readonly logger = new Logger(OnMemberDeactivatedTreasuryHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
  ) {}

  async handle(event: MemberDeactivatedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // Establecer tenant para acceder a la BD correcta (ADR-002)
      this.memberAccountRepository.setTenantId(event.tenantId);

      // Buscar la cuenta del socio para obtener las suscripciones activas
      const account = await this.memberAccountRepository.findByMemberId(event.payload.memberId);
      if (!account) {
        this.logger.warn(
          `[${event.eventType}] cuenta no encontrada para memberId=${event.payload.memberId} — ignorado.`,
        );
        return;
      }

      // Obtener suscripciones activas y cerrarlas
      const activeSubscriptions = account.subscriptions.filter((sub) => sub.isActive());

      // try/catch dentro del loop: cada cierre es independiente — un fallo no bloquea las demás (RNF-067)
      for (const subscription of activeSubscriptions) {
        try {
          await this.commandBus.execute(
            new CloseSubscriptionCommand(
              event.tenantId,
              account.id.toValue(),
              subscription.id.toValue(),
              'MEMBER_LEAVE',
            ),
          );
        } catch (error) {
          // Aislamiento por suscripción: registrar el fallo y continuar con las siguientes
          this.logger.error(
            `[${event.eventType}] error cerrando suscripción ${subscription.id.toValue()} del evento ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    } catch (error) {
      // Aislamiento de errores: nunca propagar al OutboxProcessor (RNF-067)
      this.logger.error(
        `[${event.eventType}] error procesando evento ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
