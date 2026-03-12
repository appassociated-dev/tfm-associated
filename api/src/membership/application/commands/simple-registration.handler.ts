import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SimpleRegistrationCommand } from './simple-registration.command';
import { SimpleRegistrationResponseDto } from '../dtos/simple-registration-response.dto';
import { MEMBER_REPOSITORY, MemberRepository } from '../../domain/repositories/member.repository';
import {
  MEMBER_TYPE_REPOSITORY,
  MemberTypeRepository,
} from '../../domain/repositories/member-type.repository';
import {
  FISCAL_YEAR_REPOSITORY,
  FiscalYearRepository,
} from '../../domain/repositories/fiscal-year.repository';
import {
  REGISTRATION_CHARGE_PORT,
  RegistrationChargePort,
} from '../../domain/ports/registration-charge.port';
import { MEMBER_OUTBOX_PUBLISHER, MemberOutboxPublisher } from '../ports/member-outbox.publisher';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { Member } from '../../domain/aggregates/member';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberNumber } from '../../domain/value-objects/member-number';
import { PersonalData } from '../../domain/value-objects/personal-data';
import { ContactData } from '../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../domain/value-objects/identity-document';
import { CustomFields } from '../../domain/value-objects/custom-fields';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { MemberTypeRulesEvaluator } from '../../domain/services/member-type-rules-evaluator';
import {
  DocumentAlreadyExistsError,
  MemberTypeNotFoundError,
  MemberTypeNotActiveError,
  AgeNotEligibleError,
  NoOpenFiscalYearError,
  NoRegistrationPlanError,
} from '../../domain/exceptions';
import { ErrorReporter, ERROR_REPORTER } from '../../../shared/domain';

/**
 * Handler del comando de alta simple de socio (UC-011).
 * Orquesta la creación atómica de Member + artefactos de tesorería
 * (MemberAccount, FeeSubscription, Charge) dentro de una transacción Prisma.
 */
@CommandHandler(SimpleRegistrationCommand)
export class SimpleRegistrationHandler implements ICommandHandler<SimpleRegistrationCommand> {
  private readonly rulesEvaluator = new MemberTypeRulesEvaluator();

  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(MEMBER_TYPE_REPOSITORY)
    private readonly memberTypeRepository: MemberTypeRepository,
    @Inject(FISCAL_YEAR_REPOSITORY)
    private readonly fiscalYearRepository: FiscalYearRepository,
    @Inject(REGISTRATION_CHARGE_PORT)
    private readonly registrationChargePort: RegistrationChargePort,
    @Inject(MEMBER_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: MemberOutboxPublisher,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
    private readonly prismaTenantService: PrismaTenantService,
  ) {}

  async execute(command: SimpleRegistrationCommand): Promise<SimpleRegistrationResponseDto> {
    // Establecer tenantId en los repositorios (ADR-002)
    this.memberRepository.setTenantId(command.tenantId);
    this.memberTypeRepository.setTenantId(command.tenantId);
    this.fiscalYearRepository.setTenantId(command.tenantId);
    this.registrationChargePort.setTenantId(command.tenantId);

    try {
      return await this.processRegistration(command);
    } catch (error) {
      // Reportar excepciones no esperadas vía ErrorReporter
      if (
        !(error instanceof DocumentAlreadyExistsError) &&
        !(error instanceof MemberTypeNotFoundError) &&
        !(error instanceof MemberTypeNotActiveError) &&
        !(error instanceof AgeNotEligibleError) &&
        !(error instanceof NoOpenFiscalYearError) &&
        !(error instanceof NoRegistrationPlanError)
      ) {
        this.errorReporter.captureException(
          error instanceof Error ? error : new Error(String(error)),
          { command: 'SimpleRegistrationCommand', tenantId: command.tenantId },
        );
      }
      throw error;
    }
  }

