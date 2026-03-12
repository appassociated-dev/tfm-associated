import { v4 as uuidV4 } from 'uuid';
import { MemberId } from '../value-objects/member-id';
import { MemberStatus } from '../value-objects/member-status';
import { StatusChangeReason } from '../value-objects/status-change-reason';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear una nueva entrada de historial de estado. */
export interface CreateStatusHistoryProps {
  memberId: MemberId;
  previousStatus: MemberStatus;
  newStatus: MemberStatus;
  reason: StatusChangeReason;
  changedBy: string;
  changedAt: Date;
}

/** Propiedades para reconstituir una entrada desde persistencia. */
export interface ReconstituteStatusHistoryProps extends CreateStatusHistoryProps {
  id: string;
}

/**
 * Entidad inmutable que representa una entrada en el historial de cambios de estado de un socio.
 * INSERT-only: no tiene métodos de modificación.
 */
export class StatusHistory {
  private readonly _id: string;
  private readonly _memberId: MemberId;
  private readonly _previousStatus: MemberStatus;
  private readonly _newStatus: MemberStatus;
  private readonly _reason: StatusChangeReason;
  private readonly _changedBy: string;
  private readonly _changedAt: Date;

  private constructor(
    id: string,
    memberId: MemberId,
    previousStatus: MemberStatus,
    newStatus: MemberStatus,
    reason: StatusChangeReason,
    changedBy: string,
    changedAt: Date,
  ) {
    this._id = id;
    this._memberId = memberId;
    this._previousStatus = previousStatus;
    this._newStatus = newStatus;
    this._reason = reason;
    this._changedBy = changedBy;
    this._changedAt = changedAt;
  }

  // --- Getters ---

  get id(): string {
    return this._id;
  }

  get memberId(): MemberId {
    return this._memberId;
  }

  get previousStatus(): MemberStatus {
    return this._previousStatus;
  }

  get newStatus(): MemberStatus {
    return this._newStatus;
  }

  get reason(): StatusChangeReason {
    return this._reason;
  }

  get changedBy(): string {
    return this._changedBy;
  }

  get changedAt(): Date {
    return this._changedAt;
  }

  // --- Factory Methods ---

  /**
   * Crea una nueva entrada de historial de estado con validación de invariantes.
   * Invariantes: previousStatus !== newStatus, changedAt <= now().
   */
  static create(props: CreateStatusHistoryProps): Result<StatusHistory, Error> {
    // Invariante: el estado previo y el nuevo deben ser diferentes
    if (props.previousStatus.equals(props.newStatus)) {
      return {
        ok: false,
        error: new Error(
          'previousStatus and newStatus must be different. Both are: ' + props.previousStatus.value,
        ),
      };
    }

    // Invariante: la fecha de cambio no puede ser futura
    const now = new Date();
    if (props.changedAt > now) {
      return {
        ok: false,
        error: new Error(
          'changedAt cannot be in the future. Received: ' + props.changedAt.toISOString(),
        ),
      };
    }

    return {
      ok: true,
      value: new StatusHistory(
        uuidV4(),
        props.memberId,
        props.previousStatus,
        props.newStatus,
        props.reason,
        props.changedBy,
        props.changedAt,
      ),
    };
  }

  /**
   * Reconstituye una entrada de historial desde persistencia sin validar invariantes.
   */
  static reconstitute(props: ReconstituteStatusHistoryProps): StatusHistory {
    return new StatusHistory(
      props.id,
      props.memberId,
      props.previousStatus,
      props.newStatus,
      props.reason,
      props.changedBy,
      props.changedAt,
    );
  }
}
