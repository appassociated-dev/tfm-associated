import { Entity } from '../../../shared/domain';
import { FeePlanId } from '../value-objects/fee-plan-id';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear una nueva asignación MemberTypeFeePlan. */
export interface CreateMemberTypeFeePlanProps {
  memberTypeId: string;
  feePlanId: string;
  isDefault: boolean;
  order: number;
  active: boolean;
}

/** Propiedades completas para reconstituir un MemberTypeFeePlan desde persistencia. */
export interface ReconstituteMemberTypeFeePlanProps {
  memberTypeId: string;
  feePlanId: string;
  isDefault: boolean;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Clave compuesta que identifica la relación MemberType ↔ FeePlan.
 * Se usa como identidad de la entidad (PK compuesta).
 */
export class MemberTypeFeePlanKey {
  constructor(
    readonly memberTypeId: string,
    readonly feePlanId: string,
  ) {}

  equals(other?: MemberTypeFeePlanKey): boolean {
    if (!other) return false;
    return this.memberTypeId === other.memberTypeId && this.feePlanId === other.feePlanId;
  }
}

/**
 * Entidad que representa la asignación de un plan de cuota a un tipo de socio.
 * Permite definir plan por defecto, orden de presentación y activación.
 */
export class MemberTypeFeePlan extends Entity<MemberTypeFeePlanKey> {
  private _isDefault: boolean;
  private _order: number;
  private _active: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: MemberTypeFeePlanKey,
    isDefault: boolean,
    order: number,
    active: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._isDefault = isDefault;
    this._order = order;
    this._active = active;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters ---

  get memberTypeId(): string {
    return this._id.memberTypeId;
  }

  get feePlanId(): string {
    return this._id.feePlanId;
  }

  /** Devuelve el feePlanId como Value Object. */
  get feePlanIdVO(): FeePlanId {
    return FeePlanId.fromString(this._id.feePlanId);
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get order(): number {
    return this._order;
  }

  get active(): boolean {
    return this._active;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Factory Methods ---

  /**
   * Crea una nueva asignación de plan a tipo de socio.
   */
  static create(props: CreateMemberTypeFeePlanProps): MemberTypeFeePlan {
    const now = new Date();
    const key = new MemberTypeFeePlanKey(props.memberTypeId, props.feePlanId);

    return new MemberTypeFeePlan(key, props.isDefault, props.order, props.active, now, now);
  }

  /**
   * Reconstituye un MemberTypeFeePlan desde persistencia sin validar.
   */
  static reconstitute(props: ReconstituteMemberTypeFeePlanProps): MemberTypeFeePlan {
    const key = new MemberTypeFeePlanKey(props.memberTypeId, props.feePlanId);

    return new MemberTypeFeePlan(
      key,
      props.isDefault,
      props.order,
      props.active,
      props.createdAt,
      props.updatedAt,
    );
  }

  /** Desactiva esta asignación. */
  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /** Establece si esta asignación es la predeterminada. */
  setDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
    this._updatedAt = new Date();
  }
}