  private async processRegistration(
    command: SimpleRegistrationCommand,
  ): Promise<SimpleRegistrationResponseDto> {
    // 1. Verificar precondiciones: ejercicio fiscal abierto
    const activeFiscalYear = await this.fiscalYearRepository.findActive();
    if (!activeFiscalYear) {
      throw new NoOpenFiscalYearError();
    }

    // 2. Verificar precondiciones: plan de alta activo
    const registrationPlan = await this.registrationChargePort.findRegistrationPlan();
    if (!registrationPlan) {
      throw new NoRegistrationPlanError();
    }

    // 3. Crear y validar IdentityDocument
    const documentResult = IdentityDocument.create(
      command.documentType as DocumentType,
      command.documentNumber,
    );
    if (!documentResult.ok) {
      throw documentResult.error;
    }

    // 4. Validar que el DNI no existe en el tenant → 409 si existe
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

    // 5. Verificar email duplicado (advertencia, no bloquea)
    let emailWarning: string | undefined;
    const emailNormalized = command.email.trim().toLowerCase();
    const emailExists = await this.memberRepository.existsByEmail(emailNormalized);
    if (emailExists) {
      emailWarning = `El email '${emailNormalized}' ya está registrado en otro socio.`;
    }

    // 6. Validar que el tipo de socio existe y está activo
    const memberTypeId = MemberTypeId.fromString(command.memberTypeId);
    const memberType = await this.memberTypeRepository.findById(memberTypeId);
    if (!memberType) {
      throw new MemberTypeNotFoundError(command.memberTypeId);
    }
    if (!memberType.active) {
      throw new MemberTypeNotActiveError(command.memberTypeId);
    }

    // 7. Crear PersonalData y validar
    const birthDate = new Date(command.birthDate);
    const personalDataResult = PersonalData.create({
      name: command.name,
      surnames: command.surnames,
      birthDate,
    });
    if (!personalDataResult.ok) {
      throw personalDataResult.error;
    }

    // 8. Evaluar elegibilidad por edad con MemberTypeRulesEvaluator
    const ageEligibility = this.rulesEvaluator.evaluateAgeEligibility(memberType, birthDate);
    if (!ageEligibility.eligible) {
      throw new AgeNotEligibleError(personalDataResult.value.getAge(), memberType.name);
    }

    // 9. Crear ContactData
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

    // 10. Crear CustomFields (vacío para alta simple)
    const customFieldsResult = CustomFields.create({});
    if (!customFieldsResult.ok) {
      throw customFieldsResult.error;
    }

    // 11. Ejecutar operaciones transaccionales con prisma.$transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = this.prismaTenantService.getClient(command.tenantId) as any;

    const result = await prisma.$transaction(async (tx: unknown) => {
      // 11a. Obtener siguiente número de socio (dentro de la transacción para evitar colisiones)
      const nextNumber = await this.memberRepository.getNextMemberNumber();
      const memberNumberResult = MemberNumber.fromSequence(nextNumber);
      if (!memberNumberResult.ok) {
        throw memberNumberResult.error;
      }

      // 11b. Crear Member via Member.register()
      const registerResult = Member.register({
        memberTypeId,
        memberNumber: memberNumberResult.value,
        personalData: personalDataResult.value,
        contactData: contactDataResult.value,
        identityDocument: documentResult.value,
        bankDetails: null,
        customFields: customFieldsResult.value,
        initialStatus: MemberStatus.ACTIVE,
      });

      if (!registerResult.ok) {
        throw registerResult.error;
      }

      const member = registerResult.value;

      // 11c. Guardar member via repositorio
      await this.memberRepository.save(member);

      // 11d. Crear artefactos de tesorería via RegistrationChargePort
      const now = new Date();
      const chargeResult = await this.registrationChargePort.createRegistrationArtifacts(
        {
          memberId: member.id.toValue(),
          feePlanId: registrationPlan.feePlanId,
          effectiveAmount: registrationPlan.amount,
          concept: `Alta de socio - ${registrationPlan.name}`,
          billingYear: now.getFullYear(),
          issueDate: now,
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 días
        },
        tx,
      );

      // 11e. Publicar eventos de dominio en outbox
      await this.outboxPublisher.publish(command.tenantId, member.pullDomainEvents());

      return {
        member,
        memberNumber: memberNumberResult.value,
        chargeResult,
      };
    });

    // 12. Construir respuesta
    return SimpleRegistrationResponseDto.fromResult({
      memberId: result.member.id.toValue(),
      memberNumber: result.memberNumber.value,
      status: result.member.getCurrentStatus().value,
      memberTypeName: memberType.name,
      registrationDate: result.member.registrationDate ?? new Date(),
      emailWarning,
      registrationCharge: {
        chargeId: result.chargeResult.chargeId,
        amount: registrationPlan.amount,
        description: `Alta de socio - ${registrationPlan.name}`,
        status: 'PENDING',
      },
    });
  }
}
