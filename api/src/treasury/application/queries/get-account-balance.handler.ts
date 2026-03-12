import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAccountBalanceQuery } from './get-account-balance.query';
import { AccountBalanceResponseDto } from '../dtos/account-balance-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { MemberAccountNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el balance pendiente de una cuenta de socio.
 * Calcula el total pendiente y enriquece con datos del socio vía MemberQueryPort.
 */
@QueryHandler(GetAccountBalanceQuery)
export class GetAccountBalanceHandler implements IQueryHandler<GetAccountBalanceQuery> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
  ) {}

  async execute(query: GetAccountBalanceQuery): Promise<AccountBalanceResponseDto> {
    // 1. Establecer tenantId en los repositorios/puertos (ADR-002)
    this.memberAccountRepository.setTenantId(query.tenantId);
    this.memberQueryPort.setTenantId(query.tenantId);

    // 2. Buscar MemberAccount
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);
    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // 3. Obtener datos del socio
    const member = await this.memberQueryPort.findById(account.memberId);

    // 4. Calcular balance y cargos pendientes
    const balance = account.getBalance();
    const pendingCharges = account.getPendingCharges();

    // 5. Determinar fecha de vencimiento más antigua
    const oldestDueDate =
      pendingCharges.length > 0
        ? pendingCharges.reduce(
            (oldest, charge) => (charge.dueDate < oldest ? charge.dueDate : oldest),
            pendingCharges[0].dueDate,
          )
        : null;

    // 6. Construir DTO de respuesta
    const dto = new AccountBalanceResponseDto();
    dto.memberAccountId = account.id.toValue();
    dto.memberId = account.memberId;
    dto.memberName = member ? `${member.name} ${member.surnames}` : 'Desconocido';
    dto.memberNumber = member?.memberNumber ?? '';
    dto.totalPending = balance.amount;
    dto.totalPendingFormatted = `${balance.toUnits().toFixed(2)} ${balance.currency}`;
    dto.chargeCount = pendingCharges.length;
    dto.oldestDueDate = oldestDueDate;

    return dto;
  }
}
