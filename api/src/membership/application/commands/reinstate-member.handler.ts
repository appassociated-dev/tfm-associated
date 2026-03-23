import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReinstateMemberCommand } from './reinstate-member.command';
import { ReinstatementResponseDto } from '../dtos/reinstatement-response.dto';
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
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import {
  MemberNotFoundError,
  MemberCannotReinstateError,
  PaymentNotConfirmedError,
} from '../../domain/exceptions';

/**
 * Handler del comando de rehabilitación de socio (UC-013).
 * Verifica el pago de deuda, marca cargos como pagados, rehabilita al socio
 * y conserva la antigüedad.
 */
@CommandHandler(ReinstateMemberCommand)
export class ReinstateMemberHandler implements ICommandHandler<ReinstateMemberCommand> {
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

  async execute(command: ReinstateMemberCommand): Promise<ReinstatementResponseDto> {
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

    // 2. Verificar que puede ser rehabilitado
    if (!member.canReinstate()) {
      throw new MemberCannotReinstateError(member.getCurrentStatus().value);
    }

    // 3. Verificar confirmación de pago
    if (!command.paymentConfirmed) {
      throw new PaymentNotConfirmedError(command.memberId);
    }

    // 4. Obtener deuda pendiente y cargos pendientes
    const totalDebt = await this.subscriptionQueryPort.getTotalPendingDebt(command.memberId);
    const pendingCharges = await this.subscriptionQueryPort.getPendingCharges(command.memberId);
    const chargeIds = pendingCharges.map((c) => c.chargeId);

    // 5. Crear motivo de rehabilitación
    const reasonResult = StatusChangeReason.create('Rehabilitación de socio con pago confirmado');
    if (!reasonResult.ok) {
      throw reasonResult.error;
    }

    // 6. Ejecutar transacción: markChargesAsPaid → reinstate → save → outbox
    const historyCountBefore = member.getStatusHistory().length;
    const now = new Date();
    const keepSeniority = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await this.prismaTenantService.getClient(command.tenantId)) as any;

    await prisma.$transaction(async (tx: unknown) => {
      // 6a. Marcar cargos como pagados
      if (chargeIds.length > 0) {
        await this.subscriptionQueryPort.markChargesAsPaid(command.memberId, chargeIds, tx);
      }

      // 6b. Rehabilitar al socio en el aggregate
      const reinstateResult = member.reinstate(
        now,
        keepSeniority,
        reasonResult.value,
        this.transitionValidator,
        true,
      );

      if (!reinstateResult.ok) {
        throw reinstateResult.error;
      }

      // 6c. Persistir el aggregate
      await this.memberRepository.save(member);

      // 6d. Guardar nuevas entradas de historial
      const allEntries = member.getStatusHistory();
      const newEntries = allEntries.slice(historyCountBefore);
      for (const entry of newEntries) {
        await this.statusHistoryRepository.save(entry);
      }

      // 6e. Publicar eventos de dominio en outbox
      await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());
    });

    // 7. Construir respuesta
    return ReinstatementResponseDto.fromResult({
      memberId: command.memberId,
      newStatus: member.getCurrentStatus().value,
      debtPaid: totalDebt,
      seniorityRecovered: keepSeniority,
      registrationDate: member.registrationDate ?? now,
    });
  }
}
