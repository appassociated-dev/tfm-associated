import { AggregateRoot } from '../../../shared/domain';
import { FeePlanId } from '../value-objects/fee-plan-id';
import { FeePlanCode, FeePlanCodeInvalidError } from '../value-objects/fee-plan-code';
import { Money, MoneyInvalidError } from '../value-objects/money';
import { Frequency } from '../value-objects/frequency';
import { PlanType } from '../value-objects/plan-type';
import { BillingMonths, BillingMonthsInvalidError } from '../value-objects/billing-months';
import { FeePlanCreatedEvent } from '../events/fee-plan-created.event';
import { FeePlanModifiedEvent } from '../events/fee-plan-modified.event';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear un nuevo FeePlan via factory method. */
export interface CreateFeePlanProps {
  code: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  amount: number;
  billingMonths: number[];
  tenantId: string;
}

/** Propiedades para actualizar un FeePlan existente. */
export interface UpdateFeePlanProps {
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  amount: number;
  billingMonths: number[];
}

/** Propiedades completas para reconstituir un FeePlan desde persistencia. */
export interface ReconstituteFeePlanProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  amount: number;
  billingMonths: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root que representa un plan de cuota en el sistema.
 * Define el importe, frecuencia y condiciones de cobro para suscripciones de socios.
 *
 * Invariantes:
 * - RECURRING requiere billingMonths no vacío.
 * - ONE_TIME requiere billingMonths vacío.
 */
export class FeePlan extends AggregateRoot<FeePlanId> {
  private _code: FeePlanCode;
  private _name: string;
  private _description: string | null;
  private _type: PlanType;
  private _frequency: Frequency;
  private _amount: Money;
  private _billingMonths: BillingMonths;
  private _active: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: FeePlanId,
    code: FeePlanCode,
    name: string,
    description: string | null,
    type: PlanType,
    frequency: Frequency,
    amount: Money,
    billingMonths: BillingMonths,
    active: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._code = code;
    this._name = name;
    this._description = description;
    this._type = type;
    this._frequency = frequency;
    this._amount = amount;
    this._billingMonths = billingMonths;
    this._active = active;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters ---

