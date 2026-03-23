import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateMemberTypeCommand } from './create-member-type.command';
import { MemberTypeResponseDto } from '../dtos/member-type-response.dto';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberType } from '../../domain/aggregates/member-type';
import { MemberTypeCode } from '../../domain/value-objects/member-type-code';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import {
  MemberTypeCodeAlreadyExistsError,
  InvalidMemberTypeDataError,
  MemberTypeNotFoundError,
} from '../../domain/exceptions';

/**
 * Handler del comando de creación de tipo de socio.
 * Valida unicidad de código, existencia de transición destino, y crea el aggregate.
 */
@CommandHandler(CreateMemberTypeCommand)
export class CreateMemberTypeHandler implements ICommandHandler<CreateMemberTypeCommand> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(command: CreateMemberTypeCommand): Promise<MemberTypeResponseDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(command.tenantId);

    // 1. Validar unicidad del código
    const codeResult = MemberTypeCode.create(command.code);
    if (!codeResult.ok) {
      throw new InvalidMemberTypeDataError('code', codeResult.error.message);
    }

    const codeExists = await this.memberTypeRepository.existsByCode(codeResult.value);
    if (codeExists) {
      throw new MemberTypeCodeAlreadyExistsError(command.code);
    }

    // 2. Validar existencia del tipo destino de transición si se especifica
    if (command.automaticTransitionTargetId) {
      const targetId = MemberTypeId.fromString(command.automaticTransitionTargetId);
      const targetExists = await this.memberTypeRepository.findById(targetId);
      if (!targetExists) {
        throw new MemberTypeNotFoundError(command.automaticTransitionTargetId);
      }
    }

    // 3. Crear aggregate MemberType
    const result = MemberType.create({
      code: command.code,
      name: command.name,
      description: command.description,
      ageRangeMin: command.ageRangeMin,
      ageRangeMax: command.ageRangeMax,
      votingRight: command.votingRight,
      eligibleForOffice: command.eligibleForOffice,
      minimumSeniorityForVoting: command.minimumSeniorityForVoting,
      minimumSeniorityForOffice: command.minimumSeniorityForOffice,
      automaticTransitionTargetId: command.automaticTransitionTargetId,
      rulesConfig: command.rulesConfig,
      collectivityType: command.collectivityType,
      tenantId: command.tenantId,
    });

    if (!result.ok) {
      throw new InvalidMemberTypeDataError('aggregate', result.error.message);
    }

    const memberType = result.value;

    // 4. Persistir
    await this.memberTypeRepository.save(memberType);

    // 5. Retornar DTO de respuesta
    return MemberTypeResponseDto.fromDomain(memberType);
  }
}
