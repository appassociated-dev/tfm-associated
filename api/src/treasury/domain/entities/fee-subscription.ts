import { Entity } from '../../../shared/domain';
import { SubscriptionId } from '../value-objects/subscription-id';
import { FeePlanId } from '../value-objects/fee-plan-id';
import { Money } from '../value-objects/money';
import { Discount } from '../value-objects/discount';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';

/** Propiedades para crear una nueva suscripción de cuota. */
export interface CreateFeeSubscriptionProps {
  feePlanId: string;
  registrationDate: Date;
  discount: Discount;
  feePlanAmount: Money;
  personalDiscountReason: string | null;
}

/** Propiedades para reconstituir una suscripción desde persistencia. */
export interface ReconstituteFeeSubscriptionProps {
  id: string;
  feePlanId: string;
  registrationDate: Date;
  leaveDate: Date | null;
  typeDiscount: number;
  personalDiscount: number;
  personalDiscountReason: string | null;
  effectiveAmount: number;
  cancelReason: string | null;
  createdAt: Date;
}

/**
 * Entidad que representa la suscripción de un socio a un plan de cuota.
 * Pertenece al aggregate MemberAccount.
 *
 * Invariantes:
 * - El importe efectivo se calcula con descuento multiplicativo:
 *   effectiveAmount = baseAmount * (1 - typeDiscount) * (1 - personalDiscount)
 * - La fecha de baja debe ser igual o posterior a la fecha de alta.
 */
export class FeeSubscription extends Entity<SubscriptionId> {
  private _feePlanId: FeePlanId;
  private _registrationDate: Date;
  private _leaveDate: Date | null;
  private _discount: Discount;
  private _personalDiscountReason: string | null;
  private _effectiveAmount: Money;
  private _cancelReason: SubscriptionCancelReason | null;
  private _createdAt: Date;

  private constructor(
    id: SubscriptionId,
    feePlanId: FeePlanId,
    registrationDate: Date,
    leaveDate: Date | null,
    discount: Discount,
    personalDiscountReason: string | null,
    effectiveAmount: Money,
    cancelReason: SubscriptionCancelReason | null,
    createdAt: Date,
  ) {
    super(id);
    this._feePlanId = feePlanId;
    this._registrationDate = registrationDate;
    this._leaveDate = leaveDate;
    this._discount = discount;
    this._personalDiscountReason = personalDiscountReason;
    this._effectiveAmount = effectiveAmount;
    this._cancelReason = cancelReason;
    this._createdAt = createdAt;
  }

  // --- Getters ---

  get feePlanId(): FeePlanId {
    return this._feePlanId;
  }

  get registrationDate(): Date {
    return this._registrationDate;
  }

  get leaveDate(): Date | null {
    return this._leaveDate;
  }

  get discount(): Discount {
    return this._discount;
  }

  /** Motivo del descuento personalizado (para auditabilidad — RNFT-025). */
  get personalDiscountReason(): string | null {
    return this._personalDiscountReason;
  }

  get effectiveAmount(): Money {
    return this._effectiveAmount;
  }

  get cancelReason(): SubscriptionCancelReason | null {
    return this._cancelReason;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // --- Factory Methods ---

  /**
   * Crea una nueva suscripción de cuota.
   * Genera un nuevo SubscriptionId y calcula el importe efectivo
   * aplicando los descuentos de forma multiplicativa.
   */
  static create(props: CreateFeeSubscriptionProps): FeeSubscription {
    const subscriptionId = SubscriptionId.create();
    const feePlanId = FeePlanId.fromString(props.feePlanId);
    const effectiveAmount = props.discount.calculateEffectiveAmount(props.feePlanAmount);
    const now = new Date();

    return new FeeSubscription(
      subscriptionId,
      feePlanId,
      props.registrationDate,
      null, // leaveDate
      props.discount,
      props.personalDiscountReason,
      effectiveAmount,
      null, // cancelReason
      now,
    );
  }

  /**
   * Reconstituye una suscripción desde persistencia sin validación ni eventos.
   * Usado para hidratar la entidad desde el repositorio.
   */
  static reconstitute(props: ReconstituteFeeSubscriptionProps): FeeSubscription {
    const subscriptionId = SubscriptionId.fromString(props.id);
    const feePlanId = FeePlanId.fromString(props.feePlanId);

    // Crear Discount desde valores de persistencia
    const discountResult = Discount.create(props.typeDiscount, props.personalDiscount);
    if (!discountResult.ok) {
      throw discountResult.error;
    }

    // Crear Money desde importe efectivo
    const moneyResult = Money.create(props.effectiveAmount);
    if (!moneyResult.ok) {
      throw moneyResult.error;
    }

    // Crear motivo de cancelación si existe
    const cancelReason = props.cancelReason
      ? SubscriptionCancelReason.fromString(props.cancelReason)
      : null;

    return new FeeSubscription(
      subscriptionId,
      feePlanId,
      props.registrationDate,
      props.leaveDate,
      discountResult.value,
      props.personalDiscountReason,
      moneyResult.value,
      cancelReason,
      props.createdAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Cierra la suscripción con un motivo y fecha de baja.
   * @throws Error si la fecha de baja es anterior a la fecha de alta.
   */
  close(reason: SubscriptionCancelReason, leaveDate: Date): void {
    if (leaveDate < this._registrationDate) {
      throw new Error(
        'La fecha de baja no puede ser anterior a la fecha de alta de la suscripción.',
      );
    }
    this._leaveDate = leaveDate;
    this._cancelReason = reason;
  }

  /**
   * Actualiza el descuento y recalcula el importe efectivo.
   * @param newDiscount Nuevo descuento a aplicar.
   * @param baseAmount Importe base del plan para recalcular.
   */
  updateDiscount(newDiscount: Discount, baseAmount: Money): void {
    this._discount = newDiscount;
    this._effectiveAmount = newDiscount.calculateEffectiveAmount(baseAmount);
  }

  /** Indica si la suscripción está activa (sin fecha de baja). */
  isActive(): boolean {
    return this._leaveDate === null;
  }

  /** Indica si la suscripción está cerrada (con fecha de baja). */
  isClosed(): boolean {
    return this._leaveDate !== null;
  }
}
