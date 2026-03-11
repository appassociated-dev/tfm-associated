import { Entity } from '../../../shared/domain';
import { ChargeId } from '../value-objects/charge-id';
import { ChargeStatus } from '../value-objects/charge-status';
import { ChargeDescription } from '../value-objects/charge-description';
import { Money } from '../value-objects/money';
import { SubscriptionId } from '../value-objects/subscription-id';

/** Propiedades para crear un nuevo cargo. */
export interface CreateChargeProps {
  subscriptionId: string | null;
  baseAmount: Money;
  finalAmount: Money;
  description: ChargeDescription;
  billingMonth: number | null;
  billingYear: number;
  issueDate: Date;
  dueDate: Date;
  isProrated: boolean;
  isManual: boolean;
}

/** Propiedades para reconstituir un cargo desde persistencia. */
export interface ReconstituteChargeProps {
  id: string;
  subscriptionId: string | null;
  baseAmount: number;
  finalAmount: number;
  description: string;
  fiscalYearId: string | null;
  billingMonth: number | null;
  billingYear: number;
  issueDate: Date;
  dueDate: Date;
  status: string;
  paidAmount: number;
  isProrated: boolean;
  isManual: boolean;
  createdAt: Date;
}

/**
 * Error de dominio para invariantes del cargo.
 */
export class ChargeInvariantError extends Error {
  readonly code = 'CHARGE.INVARIANT_VIOLATION';

  constructor(reason: string) {
    super(`Invariante de cargo violada: ${reason}`);
    this.name = 'ChargeInvariantError';
  }
}

/**
 * Error de dominio para operaciones inválidas sobre el cargo.
 */
export class ChargeOperationError extends Error {
  readonly code = 'CHARGE.INVALID_OPERATION';

  constructor(reason: string) {
    super(`Operación inválida sobre cargo: ${reason}`);
    this.name = 'ChargeOperationError';
  }
}

/**
 * Entidad que representa un cargo generado a un socio.
 * Pertenece al aggregate MemberAccount.
 *
 * Invariantes:
 * - finalAmount > 0
 * - dueDate >= issueDate
 * - paidAmount <= finalAmount
 * - Si isManual = true, subscriptionId debe ser NULL
 * - Si isManual = false, subscriptionId debe existir
 */
export class Charge extends Entity<ChargeId> {
  private _subscriptionId: SubscriptionId | null;
  private _baseAmount: Money;
  private _finalAmount: Money;
  private _description: ChargeDescription;
  private _billingMonth: number | null;
  private _billingYear: number;
  private _issueDate: Date;
  private _dueDate: Date;
  private _status: ChargeStatus;
  private _paidAmount: Money;
  private _isProrated: boolean;
  private _isManual: boolean;
  private _createdAt: Date;

  private constructor(
    id: ChargeId,
    subscriptionId: SubscriptionId | null,
    baseAmount: Money,
    finalAmount: Money,
    description: ChargeDescription,
    billingMonth: number | null,
    billingYear: number,
    issueDate: Date,
    dueDate: Date,
    status: ChargeStatus,
    paidAmount: Money,
    isProrated: boolean,
    isManual: boolean,
    createdAt: Date,
  ) {
    super(id);
    this._subscriptionId = subscriptionId;
    this._baseAmount = baseAmount;
    this._finalAmount = finalAmount;
    this._description = description;
    this._billingMonth = billingMonth;
    this._billingYear = billingYear;
    this._issueDate = issueDate;
    this._dueDate = dueDate;
    this._status = status;
    this._paidAmount = paidAmount;
    this._isProrated = isProrated;
    this._isManual = isManual;
    this._createdAt = createdAt;
  }

  // --- Getters ---

  get subscriptionId(): SubscriptionId | null {
    return this._subscriptionId;
  }

  get baseAmount(): Money {
    return this._baseAmount;
  }

  get finalAmount(): Money {
    return this._finalAmount;
  }

  get description(): ChargeDescription {
    return this._description;
  }

  get billingMonth(): number | null {
    return this._billingMonth;
  }

  get billingYear(): number {
    return this._billingYear;
  }

  get issueDate(): Date {
    return this._issueDate;
  }

  get dueDate(): Date {
    return this._dueDate;
  }

  get status(): ChargeStatus {
    return this._status;
  }

  get paidAmount(): Money {
    return this._paidAmount;
  }

  get isProrated(): boolean {
    return this._isProrated;
  }

