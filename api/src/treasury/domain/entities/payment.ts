import { Entity } from '../../../shared/domain';
import { PaymentId } from '../value-objects/payment-id';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { PaymentStatus } from '../value-objects/payment-status';
import { ReceiptNumber } from '../value-objects/receipt-number';
import { Money } from '../value-objects/money';
import { ChargeId } from '../value-objects/charge-id';

/** Propiedades para crear un nuevo pago. */
export interface CreatePaymentProps {
  chargeId: ChargeId;
  amount: Money;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  paymentReference: PaymentReference;
  notes: string | null;
  registeredBy: string;
}

/** Propiedades para reconstituir un pago desde persistencia. */
export interface ReconstitutePaymentProps {
  id: string;
  chargeId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  paymentReference: string;
  receiptNumber: string | null;
  notes: string | null;
  registeredBy: string;
  status: string;
  createdAt: Date;
}

/**
 * Error de dominio para invariantes del pago.
 */
export class PaymentInvariantError extends Error {
  readonly code = 'PAYMENT.INVARIANT_VIOLATION';

  constructor(reason: string) {
    super(`Invariante de pago violada: ${reason}`);
    this.name = 'PaymentInvariantError';
  }
}

/**
 * Entidad que representa un pago registrado sobre un cargo.
 * Pertenece al aggregate MemberAccount.
 *
 * Invariantes:
 * - amount > 0
 * - paymentDate <= now() (no pagos futuros, FE-2)
 * - status debe ser CONFIRMED al crear
 */
export class Payment extends Entity<PaymentId> {
  private readonly _chargeId: ChargeId;
  private readonly _amount: Money;
  private readonly _paymentMethod: PaymentMethod;
  private readonly _paymentDate: Date;
  private readonly _paymentReference: PaymentReference;
  private _receiptNumber: ReceiptNumber | null;
  private readonly _notes: string | null;
  private readonly _registeredBy: string;
  private readonly _status: PaymentStatus;
  private readonly _createdAt: Date;

  private constructor(
    id: PaymentId,
    chargeId: ChargeId,
    amount: Money,
    paymentMethod: PaymentMethod,
    paymentDate: Date,
    paymentReference: PaymentReference,
    receiptNumber: ReceiptNumber | null,
    notes: string | null,
    registeredBy: string,
    status: PaymentStatus,
    createdAt: Date,
  ) {
    super(id);
    this._chargeId = chargeId;
    this._amount = amount;
    this._paymentMethod = paymentMethod;
    this._paymentDate = paymentDate;
    this._paymentReference = paymentReference;
    this._receiptNumber = receiptNumber;
    this._notes = notes;
    this._registeredBy = registeredBy;
    this._status = status;
    this._createdAt = createdAt;
  }

  // --- Getters ---

  get chargeId(): ChargeId {
    return this._chargeId;
  }

  get amount(): Money {
    return this._amount;
  }

  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  get paymentDate(): Date {
    return this._paymentDate;
  }

  get paymentReference(): PaymentReference {
    return this._paymentReference;
  }

  get receiptNumber(): ReceiptNumber | null {
    return this._receiptNumber;
  }

  get notes(): string | null {
    return this._notes;
  }

  get registeredBy(): string {
    return this._registeredBy;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo pago validando todas las invariantes.
   * Genera un nuevo PaymentId (UUID v4), establece status = CONFIRMED y createdAt = now().
   * @throws PaymentInvariantError si alguna invariante es violada.
   */
  static create(props: CreatePaymentProps): Payment {
    // Validar invariante: amount > 0
    if (props.amount.amount <= 0) {
      throw new PaymentInvariantError('El importe del pago debe ser mayor que 0.');
    }

    // Validar invariante: paymentDate <= now() (no pagos futuros, FE-2)
    const now = new Date();
    if (props.paymentDate > now) {
      throw new PaymentInvariantError('La fecha de pago no puede ser posterior a la fecha actual.');
    }

    const paymentId = PaymentId.create();

    return new Payment(
      paymentId,
      props.chargeId,
      props.amount,
      props.paymentMethod,
      props.paymentDate,
      props.paymentReference,
      null, // receiptNumber se asigna después
      props.notes,
      props.registeredBy,
      PaymentStatus.CONFIRMED,
      now,
    );
  }

  /**
   * Reconstituye un pago desde persistencia sin validación ni eventos.
   * Usado para hidratar la entidad desde el repositorio.
   */
  static reconstitute(props: ReconstitutePaymentProps): Payment {
    const paymentId = PaymentId.fromString(props.id);
    const chargeId = ChargeId.fromString(props.chargeId);

    const amountResult = Money.create(props.amount);
    if (!amountResult.ok) throw amountResult.error;

    const paymentMethod = PaymentMethod.fromString(props.paymentMethod);
    const paymentReference = PaymentReference.fromString(props.paymentReference);
    const receiptNumber = props.receiptNumber
      ? ReceiptNumber.fromString(props.receiptNumber)
      : null;
    const status = PaymentStatus.fromString(props.status);

    return new Payment(
      paymentId,
      chargeId,
      amountResult.value,
      paymentMethod,
      props.paymentDate,
      paymentReference,
      receiptNumber,
      props.notes,
      props.registeredBy,
      status,
      props.createdAt,
    );
  }

  // --- Métodos de negocio ---

  /**
   * Establece el número de recibo tras la generación del recibo.
   * @param receiptNumber Número de recibo asignado.
   */
  setReceiptNumber(receiptNumber: ReceiptNumber): void {
    this._receiptNumber = receiptNumber;
  }
}
