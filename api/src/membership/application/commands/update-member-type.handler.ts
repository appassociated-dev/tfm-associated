import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateMemberTypeCommand } from './update-member-type.command';
import { MemberTypeResponseDto } from '../dtos/member-type-response.dto';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import {
  MemberTypeNotFoundError,
  InvalidMemberTypeDataError,
  CircularTransitionError,
} from '../../domain/exceptions';

/**
 * Handler del comando de actualización de tipo de socio.
 * Busca el aggregate, valida transición, aplica cambios y persiste.
 */
@CommandHandler(UpdateMemberTypeCommand)
export class UpdateMemberTypeHandler implements ICommandHandler<UpdateMemberTypeCommand> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(command: UpdateMemberTypeCommand): Promise<MemberTypeResponseDto> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(command.tenantId);

    // 1. Buscar el tipo de socio existente
    const memberTypeId = MemberTypeId.fromString(command.memberTypeId);
    const memberType = await this.memberTypeRepository.findById(memberTypeId);

    if (!memberType) {
      throw new MemberTypeNotFoundError(command.memberTypeId);
    }

    // 2. Validar que la transición destino no sea a sí mismo
    if (command.automaticTransitionTargetId === command.memberTypeId) {
      throw new CircularTransitionError(command.memberTypeId, command.automaticTransitionTargetId);
    }

    // 3. Validar existencia del tipo destino de transición
    if (command.automaticTransitionTargetId) {
      const targetId = MemberTypeId.fromString(command.automaticTransitionTargetId);
      const targetExists = await this.memberTypeRepository.findById(targetId);
      if (!targetExists) {
        throw new MemberTypeNotFoundError(command.automaticTransitionTargetId);
      }
    }

    // 4. Aplicar cambios al aggregate
    const updateResult = memberType.update({
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
    });

    if (!updateResult.ok) {
      throw new InvalidMemberTypeDataError('update', updateResult.error.message);
    }

    // 5. Persistir
    await this.memberTypeRepository.save(memberType);

    // 6. Retornar DTO
    return MemberTypeResponseDto.fromDomain(memberType);
  }
}
