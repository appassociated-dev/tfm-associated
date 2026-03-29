import { AggregateRoot } from '../../../shared/domain';
import { FiscalYearId } from '../value-objects/fiscal-year-id';
import {
  FiscalYearPeriod,
  FiscalYearPeriodInvalidError,
} from '../value-objects/fiscal-year-period';
import { FiscalYearStatus } from '../value-objects/fiscal-year-status';
import { FiscalYearType } from '../value-objects/fiscal-year-type';
import { FiscalYearOpenedEvent } from '../events/fiscal-year-opened.event';
import { FiscalYearClosedEvent } from '../events/fiscal-year-closed.event';
import { FiscalYearInvalidTransitionError } from '../exceptions/fiscal-year-invalid-transition.exception';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear un nuevo FiscalYear via factory method. */
export interface CreateFiscalYearProps {
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  previousFiscalYearId: string | null;
}

/** Propiedades completas para reconstituir un FiscalYear desde persistencia. */
export interface ReconstituteFiscalYearProps {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  previousFiscalYearId: string | null;
  membersAtStart: number;
  membersAtEnd: number | null;
  reportId: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

/**
 * Aggregate Root que representa un ejercicio fiscal en el sistema.
 * Gestiona el ciclo de vida del ejercicio: preparación → apertura → cierre.
 */
export class FiscalYear extends AggregateRoot<FiscalYearId> {
  private _name: string;
  private _type: FiscalYearType;
  private _period: FiscalYearPeriod;
  private _status: FiscalYearStatus;
  private _previousFiscalYearId: FiscalYearId | null;
  private _membersAtStart: number;
  private _membersAtEnd: number | null;
  private _reportId: string | null;
  private _createdAt: Date;
  private _closedAt: Date | null;

  private constructor(
    id: FiscalYearId,
    name: string,
    type: FiscalYearType,
    period: FiscalYearPeriod,
    status: FiscalYearStatus,
    previousFiscalYearId: FiscalYearId | null,
    membersAtStart: number,
    membersAtEnd: number | null,
    reportId: string | null,
    createdAt: Date,
    closedAt: Date | null,
  ) {
    super(id);
    this._name = name;
    this._type = type;
    this._period = period;
    this._status = status;
    this._previousFiscalYearId = previousFiscalYearId;
    this._membersAtStart = membersAtStart;
    this._membersAtEnd = membersAtEnd;
    this._reportId = reportId;
    this._createdAt = createdAt;
    this._closedAt = closedAt;
  }

  // --- Getters ---

  get name(): string {
    return this._name;
  }

  get type(): FiscalYearType {
    return this._type;
  }

  get period(): FiscalYearPeriod {
    return this._period;
  }

  get status(): FiscalYearStatus {
    return this._status;
  }

  get previousFiscalYearId(): FiscalYearId | null {
    return this._previousFiscalYearId;
  }

  get membersAtStart(): number {
    return this._membersAtStart;
  }

  get membersAtEnd(): number | null {
    return this._membersAtEnd;
  }

