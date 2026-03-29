import { AggregateRoot } from '../../../shared/domain';
import { CollectivityType } from '../../../identity/domain/value-objects/collectivity-type';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberTypeCode, MemberTypeCodeInvalidError } from '../value-objects/member-type-code';
import { AgeRange, AgeRangeInvalidError } from '../value-objects/age-range';
import { RulesConfig, RulesConfigInvalidError } from '../value-objects/rules-config';
import { MemberTypeCreatedEvent } from '../events/member-type-created.event';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear un nuevo MemberType via factory method. */
export interface CreateMemberTypeProps {
  code: string;
  name: string;
  description: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  votingRight: boolean;
  eligibleForOffice: boolean;
  minimumSeniorityForVoting: number;
  minimumSeniorityForOffice: number;
  automaticTransitionTargetId: string | null;
  rulesConfig: object;
  collectivityType: string;
  tenantId: string;
}

/** Propiedades para actualizar un MemberType existente. */
export interface UpdateMemberTypeProps {
  name: string;
  description: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  votingRight: boolean;
  eligibleForOffice: boolean;
  minimumSeniorityForVoting: number;
  minimumSeniorityForOffice: number;
  automaticTransitionTargetId: string | null;
  rulesConfig: object;
  collectivityType: string;
}

/** Propiedades completas para reconstituir un MemberType desde persistencia. */
export interface ReconstituteMemberTypeProps {
  id: string;
  code: string;
  name: string;
  description: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  votingRight: boolean;
  eligibleForOffice: boolean;
  minimumSeniorityForVoting: number;
  minimumSeniorityForOffice: number;
  automaticTransitionTargetId: string | null;
  rulesConfig: object;
  collectivityType: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root que representa un tipo de socio en el sistema.
 * Define las reglas y requisitos para una categoría de socios.
 */
export class MemberType extends AggregateRoot<MemberTypeId> {
  private _code: MemberTypeCode;
  private _name: string;
  private _description: string;
  private _ageRange: AgeRange;
  private _votingRight: boolean;
  private _eligibleForOffice: boolean;
  private _minimumSeniorityForVoting: number;
  private _minimumSeniorityForOffice: number;
  private _automaticTransitionTargetId: MemberTypeId | null;
  private _rulesConfig: RulesConfig;
  private _active: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: MemberTypeId,
    code: MemberTypeCode,
    name: string,
    description: string,
    ageRange: AgeRange,
    votingRight: boolean,
    eligibleForOffice: boolean,
    minimumSeniorityForVoting: number,
    minimumSeniorityForOffice: number,
    automaticTransitionTargetId: MemberTypeId | null,
    rulesConfig: RulesConfig,
    active: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._code = code;
    this._name = name;
    this._description = description;
    this._ageRange = ageRange;
    this._votingRight = votingRight;
    this._eligibleForOffice = eligibleForOffice;
    this._minimumSeniorityForVoting = minimumSeniorityForVoting;
    this._minimumSeniorityForOffice = minimumSeniorityForOffice;
    this._automaticTransitionTargetId = automaticTransitionTargetId;
    this._rulesConfig = rulesConfig;
    this._active = active;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters ---

