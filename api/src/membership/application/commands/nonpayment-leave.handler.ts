import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessNonpaymentLeaveCommand } from './nonpayment-leave.command';
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
import { MEMBER_OUTBOX_PUBLISHER, MemberOutboxPublisher } from '../ports/member-outbox.publisher';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import {
  MemberNotFoundError,
  MemberCannotLeaveError,
  NoPendingDebtError,
} from '../../domain/exceptions';

/**
 * Handler del comando de baja por impago de socio (UC-013).
 * Verifica que el socio tiene deuda pendiente antes de procesar la baja.
 * La fecha efectiva es siempre inmediata y el motivo es fijo.
 */
@CommandHandler(ProcessNonpaymentLeaveCommand)
export class ProcessNonpaymentLeaveHandler implements ICommandHandler<ProcessNonpaymentLeaveCommand> {
  private readonly transitionValidator = new StatusTransitionValidator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: StatusHistoryRepository,
    @Inject(SUBSCRIPTION_QUERY_PORT)
    private readonly subscriptionQueryPort: SubscriptionQueryPort,
    @Inject(MEMBER_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: MemberOutboxPublisher,
    private readonly prismaTenantService: PrismaTenantService,
  ) {}

  async execute(command: ProcessNonpaymentLeaveCommand): Promise<LeaveResponseDto> {
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

    // 3. Verificar que tiene deuda pendiente (requisito para baja por impago)
    const pendingDebt = await this.subscriptionQueryPort.getTotalPendingDebt(command.memberId);
    if (pendingDebt <= 0) {
      throw new NoPendingDebtError(command.memberId);
    }

    // 4. Crear motivo de baja (fijo para impago)
    const reasonResult = StatusChangeReason.create('Baja por impago');
    if (!reasonResult.ok) {
      throw reasonResult.error;
    }

    // 5. Ejecutar transacción: processLeave → save → closeSubscriptions → outbox
    const previousStatus = member.getCurrentStatus().value;
    const historyCountBefore = member.getStatusHistory().length;
    const effectiveDate = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = this.prismaTenantService.getClient(command.tenantId) as any;

    const result = await prisma.$transaction(async (tx: unknown) => {
      // 5a. Ejecutar baja en el aggregate
      const leaveResult = member.processLeave(
        MemberStatus.NONPAYMENT_LEAVE,
        effectiveDate,
        reasonResult.value,
        this.transitionValidator,
        pendingDebt,
      );

      if (!leaveResult.ok) {
        throw leaveResult.error;
      }

      // 5b. Persistir el aggregate
      await this.memberRepository.save(member);

      // 5c. Guardar nuevas entradas de historial
      const allEntries = member.getStatusHistory();
      const newEntries = allEntries.slice(historyCountBefore);
      for (const entry of newEntries) {
        await this.statusHistoryRepository.save(entry);
      }

      // 5d. Cancelar suscripciones activas
      const subscriptionsClosed = await this.subscriptionQueryPort.closeSubscriptions(
        command.memberId,
        'NONPAYMENT_LEAVE',
        tx,
      );

      // 5e. Publicar eventos de dominio en outbox
      await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());

      return { subscriptionsClosed };
    });

    // 6. Construir respuesta
    return LeaveResponseDto.fromResult({
      memberId: command.memberId,
      previousStatus,
      newStatus: MemberStatus.NONPAYMENT_LEAVE.value,
      effectiveDate,
      subscriptionsClosed: result.subscriptionsClosed,
      pendingChargesAmount: pendingDebt,
    });
  }
}
