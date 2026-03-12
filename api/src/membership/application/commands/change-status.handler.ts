import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeStatusCommand } from './change-status.command';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  STATUS_HISTORY_REPOSITORY,
  StatusHistoryRepository,
} from '../../domain/repositories/status-history.repository';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import {
  MemberNotFoundError,
  TransitionNotAllowedError,
  OptimisticLockingError,
} from '../../domain/exceptions';

/** Resultado del cambio de estado exitoso. */
export interface ChangeStatusResult {
  memberId: string;
  previousStatus: string;
  newStatus: string;
  changedAt: Date;
}

/**
 * Handler del comando de cambio de estado de un socio.
 * Valida existencia, ejecuta la transición y persiste con reintento por optimistic locking.
 */
@CommandHandler(ChangeStatusCommand)
export class ChangeStatusHandler implements ICommandHandler<ChangeStatusCommand> {
  private readonly transitionValidator = new StatusTransitionValidator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: StatusHistoryRepository,
  ) {}

  async execute(command: ChangeStatusCommand): Promise<ChangeStatusResult> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.statusHistoryRepository.setTenantId(command.tenantId);

    try {
      return await this.executeTransition(command);
    } catch (error) {
      // Si falla por optimistic locking, reintentar 1 vez
      if (error instanceof OptimisticLockingError) {
        return await this.executeTransition(command);
      }
      throw error;
    }
  }

  /**
   * Ejecuta la transición de estado: busca socio, valida y persiste.
   */
  private async executeTransition(command: ChangeStatusCommand): Promise<ChangeStatusResult> {
    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(command.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    // 2. Crear Value Object de motivo
    const reasonResult = StatusChangeReason.create(command.reason);
    if (!reasonResult.ok) {
      throw reasonResult.error;
    }

    // 3. Ejecutar transición de estado en el aggregate
    const previousStatus = member.getCurrentStatus().value;
    const historyCountBefore = member.getStatusHistory().length;
    const newStatus = MemberStatus.fromString(command.newStatus);
    const changeResult = member.changeStatus(
      newStatus,
      reasonResult.value,
      command.changedBy,
      this.transitionValidator,
    );

    if (!changeResult.ok) {
      throw changeResult.error;
    }

    // 4. Persistir el aggregate (puede lanzar OptimisticLockingError)
    await this.memberRepository.save(member);

    // 5. Guardar solo las nuevas entradas de historial
    const allEntries = member.getStatusHistory();
    const newEntries = allEntries.slice(historyCountBefore);
    for (const entry of newEntries) {
      await this.statusHistoryRepository.save(entry);
    }

    // 6. Retornar resultado
    return {
      memberId: command.memberId,
      previousStatus,
      newStatus: command.newStatus,
      changedAt: new Date(),
    };
  }
}
