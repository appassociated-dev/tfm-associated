import { Payment } from '../entities/payment';
import { ChargeId } from '../value-objects/charge-id';
import { MemberAccountId } from '../value-objects/member-account-id';
import { PaymentMethod } from '../value-objects/payment-method';

/** Token de inyección para el repositorio de Payment (NestJS DI). */
export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

/**
 * Interfaz del repositorio de Payment.
 * Define las operaciones de persistencia para la entidad Payment.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface PaymentRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste un pago. */
  save(payment: Payment): Promise<void>;

  /** Persiste múltiples pagos en una sola operación (cobro multi-cargo). */
  saveMany(payments: Payment[]): Promise<void>;

  /** Busca todos los pagos asociados a un cargo. */
  findByChargeId(chargeId: ChargeId): Promise<Payment[]>;

  /** Busca todos los pagos de una cuenta de socio. */
  findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Payment[]>;

  /**
   * Obtiene el siguiente número secuencial de pago para un método y año.
   * Usado para generar la referencia de pago ({PREFIX}-{YEAR}-{SEQUENCE}).
   */
  getNextPaymentSequence(method: PaymentMethod, year: number): Promise<number>;

  /**
   * Obtiene el siguiente número secuencial de recibo para un año.
   * Usado para generar el número de recibo (REC-{YEAR}-{SEQUENCE}).
   */
  getNextReceiptSequence(year: number): Promise<number>;
}
