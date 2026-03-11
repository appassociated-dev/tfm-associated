import { AggregateRoot } from '../../../shared/domain';
import { MemberAccountId } from '../value-objects/member-account-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { PlanType } from '../value-objects/plan-type';
import { Money } from '../value-objects/money';
import { Discount } from '../value-objects/discount';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';
import { FeeSubscription } from '../entities/fee-subscription';
import { SubscriptionCreatedEvent } from '../events/subscription-created.event';
import { SubscriptionModifiedEvent } from '../events/subscription-modified.event';
import { SubscriptionClosedEvent } from '../events/subscription-closed.event';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Propiedades para crear una nueva cuenta de socio. */
export interface CreateMemberAccountProps {
  memberId: string;
  tenantId: string;
}

/** Propiedades para reconstituir una cuenta de socio desde persistencia. */
export interface ReconstituteMemberAccountProps {
  id: string;
  memberId: string;
  tenantId: string;
  subscriptions: FeeSubscription[];
  createdAt: Date;
}

/**
 * Aggregate Root que representa la cuenta de tesorería de un socio.
 * Contiene las suscripciones a planes de cuota y gestiona sus invariantes.
 *
 * Invariantes:
 * - Solo puede existir una suscripción periódica activa a la vez.
 * - El memberId no puede estar vacío.
 */
export class MemberAccount extends AggregateRoot<MemberAccountId> {
  private _memberId: string;
  private _tenantId: string;
  private _subscriptions: FeeSubscription[];
  private _createdAt: Date;

  private constructor(
    id: MemberAccountId,
    memberId: string,
    tenantId: string,
    subscriptions: FeeSubscription[],
    createdAt: Date,
  ) {
    super(id);
    this._memberId = memberId;
    this._tenantId = tenantId;
    this._subscriptions = subscriptions;
    this._createdAt = createdAt;
  }

  // --- Getters ---

