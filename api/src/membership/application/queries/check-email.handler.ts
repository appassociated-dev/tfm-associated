import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CheckEmailQuery } from './check-email.query';
import { EmailCheckResponseDto } from '../dtos/email-check-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';

/**
 * Handler de la query para verificar existencia de email en el tenant (UC-011).
 * Busca si ya existe un socio con el email dado (case-insensitive).
 */
@QueryHandler(CheckEmailQuery)
export class CheckEmailHandler implements IQueryHandler<CheckEmailQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(query: CheckEmailQuery): Promise<EmailCheckResponseDto> {
    // Establecer tenantId en el repositorio (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);

    const exists = await this.memberRepository.existsByEmail(query.email);

    const dto = new EmailCheckResponseDto();
    dto.exists = exists;
    return dto;
  }
}
