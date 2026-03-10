import { AggregateRoot } from '../../../shared/domain';
import { MemberId } from '../value-objects/member-id';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberStatus } from '../value-objects/member-status';
import { StatusChangeReason } from '../value-objects/status-change-reason';
import { StatusHistory } from '../entities/status-history';
import { StatusTransitionValidator } from '../services/status-transition-validator';
import { MemberStatusChangedEvent } from '../events/member-status-changed.event';
import { TransitionNotAllowedError } from '../exceptions/transition-not-allowed.exception';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear un nuevo Member via factory method. */
export interface CreateMemberProps {
  memberTypeId: MemberTypeId;
}

/** Propiedades completas para reconstituir un Member desde persistencia. */
export interface ReconstituteMemberProps {
  id: MemberId;
  memberTypeId: MemberTypeId;
  currentStatus: MemberStatus;
  statusHistory: StatusHistory[];
  version: number;
}

/**
 * Aggregate Root que representa un socio en el sistema.
 * Gestiona la máquina de estados del socio con historial de transiciones.
 */
export class Member extends AggregateRoot<MemberId> {
  private _memberTypeId: MemberTypeId;
  private _currentStatus: MemberStatus;
  private _statusHistory: StatusHistory[];
  private _version: number;

  private constructor(
    id: MemberId,
    memberTypeId: MemberTypeId,
    currentStatus: MemberStatus,
    statusHistory: StatusHistory[],
    version: number,
  ) {
    super(id);
    this._memberTypeId = memberTypeId;
    this._currentStatus = currentStatus;
    this._statusHistory = statusHistory;
    this._version = version;
  }

  // --- Getters ---

  get memberTypeId(): MemberTypeId {
    return this._memberTypeId;
  }

  get version(): number {
    return this._version;
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
   */
  static create(props: CreateMemberProps): Member {
    const id = MemberId.create();
    return new Member(id, props.memberTypeId, MemberStatus.APPLICANT, [], 0);
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
    );
  }

  // --- Métodos de negocio ---

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
}