  get memberId(): string {
    return this._memberId;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get subscriptions(): ReadonlyArray<FeeSubscription> {
    return this._subscriptions;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // --- Factory Methods ---

  /**
   * Crea una nueva cuenta de socio.
   * Valida que el memberId no esté vacío y genera un nuevo MemberAccountId.
   */
  static create(props: CreateMemberAccountProps): Result<MemberAccount, Error> {
    if (!props.memberId || props.memberId.trim().length === 0) {
      return {
        ok: false,
        error: new Error('El identificador del socio (memberId) no puede estar vacío.'),
      };
    }

    if (!props.tenantId || props.tenantId.trim().length === 0) {
      return {
        ok: false,
        error: new Error('El identificador del tenant (tenantId) no puede estar vacío.'),
      };
    }

    const id = MemberAccountId.create();
    const now = new Date();

    return {
      ok: true,
      value: new MemberAccount(id, props.memberId, props.tenantId, [], now),
    };
  }

  /**
   * Reconstituye una cuenta de socio desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: ReconstituteMemberAccountProps): MemberAccount {
    const id = MemberAccountId.fromString(props.id);

    return new MemberAccount(
      id,
      props.memberId,
      props.tenantId,
      props.subscriptions,
      props.createdAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Añade una suscripción a la cuenta del socio.
   * Si el plan es RECURRING, verifica que no exista otra suscripción periódica activa.
   */
  addSubscription(subscription: FeeSubscription, planType: PlanType): Result<void, Error> {
    // Invariante: solo una suscripción periódica activa
    if (planType.equals(PlanType.RECURRING) && this.getActivePeriodicSubscription() !== null) {
      return {
        ok: false,
        error: new Error('Ya existe una suscripción periódica activa.'),
      };
    }

    this._subscriptions.push(subscription);

    // Emitir evento de dominio
    this.addDomainEvent(
      new SubscriptionCreatedEvent({
        subscriptionId: subscription.id.toValue(),
        memberAccountId: this._id.toValue(),
        memberId: this._memberId,
        feePlanId: subscription.feePlanId.toValue(),
        registrationDate: subscription.registrationDate,
        effectiveAmount: subscription.effectiveAmount.amount,
        typeDiscount: subscription.discount.typeDiscount,
        personalDiscount: subscription.discount.personalDiscount,
        tenantId: this._tenantId,
      }),
    );

    return { ok: true, value: undefined };
  }

  /**
   * Cierra una suscripción existente con un motivo y fecha de baja.
   */
  closeSubscription(
    subscriptionId: SubscriptionId,
    reason: SubscriptionCancelReason,
    leaveDate: Date,
  ): Result<void, Error> {
    const subscription = this.findSubscriptionById(subscriptionId);
    if (!subscription) {
      return {
        ok: false,
        error: new Error(`No se encontró la suscripción con id: ${subscriptionId.toValue()}`),
      };
    }

    subscription.close(reason, leaveDate);

    // Emitir evento de dominio
    this.addDomainEvent(
      new SubscriptionClosedEvent({
        subscriptionId: subscriptionId.toValue(),
        memberAccountId: this._id.toValue(),
        cancelReason: reason.value,
        leaveDate,
        tenantId: this._tenantId,
      }),
    );

    return { ok: true, value: undefined };
  }

  /**
   * Cambia el plan de una suscripción activa por una nueva.
   * Cierra la suscripción actual con motivo PLAN_CHANGE y añade la nueva.
   */
  changePlan(
    currentSubscriptionId: SubscriptionId,
    newSubscription: FeeSubscription,
    effectiveDate: Date,
    planType: PlanType,
  ): Result<void, Error> {
    // Cerrar la suscripción actual
    const closeResult = this.closeSubscription(
      currentSubscriptionId,
      SubscriptionCancelReason.PLAN_CHANGE,
      effectiveDate,
    );
    if (!closeResult.ok) {
      return closeResult;
    }

    // Añadir la nueva suscripción (verificar invariante de RECURRING)
    const addResult = this.addSubscription(newSubscription, planType);
    if (!addResult.ok) {
      return addResult;
    }

    return { ok: true, value: undefined };
  }

  /**
   * Actualiza el descuento de una suscripción y recalcula su importe efectivo.
   */
  updateSubscriptionDiscount(
    subscriptionId: SubscriptionId,
    newDiscount: Discount,
    baseAmount: Money,
  ): Result<void, Error> {
    const subscription = this.findSubscriptionById(subscriptionId);
    if (!subscription) {
      return {
        ok: false,
        error: new Error(`No se encontró la suscripción con id: ${subscriptionId.toValue()}`),
      };
    }

    subscription.updateDiscount(newDiscount, baseAmount);

    // Emitir evento de dominio
    this.addDomainEvent(
      new SubscriptionModifiedEvent({
        subscriptionId: subscriptionId.toValue(),
        memberAccountId: this._id.toValue(),
        modifiedFields: ['discount', 'effectiveAmount'],
        modificationDate: new Date(),
        tenantId: this._tenantId,
      }),
    );

    return { ok: true, value: undefined };
  }

  /**
   * Devuelve la suscripción periódica activa (sin fecha de baja).
   * Solo puede haber una como máximo por invariante del aggregate.
   */
  getActivePeriodicSubscription(): FeeSubscription | null {
    return this._subscriptions.find((s) => s.isActive()) ?? null;
  }

  /**
   * Devuelve el historial completo de suscripciones ordenado por fecha de alta descendente.
   */
  getSubscriptionHistory(): ReadonlyArray<FeeSubscription> {
    return [...this._subscriptions].sort(
      (a, b) => b.registrationDate.getTime() - a.registrationDate.getTime(),
    );
  }

  /**
   * Busca una suscripción por su identificador.
   */
  findSubscriptionById(subscriptionId: SubscriptionId): FeeSubscription | null {
    return this._subscriptions.find((s) => s.id.equals(subscriptionId)) ?? null;
  }
}
