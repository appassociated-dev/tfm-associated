import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CheckDniQuery } from './check-dni.query';
import { DniCheckResponseDto } from '../dtos/dni-check-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import { IdentityDocument, DocumentType } from '../../domain/value-objects/identity-document';

/**
 * Handler de la query para verificar existencia de DNI en el tenant (UC-011).
 * Valida el formato del documento y busca coincidencias.
 */
@QueryHandler(CheckDniQuery)
export class CheckDniHandler implements IQueryHandler<CheckDniQuery> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(query: CheckDniQuery): Promise<DniCheckResponseDto> {
    // Establecer tenantId en el repositorio (ADR-002)
    this.memberRepository.setTenantId(query.tenantId);

    // 1. Validar formato del documento de identidad
    const documentResult = IdentityDocument.create(
      query.documentType as DocumentType,
      query.documentNumber,
    );

    if (!documentResult.ok) {
      throw documentResult.error;
    }

    // 2. Buscar socio con ese documento
    const existingMember = await this.memberRepository.findByIdentityDocument(documentResult.value);

    // 3. Construir respuesta
    const dto = new DniCheckResponseDto();

    if (existingMember) {
      dto.exists = true;
      dto.memberName = existingMember.personalData
        ? `${existingMember.personalData.name} ${existingMember.personalData.surnames}`
        : undefined;
      dto.memberNumber = existingMember.memberNumber?.value;
    } else {
      dto.exists = false;
    }

    return dto;
  }
}
