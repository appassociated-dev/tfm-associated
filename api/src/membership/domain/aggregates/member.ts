import { AggregateRoot } from '../../../shared/domain';
import { MemberId } from '../value-objects/member-id';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberStatus } from '../value-objects/member-status';
import { StatusChangeReason } from '../value-objects/status-change-reason';
import { StatusHistory } from '../entities/status-history';
import { StatusTransitionValidator } from '../services/status-transition-validator';
import { MemberStatusChangedEvent } from '../events/member-status-changed.event';
import { MemberRegisteredEvent } from '../events/member-registered.event';
import { MemberDataUpdatedEvent } from '../events/member-data-updated.event';
import { TransitionNotAllowedError } from '../exceptions/transition-not-allowed.exception';
import { MemberNumber } from '../value-objects/member-number';
import { PersonalData } from '../value-objects/personal-data';
import { ContactData } from '../value-objects/contact-data';
import { IdentityDocument } from '../value-objects/identity-document';
import { BankDetails } from '../value-objects/bank-details';
import { CustomFields } from '../value-objects/custom-fields';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear un nuevo Member via factory method (Task 5 — retrocompatible). */
export interface CreateMemberProps {
  memberTypeId: MemberTypeId;
}

/** Propiedades para registrar un nuevo Member con ficha completa (Task 6). */
export interface RegisterMemberProps {
  memberTypeId: MemberTypeId;
  memberNumber: MemberNumber;
  personalData: PersonalData;
  contactData: ContactData;
  identityDocument: IdentityDocument;
  bankDetails: BankDetails | null;
  customFields: CustomFields;
  /** Estado inicial: ACTIVE (por defecto) o APPLICANT. */
  initialStatus?: MemberStatus;
}

/** Propiedades completas para reconstituir un Member desde persistencia. */
export interface ReconstituteMemberProps {
  id: MemberId;
  memberTypeId: MemberTypeId;
  currentStatus: MemberStatus;
  statusHistory: StatusHistory[];
  version: number;
  /** Campos de ficha — opcionales para retrocompatibilidad con Task 5. */
  memberNumber?: MemberNumber;
  personalData?: PersonalData;
  contactData?: ContactData;
  identityDocument?: IdentityDocument;
  bankDetails?: BankDetails | null;
  customFields?: CustomFields;
  registrationDate?: Date;
  leaveDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Aggregate Root que representa un socio en el sistema.
 * Gestiona la máquina de estados del socio con historial de transiciones (Task 5)
 * y la ficha completa con datos personales, contacto, documento, IBAN y campos personalizados (Task 6).
 */
export class Member extends AggregateRoot<MemberId> {
  private _memberTypeId: MemberTypeId;
  private _currentStatus: MemberStatus;
  private _statusHistory: StatusHistory[];
  private _version: number;

  // Campos de ficha (Task 6) — opcionales para retrocompatibilidad
  private _memberNumber?: MemberNumber;
  private _personalData?: PersonalData;
  private _contactData?: ContactData;
  private _identityDocument?: IdentityDocument;
  private _bankDetails?: BankDetails | null;
  private _customFields?: CustomFields;
  private _registrationDate?: Date;
  private _leaveDate?: Date | null;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor(
    id: MemberId,
    memberTypeId: MemberTypeId,
    currentStatus: MemberStatus,
    statusHistory: StatusHistory[],
    version: number,
    memberNumber?: MemberNumber,
    personalData?: PersonalData,
    contactData?: ContactData,
    identityDocument?: IdentityDocument,
    bankDetails?: BankDetails | null,
    customFields?: CustomFields,
    registrationDate?: Date,
    leaveDate?: Date | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);
    this._memberTypeId = memberTypeId;
    this._currentStatus = currentStatus;
    this._statusHistory = statusHistory;
    this._version = version;
    this._memberNumber = memberNumber;
    this._personalData = personalData;
    this._contactData = contactData;
    this._identityDocument = identityDocument;
    this._bankDetails = bankDetails;
    this._customFields = customFields;
    this._registrationDate = registrationDate;
    this._leaveDate = leaveDate;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters ---

