import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ImportTemplateCommand } from './import-template.command';
import { MemberTypeResponseDto } from '../dtos/member-type-response.dto';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberType } from '../../domain/aggregates/member-type';
import { MemberTypeCode } from '../../domain/value-objects/member-type-code';
import { getTemplatesForCollectivityType } from '../../infrastructure/data/member-type-templates';
import { InvalidMemberTypeDataError } from '../../domain/exceptions';

/**
 * Handler del comando de importación de plantillas de tipos de socio.
 * Obtiene las plantillas por tipo de colectividad, valida que no existan y las crea.
 */
@CommandHandler(ImportTemplateCommand)
export class ImportTemplateHandler implements ICommandHandler<ImportTemplateCommand> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(command: ImportTemplateCommand): Promise<MemberTypeResponseDto[]> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(command.tenantId);

    // 1. Obtener plantillas para el tipo de colectividad
    const templates = getTemplatesForCollectivityType(command.collectivityType);

    if (templates.length === 0) {
      throw new InvalidMemberTypeDataError(
        'collectivityType',
        `No hay plantillas disponibles para el tipo "${command.collectivityType}".`,
      );
    }

    const results: MemberTypeResponseDto[] = [];

    // 2. Crear cada tipo de socio desde la plantilla
    for (const template of templates) {
      // Verificar que el código no exista ya
      const codeResult = MemberTypeCode.create(template.code);
      if (codeResult.ok) {
        const exists = await this.memberTypeRepository.existsByCode(codeResult.value);
        if (exists) {
          // Saltar tipos que ya existen (no lanzar error para permitir importación parcial)
          continue;
        }
      }

      const memberTypeResult = MemberType.create({
        code: template.code,
        name: template.name,
        description: template.description,
        ageRangeMin: template.ageRangeMin,
        ageRangeMax: template.ageRangeMax,
        votingRight: template.votingRight,
        eligibleForOffice: template.eligibleForOffice,
        minimumSeniorityForVoting: template.minimumSeniorityForVoting,
        minimumSeniorityForOffice: template.minimumSeniorityForOffice,
        automaticTransitionTargetId: null,
        rulesConfig: template.rulesConfig,
        collectivityType: command.collectivityType,
        tenantId: command.tenantId,
      });

      if (!memberTypeResult.ok) {
        throw new InvalidMemberTypeDataError('template', memberTypeResult.error.message);
      }

      await this.memberTypeRepository.save(memberTypeResult.value);
      results.push(MemberTypeResponseDto.fromDomain(memberTypeResult.value));
    }

    return results;
  }
}
