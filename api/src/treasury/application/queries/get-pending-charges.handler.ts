import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetPendingChargesQuery } from './get-pending-charges.query';
import { PendingChargeResponseDto } from '../dtos/pending-charge-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { MemberAccountNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener los cargos pendientes de una cuenta de socio.
 * Retorna cargos con status PENDING o PARTIALLY_PAID, ordenados por vencimiento ASC.
 */
@QueryHandler(GetPendingChargesQuery)
export class GetPendingChargesHandler implements IQueryHandler<GetPendingChargesQuery> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
  ) {}

  async execute(query: GetPendingChargesQuery): Promise<PendingChargeResponseDto[]> {
    // 1. Establecer tenantId en el repositorio (ADR-002)
    this.memberAccountRepository.setTenantId(query.tenantId);

    // 2. Buscar MemberAccount con sus cargos
    const accountId = MemberAccountId.fromString(query.memberAccountId);
    const account = await this.memberAccountRepository.findById(accountId);
    if (!account) {
      throw new MemberAccountNotFoundError(query.memberAccountId);
    }

    // 3. Filtrar cargos pendientes
    const pendingCharges = account.getPendingCharges();

    // 4. Ordenar por fecha de vencimiento ASC (más antiguos primero)
    const sorted = [...pendingCharges].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    // 5. Mapear a DTOs
    return sorted.map((charge) => PendingChargeResponseDto.fromDomain(charge));
  }
}
