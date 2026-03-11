import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { SearchMembersForPaymentQuery } from './search-members-for-payment.query';
import { MemberSearchResultDto } from '../dtos/member-search-result.dto';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';

/**
 * Handler de la query de búsqueda de socios para registro de cobros.
 * Busca socios por nombre/apellidos/número/DNI y enriquece con balance pendiente.
 */
@QueryHandler(SearchMembersForPaymentQuery)
export class SearchMembersForPaymentHandler implements IQueryHandler<SearchMembersForPaymentQuery> {
  constructor(
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
  ) {}

  async execute(query: SearchMembersForPaymentQuery): Promise<MemberSearchResultDto[]> {
    // 1. Establecer tenantId en repositorios/puertos (ADR-002)
    this.memberQueryPort.setTenantId(query.tenantId);
    this.memberAccountRepository.setTenantId(query.tenantId);

    // 2. Buscar socios que coincidan con el término de búsqueda
    const members = await this.memberQueryPort.searchMembers(query.query);

    // 3. Para cada socio, obtener su cuenta y calcular balance pendiente
    const results: MemberSearchResultDto[] = [];

    for (const member of members) {
      const account = await this.memberAccountRepository.findByMemberId(member.id);

      const dto = new MemberSearchResultDto();
      dto.memberId = member.id;
      dto.memberAccountId = account?.id.toValue() ?? null;
      dto.memberNumber = member.memberNumber;
      dto.name = member.name;
      dto.surnames = member.surnames;

      if (account) {
        const balance = account.getBalance();
        const pendingCharges = account.getPendingCharges();
        dto.pendingBalance = balance.amount;
        dto.pendingBalanceFormatted = `${balance.toUnits().toFixed(2)} ${balance.currency}`;
        dto.pendingCharges = pendingCharges.length;
      } else {
        dto.pendingBalance = 0;
        dto.pendingBalanceFormatted = '0.00 EUR';
        dto.pendingCharges = 0;
      }

      results.push(dto);
    }

    return results;
  }
}
