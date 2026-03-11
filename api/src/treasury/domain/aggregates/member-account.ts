import { AggregateRoot } from '../../../shared/domain';
import { MemberAccountId } from '../value-objects/member-account-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { ChargeId } from '../value-objects/charge-id';
import { PlanType } from '../value-objects/plan-type';
import { Money } from '../value-objects/money';
import { Discount } from '../value-objects/discount';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { ChargeStatus } from '../value-objects/charge-status';
import { FeeSubscription } from '../entities/fee-subscription';
import { Charge } from '../entities/charge';
import { Payment } from '../entities/payment';
import { SubscriptionCreatedEvent } from '../events/subscription-created.event';
import { SubscriptionModifiedEvent } from '../events/subscription-modified.event';
import { SubscriptionClosedEvent } from '../events/subscription-closed.event';
import { PaymentRecordedEvent } from '../events/payment-recorded.event';

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
  charges?: Charge[];
  payments?: Payment[];
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
  private _charges: Charge[];
  private _payments: Payment[];
  private _createdAt: Date;

  private constructor(
    id: MemberAccountId,
    memberId: string,
    tenantId: string,
    subscriptions: FeeSubscription[],
    charges: Charge[],
    payments: Payment[],
    createdAt: Date,
  ) {
    super(id);
    this._memberId = memberId;
    this._tenantId = tenantId;
    this._subscriptions = subscriptions;
    this._charges = charges;
    this._payments = payments;
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

  get charges(): ReadonlyArray<Charge> {
    return this._charges;
  }

  get payments(): ReadonlyArray<Payment> {
    return this._payments;
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
      value: new MemberAccount(id, props.memberId, props.tenantId, [], [], [], now),
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
      props.charges ?? [],
      props.payments ?? [],
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

  // --- Métodos de cobro y pago ---

  /**
   * Registra un pago sobre un cargo existente de la cuenta.
   * Verifica que el cargo existe, no está PAID/CANCELLED, y que el importe no excede el restante.
   * Emite PaymentRecordedEvent tras éxito.
   */
  recordPayment(chargeId: ChargeId, payment: Payment): Result<void, Error> {
    // Buscar el cargo en la cuenta
    const charge = this.findChargeById(chargeId);
    if (!charge) {
      return {
        ok: false,
        error: new Error(`No se encontró el cargo con id: ${chargeId.toValue()}`),
      };
    }

    // Verificar que el cargo no está ya pagado ni cancelado
    if (charge.status.equals(ChargeStatus.PAID)) {
      return {
        ok: false,
        error: new Error(`El cargo ${chargeId.toValue()} ya está pagado (FE-4).`),
      };
    }
    if (charge.status.equals(ChargeStatus.CANCELLED)) {
      return {
        ok: false,
        error: new Error(`No se puede pagar un cargo cancelado (${chargeId.toValue()}).`),
      };
    }

    // Verificar que el importe no excede el restante (sobrepago FE-1)
    const remaining = charge.remainingAmount();
    if (payment.amount.amount > remaining.amount) {
      return {
        ok: false,
        error: new Error(
          `El importe del pago (${payment.amount.amount}) supera el pendiente (${remaining.amount}) del cargo ${chargeId.toValue()} (FE-1).`,
        ),
      };
    }

    // Registrar pago en el cargo (actualiza paidAmount y status)
    charge.recordPayment(payment.amount);

    // Añadir el pago a la lista de pagos de la cuenta
    this._payments.push(payment);

    // Emitir evento de dominio
    this.addDomainEvent(
      new PaymentRecordedEvent({
        paymentId: payment.id.toValue(),
        chargeId: chargeId.toValue(),
        memberAccountId: this._id.toValue(),
        memberId: this._memberId,
        amount: payment.amount.amount,
        paymentMethod: payment.paymentMethod.value,
        paymentDate: payment.paymentDate,
        paymentReference: payment.paymentReference.value,
        chargeNewStatus: charge.status.value,
      }),
    );

    return { ok: true, value: undefined };
  }

  /**
   * Registra pagos sobre múltiples cargos en una operación atómica (todo o nada).
   * Valida todos los cargos antes de aplicar cualquier pago.
   * Crea un Payment por cada cargo con los datos de pago compartidos.
   * Emite PaymentRecordedEvent por cada pago registrado.
   */
  recordMultiChargePayment(
    chargePayments: Array<{ chargeId: ChargeId; amount: Money }>,
    paymentData: {
      method: PaymentMethod;
      date: Date;
      reference: PaymentReference;
      notes: string | null;
      registeredBy: string;
    },
  ): Result<Payment[], Error> {
    // Fase 1: Validación de todos los cargos (sin modificar estado)
    const validatedCharges: Array<{ charge: Charge; amount: Money }> = [];

    for (const cp of chargePayments) {
      const charge = this.findChargeById(cp.chargeId);
      if (!charge) {
        return {
          ok: false,
          error: new Error(`No se encontró el cargo con id: ${cp.chargeId.toValue()}`),
        };
      }

      if (charge.status.equals(ChargeStatus.PAID)) {
        return {
          ok: false,
          error: new Error(`El cargo ${cp.chargeId.toValue()} ya está pagado (FE-4).`),
        };
      }

      if (charge.status.equals(ChargeStatus.CANCELLED)) {
        return {
          ok: false,
          error: new Error(`No se puede pagar un cargo cancelado (${cp.chargeId.toValue()}).`),
        };
      }

      const remaining = charge.remainingAmount();
      if (cp.amount.amount > remaining.amount) {
        return {
          ok: false,
          error: new Error(
            `El importe del pago (${cp.amount.amount}) supera el pendiente (${remaining.amount}) del cargo ${cp.chargeId.toValue()} (FE-1).`,
          ),
        };
      }

      validatedCharges.push({ charge, amount: cp.amount });
    }

    // Fase 2: Aplicar todos los pagos (ya validados)
    const createdPayments: Payment[] = [];

    for (const { charge, amount } of validatedCharges) {
      const payment = Payment.create({
        chargeId: charge.id,
        amount,
        paymentMethod: paymentData.method,
        paymentDate: paymentData.date,
        paymentReference: paymentData.reference,
        notes: paymentData.notes,
        registeredBy: paymentData.registeredBy,
      });

      // Registrar pago en el cargo
      charge.recordPayment(amount);

      // Añadir pago a la lista
      this._payments.push(payment);
      createdPayments.push(payment);

      // Emitir evento de dominio
      this.addDomainEvent(
        new PaymentRecordedEvent({
          paymentId: payment.id.toValue(),
          chargeId: charge.id.toValue(),
          memberAccountId: this._id.toValue(),
          memberId: this._memberId,
          amount: amount.amount,
          paymentMethod: paymentData.method.value,
          paymentDate: paymentData.date,
          paymentReference: paymentData.reference.value,
          chargeNewStatus: charge.status.value,
        }),
      );
    }

    return { ok: true, value: createdPayments };
  }

  /**
   * Calcula el balance total pendiente de la cuenta.
   * Suma el importe restante de todos los cargos PENDING o PARTIALLY_PAID.
   */
  getBalance(): Money {
    let balance = Money.zero();

    for (const charge of this._charges) {
      if (
        charge.status.equals(ChargeStatus.PENDING) ||
        charge.status.equals(ChargeStatus.PARTIALLY_PAID)
      ) {
        const addResult = balance.add(charge.remainingAmount());
        if (!addResult.ok) throw addResult.error;
        balance = addResult.value;
      }
    }

    return balance;
  }

  /**
   * Devuelve el historial completo de pagos ordenado por fecha de pago descendente.
   */
  getPaymentHistory(): ReadonlyArray<Payment> {
    return [...this._payments].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  /**
   * Busca un cargo por su identificador.
   */
  findChargeById(chargeId: ChargeId): Charge | undefined {
    return this._charges.find((c) => c.id.equals(chargeId));
  }

  /**
   * Devuelve los cargos pendientes (PENDING o PARTIALLY_PAID).
   */
  getPendingCharges(): Charge[] {
    return this._charges.filter(
      (c) => c.status.equals(ChargeStatus.PENDING) || c.status.equals(ChargeStatus.PARTIALLY_PAID),
    );
  }
}
