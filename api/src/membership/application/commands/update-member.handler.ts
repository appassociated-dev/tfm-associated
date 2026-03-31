import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateMemberCommand } from './update-member.command';
import { MemberResponseDto } from '../dtos/member-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { MemberId } from '../../domain/value-objects/member-id';
import { PersonalData } from '../../domain/value-objects/personal-data';
import { ContactData } from '../../domain/value-objects/contact-data';
import { BankDetails } from '../../domain/value-objects/bank-details';
import { CustomFields } from '../../domain/value-objects/custom-fields';
import {
  MemberNotFoundError,
  EmailAlreadyExistsError,
  OptimisticLockingError,
} from '../../domain/exceptions';
import { ErrorReporter, ERROR_REPORTER } from '../../../shared/domain';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';

/**
 * Handler del comando de actualización de datos de socio (UC-006).
 * Valida existencia, unicidad de email si cambió, formato de IBAN,
 * ejecuta actualizaciones en el aggregate y persiste con optimistic locking.
 */
@CommandHandler(UpdateMemberCommand)
export class UpdateMemberHandler implements ICommandHandler<UpdateMemberCommand> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: UpdateMemberCommand): Promise<MemberResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.memberTypeRepository.setTenantId(command.tenantId);

    try {
      return await this.updateMember(command);
    } catch (error) {
      if (
        !(error instanceof MemberNotFoundError) &&
        !(error instanceof EmailAlreadyExistsError) &&
        !(error instanceof OptimisticLockingError)
      ) {
        this.errorReporter.captureException(
          error instanceof Error ? error : new Error(String(error)),
          { command: 'UpdateMemberCommand', tenantId: command.tenantId },
        );
      }
      throw error;
    }
  }

  private async updateMember(command: UpdateMemberCommand): Promise<MemberResponseDto> {
    // 1. Buscar socio por ID
    const memberId = MemberId.fromString(command.memberId);
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new MemberNotFoundError(command.memberId);
    }

    // 2. Actualizar datos personales si se proporcionan nombre o apellidos
    if (command.name !== undefined || command.surnames !== undefined) {
      const currentPersonalData = member.personalData;
      const personalDataResult = PersonalData.create({
        name: command.name ?? currentPersonalData?.name ?? '',
        surnames: command.surnames ?? currentPersonalData?.surnames ?? '',
        birthDate: currentPersonalData?.birthDate ?? new Date(),
      });
      if (!personalDataResult.ok) {
        throw personalDataResult.error;
      }
      member.updatePersonalData(personalDataResult.value);
    }

    // 3. Actualizar datos de contacto si se proporcionan
    if (
      command.email !== undefined ||
      command.phone !== undefined ||
      command.address !== undefined ||
      command.postalCode !== undefined ||
      command.city !== undefined
    ) {
      const currentContactData = member.contactData;
      const newEmail = command.email ?? currentContactData?.email ?? '';

      // Validar unicidad de email si cambió
      if (
        command.email !== undefined &&
        currentContactData &&
        command.email.trim().toLowerCase() !== currentContactData.email
      ) {
        const emailExists = await this.memberRepository.existsByEmail(
          command.email.trim().toLowerCase(),
        );
        if (emailExists) {
          throw new EmailAlreadyExistsError(command.email.trim().toLowerCase());
        }
      }

      const contactDataResult = ContactData.create({
        email: newEmail,
        phone: command.phone !== undefined ? command.phone : (currentContactData?.phone ?? null),
        address:
          command.address !== undefined ? command.address : (currentContactData?.address ?? null),
        postalCode:
          command.postalCode !== undefined
            ? command.postalCode
            : (currentContactData?.postalCode ?? null),
        city: command.city !== undefined ? command.city : (currentContactData?.city ?? null),
      });
      if (!contactDataResult.ok) {
        throw contactDataResult.error;
      }
      member.updateContactData(contactDataResult.value);
    }

    // 4. Actualizar IBAN si se proporciona
    if (command.iban !== undefined) {
      if (command.iban) {
        const bankResult = BankDetails.create(command.iban);
        if (!bankResult.ok) {
          throw bankResult.error;
        }
        member.updateBankDetails(bankResult.value);
      }
      // Si iban es null, no actualizamos (no borramos datos bancarios)
    }

    // 5. Actualizar campos personalizados si se proporcionan
    if (command.customFields !== undefined) {
      const customFieldsResult = CustomFields.create(command.customFields ?? {});
      if (!customFieldsResult.ok) {
        throw customFieldsResult.error;
      }
      member.updateCustomFields(customFieldsResult.value);
    }

    // 6. Guardar via repositorio (con optimistic locking)
    await this.memberRepository.save(member);

    // 7. Publicar eventos de dominio en outbox
    await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());

    // 8. Resolver nombre del tipo de socio para el DTO
    const memberType = await this.memberTypeRepository.findById(member.memberTypeId);

    // 9. Retornar MemberResponseDto
    return MemberResponseDto.fromDomain(member, memberType?.name);
  }
}