  get memberTypeId(): MemberTypeId {
    return this._memberTypeId;
  }

  get version(): number {
    return this._version;
  }

  get memberNumber(): MemberNumber | undefined {
    return this._memberNumber;
  }

  get personalData(): PersonalData | undefined {
    return this._personalData;
  }

  get contactData(): ContactData | undefined {
    return this._contactData;
  }

  get identityDocument(): IdentityDocument | undefined {
    return this._identityDocument;
  }

  get bankDetails(): BankDetails | null | undefined {
    return this._bankDetails;
  }

  get customFields(): CustomFields | undefined {
    return this._customFields;
  }

  get registrationDate(): Date | undefined {
    return this._registrationDate;
  }

  get leaveDate(): Date | null | undefined {
    return this._leaveDate;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  /** Devuelve el estado actual del socio. */
  getCurrentStatus(): MemberStatus {
    return this._currentStatus;
  }

  /** Devuelve el historial de cambios de estado (copia inmutable). */
  getStatusHistory(): ReadonlyArray<StatusHistory> {
    return [...this._statusHistory];
  }

  /** Indica si el socio está activo. */
  isActive(): boolean {
    return this._currentStatus.equals(MemberStatus.ACTIVE);
  }

  /** Indica si el socio está en buen estado (ACTIVE o APPLICANT). */
  isInGoodStanding(): boolean {
    return (
      this._currentStatus.equals(MemberStatus.ACTIVE) ||
      this._currentStatus.equals(MemberStatus.APPLICANT)
    );
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo Member con estado APPLICANT, versión 0 e historial vacío.
   * (Task 5 — retrocompatible, NO modificar.)
   */
  static create(props: CreateMemberProps): Member {
    const id = MemberId.create();
    return new Member(id, props.memberTypeId, MemberStatus.APPLICANT, [], 0);
  }

  /**
   * Registra un nuevo Member con ficha completa (Task 6).
   * Genera UUID, establece registrationDate, crea primera entrada en StatusHistory,
   * y emite MemberRegisteredEvent.
   */
  static register(props: RegisterMemberProps): Result<Member, Error> {
    const id = MemberId.create();
    const status = props.initialStatus ?? MemberStatus.ACTIVE;
    const now = new Date();

    // Crear primera entrada de historial (alta inicial)
    const reasonResult = StatusChangeReason.create('Alta inicial de socio');
    if (!reasonResult.ok) {
      return { ok: false, error: reasonResult.error };
    }

    const historyResult = StatusHistory.create({
      memberId: id,
      previousStatus: MemberStatus.APPLICANT,
      newStatus: status,
      reason: reasonResult.value,
      changedBy: 'SYSTEM',
      changedAt: now,
    });

    // Si el estado inicial es APPLICANT, no crear historial (mismo estado)
    const statusHistory: StatusHistory[] = [];
    if (!status.equals(MemberStatus.APPLICANT) && historyResult.ok) {
      statusHistory.push(historyResult.value);
    }

    const member = new Member(
      id,
      props.memberTypeId,
      status,
      statusHistory,
      0,
      props.memberNumber,
      props.personalData,
      props.contactData,
      props.identityDocument,
      props.bankDetails,
      props.customFields,
      now,
      null,
      now,
      now,
    );

    // Emitir evento MemberRegistered
    member.addDomainEvent(
      new MemberRegisteredEvent({
        memberId: id.toValue(),
        memberNumber: props.memberNumber.value,
        name: props.personalData.name,
        surnames: props.personalData.surnames,
        email: props.contactData.email,
        memberTypeId: props.memberTypeId.toValue(),
        registrationDate: now,
        iban: props.bankDetails?.iban,
      }),
    );

    return { ok: true, value: member };
  }

  /**
   * Reconstituye un Member desde persistencia sin emitir eventos ni validar.
   */
  static reconstitute(props: ReconstituteMemberProps): Member {
    return new Member(
      props.id,
      props.memberTypeId,
      props.currentStatus,
      [...props.statusHistory],
      props.version,
      props.memberNumber,
      props.personalData,
      props.contactData,
      props.identityDocument,
      props.bankDetails,
      props.customFields,
      props.registrationDate,
      props.leaveDate,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Métodos de negocio (Task 5) ---

  /**
   * Cambia el estado del socio validando la transición.
   * 1. Delega validación al StatusTransitionValidator
   * 2. Si válido: actualiza estado, crea entrada de historial, incrementa versión, emite evento
   * 3. Si inválido: retorna error sin modificar nada
   */
  changeStatus(
    newStatus: MemberStatus,
    reason: StatusChangeReason,
    changedBy: string,
    transitionValidator: StatusTransitionValidator,
  ): Result<void, TransitionNotAllowedError> {
    // Validar la transición
    const validationResult = transitionValidator.validate(this._currentStatus, newStatus);
    if (!validationResult.ok) {
      return validationResult;
    }

    const previousStatus = this._currentStatus;
    const now = new Date();

    // Crear entrada de historial
    const historyResult = StatusHistory.create({
      memberId: this._id,
      previousStatus,
      newStatus,
      reason,
      changedBy,
      changedAt: now,
    });

    if (!historyResult.ok) {
      return {
        ok: false,
        error: new TransitionNotAllowedError(previousStatus.value, newStatus.value),
      };
    }

    // Actualizar estado
    this._currentStatus = newStatus;
    this._statusHistory.push(historyResult.value);
    this._version += 1;
    this._updatedAt = now;

    // Emitir evento de dominio
    this.addDomainEvent(
      new MemberStatusChangedEvent({
        memberId: this._id.toValue(),
        previousStatus: previousStatus.value,
        newStatus: newStatus.value,
        reason: reason.value,
        changedBy,
        changedAt: now,
      }),
    );

    return { ok: true, value: undefined };
  }

  // --- Métodos de negocio (Task 6) ---

  /**
   * Actualiza los datos personales del socio.
   * Invariante: no permite cambiar identityDocument (se gestiona por separado).
   * Emite MemberDataUpdatedEvent.
   */
  updatePersonalData(newData: PersonalData): void {
    this._personalData = newData;
    this._version += 1;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MemberDataUpdatedEvent({
        memberId: this._id.toValue(),
        modifiedFields: ['personalData'],
        ibanChanged: false,
        updateDate: new Date(),
      }),
    );
  }

  /**
   * Actualiza los datos de contacto del socio.
   * Emite MemberDataUpdatedEvent con newEmail si cambió.
   */
  updateContactData(newContactData: ContactData): void {
    const emailChanged = this._contactData?.email !== newContactData.email;
    this._contactData = newContactData;
    this._version += 1;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MemberDataUpdatedEvent({
        memberId: this._id.toValue(),
        modifiedFields: ['contactData'],
        newEmail: emailChanged ? newContactData.email : undefined,
        ibanChanged: false,
        updateDate: new Date(),
      }),
    );
  }

  /**
   * Actualiza los datos bancarios del socio.
   * Emite MemberDataUpdatedEvent con ibanChanged=true.
   */
  updateBankDetails(newBankDetails: BankDetails): void {
    this._bankDetails = newBankDetails;
    this._version += 1;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MemberDataUpdatedEvent({
        memberId: this._id.toValue(),
        modifiedFields: ['bankDetails'],
        newIban: newBankDetails.iban,
        ibanChanged: true,
        updateDate: new Date(),
      }),
    );
  }

  /**
   * Actualiza los campos personalizados del socio.
   */
  updateCustomFields(newFields: CustomFields): void {
    this._customFields = newFields;
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * Calcula la antigüedad del socio desde la fecha de registro.
   * @returns Antigüedad en años y meses.
   */
  calculateSeniority(): { years: number; months: number } {
    if (!this._registrationDate) {
      return { years: 0, months: 0 };
    }

    const now = new Date();
    let years = now.getFullYear() - this._registrationDate.getFullYear();
    let months = now.getMonth() - this._registrationDate.getMonth();

    if (now.getDate() < this._registrationDate.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years: Math.max(0, years), months: Math.max(0, months) };
  }
}
