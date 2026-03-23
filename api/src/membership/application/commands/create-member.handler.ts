import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateMemberCommand } from './create-member.command';
import { MemberResponseDto } from '../dtos/member-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import { Member } from '../../domain/aggregates/member';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberNumber } from '../../domain/value-objects/member-number';
import { PersonalData } from '../../domain/value-objects/personal-data';
import { ContactData } from '../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../domain/value-objects/identity-document';
import { BankDetails } from '../../domain/value-objects/bank-details';
import { CustomFields } from '../../domain/value-objects/custom-fields';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { MemberTypeRulesEvaluator } from '../../domain/services/member-type-rules-evaluator';
import {
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
  MemberTypeNotFoundError,
  MemberTypeNotActiveError,
  AgeNotEligibleError,
} from '../../domain/exceptions';
import { ErrorReporter, ERROR_REPORTER } from '../../../shared/domain';
import { MEMBER_OUTBOX_PUBLISHER, MemberOutboxPublisher } from '../ports/member-outbox.publisher';

/**
 * Handler del comando de creación de socio con ficha completa (UC-006).
 * Valida unicidad de DNI y email, tipo de socio, elegibilidad por edad,
 * genera número de socio, crea el aggregate y publica evento.
 */
@CommandHandler(CreateMemberCommand)
export class CreateMemberHandler implements ICommandHandler<CreateMemberCommand> {
  private readonly rulesEvaluator = new MemberTypeRulesEvaluator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
    @Inject(MEMBER_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: MemberOutboxPublisher,
  ) {}

  async execute(command: CreateMemberCommand): Promise<MemberResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.memberTypeRepository.setTenantId(command.tenantId);

    try {
      return await this.createMember(command);
    } catch (error) {
      // Reportar excepciones no esperadas vía ErrorReporter
      if (
        !(error instanceof DocumentAlreadyExistsError) &&
        !(error instanceof EmailAlreadyExistsError) &&
        !(error instanceof MemberTypeNotFoundError) &&
        !(error instanceof MemberTypeNotActiveError) &&
        !(error instanceof AgeNotEligibleError)
      ) {
        this.errorReporter.captureException(
          error instanceof Error ? error : new Error(String(error)),
          { command: 'CreateMemberCommand', tenantId: command.tenantId },
        );
      }
      throw error;
    }
  }

  private async createMember(command: CreateMemberCommand): Promise<MemberResponseDto> {
    // 1. Crear y validar IdentityDocument
    const documentResult = IdentityDocument.create(
      command.documentType as DocumentType,
      command.documentNumber,
    );
    if (!documentResult.ok) {
      throw documentResult.error;
    }

    // 2. Validar que el DNI no existe en el tenant (FE-1)
    const existingByDoc = await this.memberRepository.findByIdentityDocument(documentResult.value);
    if (existingByDoc) {
      throw new DocumentAlreadyExistsError(
        command.documentNumber,
        existingByDoc.personalData
          ? `${existingByDoc.personalData.name} ${existingByDoc.personalData.surnames}`
          : undefined,
        existingByDoc.memberNumber?.value,
      );
    }

    // 3. Validar que el email no existe en el tenant (FE-2)
    const emailNormalized = command.email.trim().toLowerCase();
    const emailExists = await this.memberRepository.existsByEmail(emailNormalized);
    if (emailExists) {
      throw new EmailAlreadyExistsError(emailNormalized);
    }

    // 4. Validar que el tipo de socio existe y está activo
    const memberTypeId = MemberTypeId.fromString(command.memberTypeId);
    const memberType = await this.memberTypeRepository.findById(memberTypeId);
    if (!memberType) {
      throw new MemberTypeNotFoundError(command.memberTypeId);
    }
    if (!memberType.active) {
      throw new MemberTypeNotActiveError(command.memberTypeId);
    }

    // 5. Crear PersonalData y validar
    const birthDate = new Date(command.birthDate);
    const personalDataResult = PersonalData.create({
      name: command.name,
      surnames: command.surnames,
      birthDate,
    });
    if (!personalDataResult.ok) {
      throw personalDataResult.error;
    }

    // 6. Evaluar elegibilidad por edad con MemberTypeRulesEvaluator
    const ageEligibility = this.rulesEvaluator.evaluateAgeEligibility(memberType, birthDate);
    if (!ageEligibility.eligible) {
      throw new AgeNotEligibleError(personalDataResult.value.getAge(), memberType.name);
    }

    // 7. Detección de menor sin representante legal (FE-4, advertencia no bloquea)
    if (personalDataResult.value.getAge() < 18) {
      const customFieldsData = command.customFields ?? {};
      if (!customFieldsData['legalRepresentative']) {
        this.errorReporter.captureMessage(
          `Menor de edad registrado sin representante legal: ${command.name} ${command.surnames}`,
          'warning',
          { tenantId: command.tenantId, age: personalDataResult.value.getAge() },
        );
      }
    }

    // 8. Crear ContactData
    const contactDataResult = ContactData.create({
      email: command.email,
      phone: command.phone ?? null,
      address: command.address ?? null,
      postalCode: command.postalCode ?? null,
      city: command.city ?? null,
    });
    if (!contactDataResult.ok) {
      throw contactDataResult.error;
    }

    // 9. Crear BankDetails (opcional)
    let bankDetails: BankDetails | null = null;
    if (command.iban) {
      const bankResult = BankDetails.create(command.iban);
      if (!bankResult.ok) {
        throw bankResult.error;
      }
      bankDetails = bankResult.value;
    }

    // 10. Crear CustomFields
    const customFieldsResult = CustomFields.create(command.customFields ?? {});
    if (!customFieldsResult.ok) {
      throw customFieldsResult.error;
    }

    // 11. Obtener siguiente número de socio
    const nextNumber = await this.memberRepository.getNextMemberNumber();
    const memberNumberResult = MemberNumber.fromSequence(nextNumber);
    if (!memberNumberResult.ok) {
      throw memberNumberResult.error;
    }

    // 12. Determinar estado inicial
    const initialStatus =
      command.initialStatus === 'APPLICANT' ? MemberStatus.APPLICANT : MemberStatus.ACTIVE;

    // 13. Crear Aggregate via Member.register()
    const registerResult = Member.register({
      memberTypeId,
      memberNumber: memberNumberResult.value,
      personalData: personalDataResult.value,
      contactData: contactDataResult.value,
      identityDocument: documentResult.value,
      bankDetails,
      customFields: customFieldsResult.value,
      initialStatus,
    });

    if (!registerResult.ok) {
      throw registerResult.error;
    }

    const member = registerResult.value;

    // 14. Guardar via repositorio
    await this.memberRepository.save(member);

    // 15. Publicar eventos de dominio en outbox
    await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());

    // 16. Retornar MemberResponseDto
    return MemberResponseDto.fromDomain(member, memberType.name);
  }
}
