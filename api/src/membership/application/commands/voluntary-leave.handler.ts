import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessVoluntaryLeaveCommand } from './voluntary-leave.command';
import { LeaveResponseDto } from '../dtos/leave-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  STATUS_HISTORY_REPOSITORY,
  StatusHistoryRepository,
} from '../../domain/repositories/status-history.repository';
import {
  SUBSCRIPTION_QUERY_PORT,
  SubscriptionQueryPort,
} from '../../domain/ports/subscription-query.port';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import { EffectiveDateCalculator } from '../../domain/services/effective-date-calculator';
import { EffectiveDateType } from '../../domain/value-objects/effective-date-type';
import { MemberNotFoundError, MemberCannotLeaveError } from '../../domain/exceptions';

/**
 * Handler del comando de baja voluntaria de socio (UC-013).
 * Orquesta la baja voluntaria: validación, cálculo de fecha efectiva,
 * transición de estado, cancelación de suscripciones y publicación de eventos.
 */
@CommandHandler(ProcessVoluntaryLeaveCommand)
export class ProcessVoluntaryLeaveHandler implements ICommandHandler<ProcessVoluntaryLeaveCommand> {
  private readonly transitionValidator = new StatusTransitionValidator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: StatusHistoryRepository,
    @Inject(SUBSCRIPTION_QUERY_PORT)
    private readonly subscriptionQueryPort: SubscriptionQueryPort,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
    private readonly prismaTenantService: PrismaTenantService,
  ) {}

  async execute(command: ProcessVoluntaryLeaveCommand): Promise<LeaveResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.statusHistoryRepository.setTenantId(command.tenantId);
    this.subscriptionQueryPort.setTenantId(command.tenantId);

    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(command.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    // 2. Verificar que puede causar baja
    if (!member.canLeave()) {
      throw new MemberCannotLeaveError(member.getCurrentStatus().value);
    }

    // 3. Calcular fecha efectiva de baja
    const effectiveDateType = command.effectiveDateType as EffectiveDateType;
    const effectiveDate = EffectiveDateCalculator.calculateEffectiveDate(new Date(), {
      type: effectiveDateType,
    });

    // 4. Crear motivo de baja
    const reasonResult = StatusChangeReason.create(command.reason);
    if (!reasonResult.ok) {
      throw reasonResult.error;
    }

    // 5. Obtener deuda pendiente
    const pendingDebt = await this.subscriptionQueryPort.getTotalPendingDebt(command.memberId);

    // 6. Ejecutar transacción: processLeave → save → closeSubscriptions → outbox
    const previousStatus = member.getCurrentStatus().value;
    const historyCountBefore = member.getStatusHistory().length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await this.prismaTenantService.getClient(command.tenantId)) as any;

    const result = await prisma.$transaction(async (tx: unknown) => {
      // 6a. Ejecutar baja en el aggregate
      const leaveResult = member.processLeave(
        MemberStatus.VOLUNTARY_LEAVE,
        effectiveDate,
        reasonResult.value,
        this.transitionValidator,
        pendingDebt,
      );

      if (!leaveResult.ok) {
        throw leaveResult.error;
      }

      // 6b. Persistir el aggregate
      await this.memberRepository.save(member);

      // 6c. Guardar nuevas entradas de historial
      const allEntries = member.getStatusHistory();
      const newEntries = allEntries.slice(historyCountBefore);
      for (const entry of newEntries) {
        await this.statusHistoryRepository.save(entry);
      }

      // 6d. Cancelar suscripciones activas
      const subscriptionsClosed = await this.subscriptionQueryPort.closeSubscriptions(
        command.memberId,
        'MEMBER_LEAVE',
        tx,
      );

      // 6e. Publicar eventos de dominio en outbox
      await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());

      return { subscriptionsClosed };
    });

    // 7. Construir respuesta
    return LeaveResponseDto.fromResult({
      memberId: command.memberId,
      previousStatus,
      newStatus: MemberStatus.VOLUNTARY_LEAVE.value,
      effectiveDate,
      subscriptionsClosed: result.subscriptionsClosed,
      pendingChargesAmount: pendingDebt,
    });
  }
}
