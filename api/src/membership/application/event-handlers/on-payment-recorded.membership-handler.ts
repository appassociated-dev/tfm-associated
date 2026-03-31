import { Inject, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentRecordedEvent } from '../../../treasury/domain/events/payment-recorded.event';
import { ChangeStatusCommand } from '../commands/change-status.command';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import { MemberId } from '../../domain/value-objects/member-id';

/**
 * Handler de integración: escucha PaymentRecordedEvent de BC-Treasury
 * y activa el socio si estaba en estado PENDING_PAYMENT (ADR-008, REQ-IEC-008).
 * Solo reacciona cuando chargeNewStatus === 'PAID'.
 */
@EventsHandler(PaymentRecordedEvent)
export class OnPaymentRecordedMembershipHandler implements IEventHandler<PaymentRecordedEvent> {
  private readonly logger = new Logger(OnPaymentRecordedMembershipHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MEMBER_REPOSITORY) private readonly memberRepo: MemberRepository,
  ) {}

  async handle(event: PaymentRecordedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId (solo integration events lo tienen)
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    // Solo reaccionar cuando el cargo queda en estado PAID
    if (event.payload.chargeNewStatus !== 'PAID') {
      return;
    }

    try {
      // Configurar tenant en el repositorio (ADR-002)
      this.memberRepo.setTenantId(event.tenantId);

      // Consultar estado actual del socio
      const memberId = MemberId.fromString(event.payload.memberId);
      const member = await this.memberRepo.findById(memberId);

      if (!member) {
        this.logger.warn(
          `[${event.eventType}] socio ${event.payload.memberId} no encontrado para el tenant ${event.tenantId} — ignorado.`,
        );
        return;
      }

      // Solo activar si el socio está en PENDING_PAYMENT
      if (member.getCurrentStatus().value !== 'PENDING_PAYMENT') {
        return;
      }

      // Despachar el comando de cambio de estado a ACTIVE
      await this.commandBus.execute(
        new ChangeStatusCommand(
          event.tenantId,
          event.payload.memberId,
          'ACTIVE',
          'Pago registrado — activación automática por BC-Treasury',
          'SYSTEM',
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