  get code(): FeePlanCode {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get type(): PlanType {
    return this._type;
  }

  get frequency(): Frequency {
    return this._frequency;
  }

  get amount(): Money {
    return this._amount;
  }

  get billingMonths(): BillingMonths {
    return this._billingMonths;
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
   * Crea un nuevo FeePlan con validación de invariantes.
   * Genera UUID, valida VOs, establece active=true y emite FeePlanCreatedEvent.
   */
  static create(
    props: CreateFeePlanProps,
  ): Result<
    FeePlan,
    FeePlanCodeInvalidError | MoneyInvalidError | BillingMonthsInvalidError | Error
  > {
    // Validar nombre no vacío
    if (!props.name || props.name.trim().length === 0) {
      return { ok: false, error: new Error('El nombre del plan de cuota no puede estar vacío.') };
    }

    // Validar código
    const codeResult = FeePlanCode.create(props.code);
    if (!codeResult.ok) {
      return { ok: false, error: codeResult.error };
    }

    // Validar tipo de plan
    let planType: PlanType;
    try {
      planType = PlanType.fromString(props.type);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar frecuencia
    let frequency: Frequency;
    try {
      frequency = Frequency.fromString(props.frequency);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar importe
    const amountResult = Money.create(props.amount);
    if (!amountResult.ok) {
      return { ok: false, error: amountResult.error };
    }

    // Validar meses de facturación
    const billingMonthsResult = BillingMonths.create(props.billingMonths);
    if (!billingMonthsResult.ok) {
      return { ok: false, error: billingMonthsResult.error };
    }

    // Invariante: RECURRING requiere billingMonths no vacío
    if (planType.equals(PlanType.RECURRING) && billingMonthsResult.value.isEmpty()) {
      return {
        ok: false,
        error: new Error('Un plan recurrente (RECURRING) requiere al menos un mes de facturación.'),
      };
    }

    // Invariante: ONE_TIME requiere billingMonths vacío
    if (planType.equals(PlanType.ONE_TIME) && !billingMonthsResult.value.isEmpty()) {
      return {
        ok: false,
        error: new Error('Un plan de pago único (ONE_TIME) no debe tener meses de facturación.'),
      };
    }

    const now = new Date();
    const feePlanId = FeePlanId.create();

    const feePlan = new FeePlan(
      feePlanId,
      codeResult.value,
      props.name,
      props.description,
      planType,
      frequency,
      amountResult.value,
      billingMonthsResult.value,
      true, // active
      now,
      now,
    );

    // Emitir evento de dominio
    feePlan.addDomainEvent(
      new FeePlanCreatedEvent({
        payload: {
          feePlanId: feePlanId.toValue(),
          code: codeResult.value.value,
          name: props.name,
          type: planType.value,
          amount: props.amount,
          tenantId: props.tenantId,
        },
        aggregateId: feePlanId.toValue(),
        aggregateType: 'FeePlan',
        boundedContext: 'BC-Treasury',
      }),
    );

    return { ok: true, value: feePlan };
  }

  /**
   * Reconstituye un FeePlan desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: ReconstituteFeePlanProps): FeePlan {
    const id = FeePlanId.fromString(props.id);
    const codeResult = FeePlanCode.create(props.code);
    const planType = PlanType.fromString(props.type);
    const frequency = Frequency.fromString(props.frequency);
    const amountResult = Money.create(props.amount);
    const billingMonthsResult = BillingMonths.create(props.billingMonths);

    return new FeePlan(
      id,
      codeResult.ok
        ? codeResult.value
        : (() => {
            throw codeResult.error;
          })(),
      props.name,
      props.description,
      planType,
      frequency,
      amountResult.ok
        ? amountResult.value
        : (() => {
            throw amountResult.error;
          })(),
      billingMonthsResult.ok
        ? billingMonthsResult.value
        : (() => {
            throw billingMonthsResult.error;
          })(),
      props.active,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Actualiza las propiedades del FeePlan con validación de invariantes.
   * No modifica el código (es inmutable después de la creación).
   * Emite FeePlanModifiedEvent.
   */
  update(
    props: UpdateFeePlanProps,
  ): Result<void, MoneyInvalidError | BillingMonthsInvalidError | Error> {
    // Validar nombre no vacío
    if (!props.name || props.name.trim().length === 0) {
      return { ok: false, error: new Error('El nombre del plan de cuota no puede estar vacío.') };
    }

    // Validar tipo de plan
    let planType: PlanType;
    try {
      planType = PlanType.fromString(props.type);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar frecuencia
    let frequency: Frequency;
    try {
      frequency = Frequency.fromString(props.frequency);
    } catch (e) {
      return { ok: false, error: e as Error };
    }

    // Validar importe
    const amountResult = Money.create(props.amount);
    if (!amountResult.ok) {
      return { ok: false, error: amountResult.error };
    }

    // Validar meses de facturación
    const billingMonthsResult = BillingMonths.create(props.billingMonths);
    if (!billingMonthsResult.ok) {
      return { ok: false, error: billingMonthsResult.error };
    }

    // Invariante: RECURRING requiere billingMonths no vacío
    if (planType.equals(PlanType.RECURRING) && billingMonthsResult.value.isEmpty()) {
      return {
        ok: false,
        error: new Error('Un plan recurrente (RECURRING) requiere al menos un mes de facturación.'),
      };
    }

    // Invariante: ONE_TIME requiere billingMonths vacío
    if (planType.equals(PlanType.ONE_TIME) && !billingMonthsResult.value.isEmpty()) {
      return {
        ok: false,
        error: new Error('Un plan de pago único (ONE_TIME) no debe tener meses de facturación.'),
      };
    }

    // Aplicar cambios
    this._name = props.name;
    this._description = props.description;
    this._type = planType;
    this._frequency = frequency;
    this._amount = amountResult.value;
    this._billingMonths = billingMonthsResult.value;
    this._updatedAt = new Date();

    // Emitir evento de modificación
    this.addDomainEvent(
      new FeePlanModifiedEvent({
        payload: {
          feePlanId: this._id.toValue(),
          code: this._code.value,
          name: this._name,
          type: planType.value,
          amount: props.amount,
        },
        aggregateId: this._id.toValue(),
        aggregateType: 'FeePlan',
        boundedContext: 'BC-Treasury',
      }),
    );

    return { ok: true, value: undefined };
  }

  /** Desactiva el plan de cuota. */
  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  /** Activa el plan de cuota. */
  activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  /** Indica si el plan es de tipo recurrente. */
  isRecurring(): boolean {
    return this._type.equals(PlanType.RECURRING);
  }

  /** Indica si el plan es de pago único. */
  isOneTime(): boolean {
    return this._type.equals(PlanType.ONE_TIME);
  }

  /**
   * Evalúa si se debe generar un cargo para un mes determinado.
   * Solo aplica a planes recurrentes — los de pago único devuelven false.
   * @param month Mes a evaluar (1-12).
   */
  shouldGenerateChargeForMonth(month: number): boolean {
    if (!this.isRecurring()) {
      return false;
    }
    if (!this._active) {
      return false;
    }
    return this._billingMonths.includesMonth(month);
  }
}