  get reportId(): string | null {
    return this._reportId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get closedAt(): Date | null {
    return this._closedAt;
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo FiscalYear con validación de invariantes.
   * Genera UUID, valida VOs y establece estado inicial PREPARATION.
   * No emite evento de dominio en la creación.
   */
  static create(
    props: CreateFiscalYearProps,
  ): Result<FiscalYear, FiscalYearPeriodInvalidError | Error> {
    // Validar nombre no vacío
    if (!props.name || props.name.trim().length === 0) {
      return {
        ok: false,
        error: new Error('El nombre del ejercicio fiscal no puede estar vacío.'),
      };
    }

    // Validar y crear el periodo
    const periodResult = FiscalYearPeriod.create(props.startDate, props.endDate);
    if (!periodResult.ok) {
      return { ok: false, error: periodResult.error };
    }

    // Validar tipo de ejercicio fiscal
    let fiscalYearType: FiscalYearType;
    try {
      fiscalYearType = FiscalYearType.fromString(props.type);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Construir previousFiscalYearId
    let previousFiscalYearId: FiscalYearId | null = null;
    if (props.previousFiscalYearId) {
      try {
        previousFiscalYearId = FiscalYearId.fromString(props.previousFiscalYearId);
      } catch (e) {
        return { ok: false, error: e as Error };
      }
    }

    const now = new Date();
    const fiscalYearId = FiscalYearId.create();

    const fiscalYear = new FiscalYear(
      fiscalYearId,
      props.name,
      fiscalYearType,
      periodResult.value,
      FiscalYearStatus.PREPARATION,
      previousFiscalYearId,
      0, // membersAtStart
      null, // membersAtEnd
      null, // reportId
      now,
      null, // closedAt
    );

    return { ok: true, value: fiscalYear };
  }

  /**
   * Reconstituye un FiscalYear desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: ReconstituteFiscalYearProps): FiscalYear {
    const id = FiscalYearId.fromString(props.id);
    const fiscalYearType = FiscalYearType.fromString(props.type);
    const periodResult = FiscalYearPeriod.create(props.startDate, props.endDate);
    const status = FiscalYearStatus.fromString(props.status);

    let previousFiscalYearId: FiscalYearId | null = null;
    if (props.previousFiscalYearId) {
      previousFiscalYearId = FiscalYearId.fromString(props.previousFiscalYearId);
    }

    return new FiscalYear(
      id,
      props.name,
      fiscalYearType,
      periodResult.ok
        ? periodResult.value
        : (() => {
            throw periodResult.error;
          })(),
      status,
      previousFiscalYearId,
      props.membersAtStart,
      props.membersAtEnd,
      props.reportId,
      props.createdAt,
      props.closedAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Abre el ejercicio fiscal. Solo posible desde estado PREPARATION.
   * Establece el número de socios arrastrados y emite FiscalYearOpenedEvent.
   * @param carriedOverMembersCount Número de socios arrastrados del ejercicio anterior.
   */
  open(carriedOverMembersCount: number): void {
    if (!this._status.equals(FiscalYearStatus.PREPARATION)) {
      throw new FiscalYearInvalidTransitionError(this._status.value, 'OPEN');
    }

    this._status = FiscalYearStatus.OPEN;
    this._membersAtStart = carriedOverMembersCount;

    this.addDomainEvent(
      new FiscalYearOpenedEvent({
        payload: {
          fiscalYearId: this.id.toValue(),
          name: this._name,
          startDate: this._period.startDate,
          endDate: this._period.endDate,
          carriedOverMembers: carriedOverMembersCount,
          appliedTransitions: [],
        },
        aggregateId: this.id.toValue(),
        aggregateType: 'FiscalYear',
        boundedContext: 'BC-Membership',
      }),
    );
  }

  /**
   * Cierra el ejercicio fiscal. Solo posible desde estado OPEN.
   * Establece el número final de socios y emite FiscalYearClosedEvent.
   * @param membersAtEnd Número de socios al cierre del ejercicio.
   * @param warnings Advertencias reconocidas durante el cierre.
   */
  close(membersAtEnd: number, warnings: string[]): void {
    if (!this._status.equals(FiscalYearStatus.OPEN)) {
      throw new FiscalYearInvalidTransitionError(this._status.value, 'CLOSED');
    }

    this._status = FiscalYearStatus.CLOSED;
    this._membersAtEnd = membersAtEnd;
    this._closedAt = new Date();

    this.addDomainEvent(
      new FiscalYearClosedEvent({
        payload: {
          fiscalYearId: this.id.toValue(),
          name: this._name,
          membersAtEnd,
          closedAt: this._closedAt,
          warnings,
        },
        aggregateId: this.id.toValue(),
        aggregateType: 'FiscalYear',
        boundedContext: 'BC-Membership',
      }),
    );
  }

  /** Indica si el ejercicio fiscal está abierto. */
  isOpen(): boolean {
    return this._status.equals(FiscalYearStatus.OPEN);
  }

  /** Indica si el ejercicio fiscal está cerrado. */
  isClosed(): boolean {
    return this._status.equals(FiscalYearStatus.CLOSED);
  }
}
