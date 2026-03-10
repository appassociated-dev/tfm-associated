import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RunDelinquencyCheckCommand } from './run-delinquency-check.command';
import { DelinquencyCheckResultDto } from '../dtos/delinquency-check-result.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  STATUS_HISTORY_REPOSITORY,
  StatusHistoryRepository,
} from '../../domain/repositories/status-history.repository';
import { ERROR_REPORTER, ErrorReporter } from '../../../shared/domain/ports/error-reporter.port';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';
import { StatusTransitionValidator } from '../../domain/services/status-transition-validator';
import { Member } from '../../domain/aggregates/member';

/**
 * Handler del comando de verificación de morosidad.
 * Detecta socios con pagos vencidos y los transiciona a PENDING_PAYMENT.
 * Procesa socio a socio, capturando errores individuales sin detener el proceso.
 */
@CommandHandler(RunDelinquencyCheckCommand)
export class RunDelinquencyCheckHandler implements ICommandHandler<RunDelinquencyCheckCommand> {
  private readonly transitionValidator = new StatusTransitionValidator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: StatusHistoryRepository,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
  ) {}

  async execute(command: RunDelinquencyCheckCommand): Promise<DelinquencyCheckResultDto> {
    // 1. Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.statusHistoryRepository.setTenantId(command.tenantId);

    // 2. Obtener socios con pagos vencidos
    const overdueMembers = await this.memberRepository.findMembersWithOverduePayments(
      command.daysOverdue,
    );

    // 3. Filtrar solo los que están en estado ACTIVE
    const activeOverdueMembers = overdueMembers.filter((member) =>
      member.getCurrentStatus().equals(MemberStatus.ACTIVE),
    );

    const result = new DelinquencyCheckResultDto();
    result.processedCount = activeOverdueMembers.length;
    result.transitionedCount = 0;
    result.errors = [];

    // 4. Procesar cada socio
    for (const member of activeOverdueMembers) {
      try {
        await this.processMember(member, command.daysOverdue);
        result.transitionedCount += 1;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        result.errors.push({
          memberId: member.id.toValue(),
          error: errorMessage,
        });

        // Reportar error via ErrorReporter
        this.errorReporter.captureException(
          error instanceof Error ? error : new Error(errorMessage),
          {
            memberId: member.id.toValue(),
            daysOverdue: command.daysOverdue,
            operation: 'delinquency-check',
          },
        );
      }
    }

    return result;
  }

  /**
   * Procesa un socio individual: cambia estado a PENDING_PAYMENT y persiste.
   */
  private async processMember(member: Member, daysOverdue: number): Promise<void> {
    // Crear motivo del cambio
    const reasonResult = StatusChangeReason.create(`Impago > ${daysOverdue} días`);
    if (!reasonResult.ok) {
      throw reasonResult.error;
    }

    // Ejecutar transición
    const historyCountBefore = member.getStatusHistory().length;
    const changeResult = member.changeStatus(
      MemberStatus.PENDING_PAYMENT,
      reasonResult.value,
      'SYSTEM',
      this.transitionValidator,
    );

    if (!changeResult.ok) {
      throw changeResult.error;
    }

    // Persistir
    await this.memberRepository.save(member);

    // Guardar solo las nuevas entradas de historial
    const allEntries = member.getStatusHistory();
    const newEntries = allEntries.slice(historyCountBefore);
    for (const entry of newEntries) {
      await this.statusHistoryRepository.save(entry);
    }
  }
}