  get isManual(): boolean {
    return this._isManual;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo cargo validando todas las invariantes.
   * Genera un nuevo ChargeId (UUID v4), establece status = PENDING y paidAmount = 0.
   * @throws ChargeInvariantError si alguna invariante es violada.
   */
  static create(props: CreateChargeProps): Charge {
    // Validar invariante: finalAmount > 0
    if (props.finalAmount.amount <= 0) {
      throw new ChargeInvariantError('El importe final debe ser mayor que 0.');
    }

    // Validar invariante: dueDate >= issueDate
    if (props.dueDate < props.issueDate) {
      throw new ChargeInvariantError(
        'La fecha de vencimiento no puede ser anterior a la fecha de emisión.',
      );
    }

    // Validar invariante: isManual = true → subscriptionId = NULL
    if (props.isManual && props.subscriptionId !== null) {
      throw new ChargeInvariantError('Un cargo manual no puede tener suscripción asociada.');
    }

    // Validar invariante: isManual = false → subscriptionId debe existir
    if (!props.isManual && props.subscriptionId === null) {
      throw new ChargeInvariantError('Un cargo no manual debe tener una suscripción asociada.');
    }

    const chargeId = ChargeId.create();
    const subscriptionId = props.subscriptionId
      ? SubscriptionId.fromString(props.subscriptionId)
      : null;
    const paidAmount = Money.zero(props.finalAmount.currency);
    const now = new Date();

    return new Charge(
      chargeId,
      subscriptionId,
      props.baseAmount,
      props.finalAmount,
      props.description,
      props.billingMonth,
      props.billingYear,
      props.issueDate,
      props.dueDate,
      ChargeStatus.PENDING,
      paidAmount,
      props.isProrated,
      props.isManual,
      now,
    );
  }

  /**
   * Reconstituye un cargo desde persistencia sin validación ni eventos.
   * Usado para hidratar la entidad desde el repositorio.
   */
  static reconstitute(props: ReconstituteChargeProps): Charge {
    const chargeId = ChargeId.fromString(props.id);
    const subscriptionId = props.subscriptionId
      ? SubscriptionId.fromString(props.subscriptionId)
      : null;

    // Crear Money desde valores de persistencia
    const baseAmountResult = Money.create(props.baseAmount);
    if (!baseAmountResult.ok) throw baseAmountResult.error;

    const finalAmountResult = Money.create(props.finalAmount);
    if (!finalAmountResult.ok) throw finalAmountResult.error;

    const paidAmountResult = Money.create(props.paidAmount);
    if (!paidAmountResult.ok) throw paidAmountResult.error;

    // Crear ChargeDescription
    const descriptionResult = ChargeDescription.create(props.description, props.fiscalYearId);
    if (!descriptionResult.ok) throw descriptionResult.error;

    const status = ChargeStatus.fromString(props.status);

    return new Charge(
      chargeId,
      subscriptionId,
      baseAmountResult.value,
      finalAmountResult.value,
      descriptionResult.value,
      props.billingMonth,
      props.billingYear,
      props.issueDate,
      props.dueDate,
      status,
      paidAmountResult.value,
      props.isProrated,
      props.isManual,
      props.createdAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Registra un pago sobre el cargo.
   * Incrementa paidAmount y actualiza status a PAID si completo o PARTIALLY_PAID si parcial.
   * @throws ChargeOperationError si el cargo no está pendiente/parcialmente pagado o el importe excede el restante.
   */
  recordPayment(amount: Money): void {
    // Solo se puede pagar un cargo pendiente o parcialmente pagado
    if (
      !this._status.equals(ChargeStatus.PENDING) &&
      !this._status.equals(ChargeStatus.PARTIALLY_PAID)
    ) {
      throw new ChargeOperationError(
        `No se puede registrar pago en un cargo con estado '${this._status.value}'.`,
      );
    }

    if (amount.amount <= 0) {
      throw new ChargeOperationError('El importe del pago debe ser mayor que 0.');
    }

    // Verificar que no excede el importe restante
    const remaining = this.remainingAmount();
    if (amount.amount > remaining.amount) {
      throw new ChargeOperationError(
        `El importe del pago (${amount.amount}) excede el importe restante (${remaining.amount}).`,
      );
    }

    // Incrementar paidAmount
    const addResult = this._paidAmount.add(amount);
    if (!addResult.ok) throw addResult.error;
    this._paidAmount = addResult.value;

    // Actualizar status según si el pago es completo o parcial
    if (this._paidAmount.amount >= this._finalAmount.amount) {
      this._status = ChargeStatus.PAID;
    } else {
      this._status = ChargeStatus.PARTIALLY_PAID;
    }
  }

  /**
   * Cancela el cargo.
   * @throws ChargeOperationError si el cargo ya está pagado o cancelado.
   */
  cancel(): void {
    if (this._status.equals(ChargeStatus.PAID)) {
      throw new ChargeOperationError('No se puede cancelar un cargo ya pagado.');
    }
    if (this._status.equals(ChargeStatus.CANCELLED)) {
      throw new ChargeOperationError('El cargo ya está cancelado.');
    }
    this._status = ChargeStatus.CANCELLED;
  }

  /**
   * Marca el cargo como devuelto (recibo devuelto por el banco).
   * @throws ChargeOperationError si el cargo no está pagado.
   */
  markAsReturned(): void {
    if (!this._status.equals(ChargeStatus.PAID)) {
      throw new ChargeOperationError(
        'Solo se puede marcar como devuelto un cargo que está pagado.',
      );
    }
    this._status = ChargeStatus.RETURNED;
  }

  /** Indica si el cargo está pendiente de cobro. */
  isPending(): boolean {
    return this._status.equals(ChargeStatus.PENDING);
  }

  /** Calcula el importe restante por cobrar. */
  remainingAmount(): Money {
    const result = this._finalAmount.subtract(this._paidAmount);
    if (!result.ok) throw result.error;
    return result.value;
  }
}