  get code(): MemberTypeCode {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get ageRange(): AgeRange {
    return this._ageRange;
  }

  get votingRight(): boolean {
    return this._votingRight;
  }

  get eligibleForOffice(): boolean {
    return this._eligibleForOffice;
  }

  get minimumSeniorityForVoting(): number {
    return this._minimumSeniorityForVoting;
  }

  get minimumSeniorityForOffice(): number {
    return this._minimumSeniorityForOffice;
  }

  get automaticTransitionTargetId(): MemberTypeId | null {
    return this._automaticTransitionTargetId;
  }

  get rulesConfig(): RulesConfig {
    return this._rulesConfig;
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
   * Crea un nuevo MemberType con validación de invariantes.
   * Genera UUID, valida VOs, establece active=true y emite MemberTypeCreated.
   */
  static create(
    props: CreateMemberTypeProps,
  ): Result<
    MemberType,
    MemberTypeCodeInvalidError | AgeRangeInvalidError | RulesConfigInvalidError | Error
  > {
    // Validar nombre no vacío
    if (!props.name || props.name.trim().length === 0) {
      return { ok: false, error: new Error('El nombre del tipo de socio no puede estar vacío.') };
    }

    // Validar código
    const codeResult = MemberTypeCode.create(props.code);
    if (!codeResult.ok) {
      return { ok: false, error: codeResult.error };
    }

    // Validar rango de edad
    const ageRangeResult = AgeRange.create(props.ageRangeMin, props.ageRangeMax);
    if (!ageRangeResult.ok) {
      return { ok: false, error: ageRangeResult.error };
    }

    // Validar tipo de colectividad
    let collectivityType: CollectivityType;
    try {
      collectivityType = CollectivityType.fromString(props.collectivityType);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar configuración de reglas
    const rulesConfigResult = RulesConfig.create(props.rulesConfig, collectivityType);
    if (!rulesConfigResult.ok) {
      return { ok: false, error: rulesConfigResult.error };
    }

    // Validar invariante: minimumSeniorityForVoting <= minimumSeniorityForOffice
    if (
      props.minimumSeniorityForVoting > 0 &&
      props.minimumSeniorityForOffice > 0 &&
      props.minimumSeniorityForVoting > props.minimumSeniorityForOffice
    ) {
      return {
        ok: false,
        error: new Error(
          'La antigüedad mínima para voto no puede ser mayor que la antigüedad mínima para cargo.',
        ),
      };
    }

    // Construir automaticTransitionTargetId
    let transitionTargetId: MemberTypeId | null = null;
    if (props.automaticTransitionTargetId) {
      try {
        transitionTargetId = MemberTypeId.fromString(props.automaticTransitionTargetId);
      } catch (e) {
        return { ok: false, error: e as Error };
      }
    }

    const now = new Date();
    const memberTypeId = MemberTypeId.create();

    const memberType = new MemberType(
      memberTypeId,
      codeResult.value,
      props.name,
      props.description,
      ageRangeResult.value,
      props.votingRight,
      props.eligibleForOffice,
      props.minimumSeniorityForVoting,
      props.minimumSeniorityForOffice,
      transitionTargetId,
      rulesConfigResult.value,
      true, // active
      now,
      now,
    );

    // Emitir evento de dominio
    memberType.addDomainEvent(
      new MemberTypeCreatedEvent({
        payload: {
          memberTypeId: memberTypeId.toValue(),
          code: codeResult.value.value,
          name: props.name,
          description: props.description,
          tenantId: props.tenantId,
        },
        aggregateId: memberTypeId.toValue(),
        aggregateType: 'MemberType',
        boundedContext: 'BC-Membership',
      }),
    );

    return { ok: true, value: memberType };
  }

  /**
   * Reconstituye un MemberType desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: ReconstituteMemberTypeProps): MemberType {
    const id = MemberTypeId.fromString(props.id);
    const codeResult = MemberTypeCode.create(props.code);
    const ageRangeResult = AgeRange.create(props.ageRangeMin, props.ageRangeMax);
    const collectivityType = CollectivityType.fromString(props.collectivityType);
    const rulesConfigResult = RulesConfig.create(props.rulesConfig, collectivityType);

    let transitionTargetId: MemberTypeId | null = null;
    if (props.automaticTransitionTargetId) {
      transitionTargetId = MemberTypeId.fromString(props.automaticTransitionTargetId);
    }

    return new MemberType(
      id,
      codeResult.ok
        ? codeResult.value
        : (() => {
            throw codeResult.error;
          })(),
      props.name,
      props.description,
      ageRangeResult.ok
        ? ageRangeResult.value
        : (() => {
            throw ageRangeResult.error;
          })(),
      props.votingRight,
      props.eligibleForOffice,
      props.minimumSeniorityForVoting,
      props.minimumSeniorityForOffice,
      transitionTargetId,
      rulesConfigResult.ok
        ? rulesConfigResult.value
        : (() => {
            throw rulesConfigResult.error;
          })(),
      props.active,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Actualiza las propiedades del MemberType con validación de invariantes.
   * No modifica el código (es inmutable después de la creación).
   */
  update(
    props: UpdateMemberTypeProps,
  ): Result<void, AgeRangeInvalidError | RulesConfigInvalidError | Error> {
    // Validar nombre no vacío
    if (!props.name || props.name.trim().length === 0) {
      return { ok: false, error: new Error('El nombre del tipo de socio no puede estar vacío.') };
    }

    // Validar rango de edad
    const ageRangeResult = AgeRange.create(props.ageRangeMin, props.ageRangeMax);
    if (!ageRangeResult.ok) {
      return { ok: false, error: ageRangeResult.error };
    }

    // Validar tipo de colectividad
    let collectivityType: CollectivityType;
    try {
      collectivityType = CollectivityType.fromString(props.collectivityType);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar configuración de reglas
    const rulesConfigResult = RulesConfig.create(props.rulesConfig, collectivityType);
    if (!rulesConfigResult.ok) {
      return { ok: false, error: rulesConfigResult.error };
    }

    // Validar invariante: minimumSeniorityForVoting <= minimumSeniorityForOffice
    if (
      props.minimumSeniorityForVoting > 0 &&
      props.minimumSeniorityForOffice > 0 &&
      props.minimumSeniorityForVoting > props.minimumSeniorityForOffice
    ) {
      return {
        ok: false,
        error: new Error(
          'La antigüedad mínima para voto no puede ser mayor que la antigüedad mínima para cargo.',
        ),
      };
    }

    // Construir automaticTransitionTargetId
    let transitionTargetId: MemberTypeId | null = null;
    if (props.automaticTransitionTargetId) {
      try {
        transitionTargetId = MemberTypeId.fromString(props.automaticTransitionTargetId);
      } catch (e) {
        return { ok: false, error: e as Error };
      }
    }

    // Aplicar cambios
    this._name = props.name;
    this._description = props.description;
    this._ageRange = ageRangeResult.value;
    this._votingRight = props.votingRight;
    this._eligibleForOffice = props.eligibleForOffice;
    this._minimumSeniorityForVoting = props.minimumSeniorityForVoting;
    this._minimumSeniorityForOffice = props.minimumSeniorityForOffice;
    this._automaticTransitionTargetId = transitionTargetId;
    this._rulesConfig = rulesConfigResult.value;
    this._updatedAt = new Date();

    return { ok: true, value: undefined };
  }

  /** Desactiva el tipo de socio. */
  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /**
   * Evalúa si una edad puede ser aceptada por este tipo de socio.
   * @param age Edad a evaluar.
   */
  canAcceptAge(age: number): boolean {
    return this._ageRange.includes(age);
  }

  /**
   * Evalúa si un socio con la antigüedad dada tiene derecho a voto.
   * @param seniorityMonths Antigüedad en meses del socio.
   */
  hasVotingRight(seniorityMonths: number): boolean {
    if (!this._votingRight) {
      return false;
    }
    return seniorityMonths >= this._minimumSeniorityForVoting;
  }

  /**
   * Evalúa si un socio con la antigüedad dada es elegible para cargo.
   * @param seniorityMonths Antigüedad en meses del socio.
   */
  isEligibleForOffice(seniorityMonths: number): boolean {
    if (!this._eligibleForOffice) {
      return false;
    }
    return seniorityMonths >= this._minimumSeniorityForOffice;
  }
}
