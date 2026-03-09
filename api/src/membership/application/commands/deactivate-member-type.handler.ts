import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateMemberTypeCommand } from './deactivate-member-type.command';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import {
  MemberTypeNotFoundError,
  MemberTypeIsTransitionTargetError,
} from '../../domain/exceptions';

/**
 * Handler del comando de desactivación de tipo de socio.
 * Verifica que no sea destino de transición de otro tipo antes de desactivar.
 */
@CommandHandler(DeactivateMemberTypeCommand)
export class DeactivateMemberTypeHandler implements ICommandHandler<DeactivateMemberTypeCommand> {
  constructor(
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
  ) {}

  async execute(command: DeactivateMemberTypeCommand): Promise<void> {
    // 0. Establecer tenantId en el repositorio para usar la BD correcta (ADR-002)
    this.memberTypeRepository.setTenantId(command.tenantId);

    // 1. Buscar el tipo de socio
    const memberTypeId = MemberTypeId.fromString(command.memberTypeId);
    const memberType = await this.memberTypeRepository.findById(memberTypeId);

    if (!memberType) {
      throw new MemberTypeNotFoundError(command.memberTypeId);
    }

    // 2. Verificar que no sea destino de transición de otro tipo
    const isTarget = await this.memberTypeRepository.existsAsTransitionTarget(memberTypeId);
    if (isTarget) {
      throw new MemberTypeIsTransitionTargetError(command.memberTypeId);
    }

    // 3. Desactivar
    memberType.deactivate();

    // 4. Persistir
    await this.memberTypeRepository.save(memberType);
  }
}
