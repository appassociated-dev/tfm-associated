import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetStatusHistoryQuery } from './get-status-history.query';
import { StatusHistoryResponseDto } from '../dtos/status-history-response.dto';
import { StatusHistoryEntryDto } from '../dtos/status-history-entry.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  STATUS_HISTORY_REPOSITORY,
  StatusHistoryRepository,
} from '../../domain/repositories/status-history.repository';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberNotFoundError } from '../../domain/exceptions';

/**
 * Handler de la query para obtener el historial de estados de un socio.
 */
@QueryHandler(GetStatusHistoryQuery)
export class GetStatusHistoryHandler implements IQueryHandler<GetStatusHistoryQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(STATUS_HISTORY_REPOSITORY)
    private readonly statusHistoryRepository: StatusHistoryRepository,
  ) {}

  async execute(query: GetStatusHistoryQuery): Promise<StatusHistoryResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);
    this.statusHistoryRepository.setTenantId(query.tenantId);

    // 1. Verificar existencia del socio
    const memberId = MemberId.fromString(query.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(query.memberId);
    }

    // 2. Obtener historial de estados
    const entries = await this.statusHistoryRepository.findByMemberId(memberId);

    // 3. Construir respuesta
    const response = new StatusHistoryResponseDto();
    response.memberId = query.memberId;
    response.currentStatus = member.getCurrentStatus().value;
    response.entries = entries.map(StatusHistoryEntryDto.fromDomain);

    return response;
  }
}
