import { Payment } from '../../domain/entities/payment';

/**
 * Datos de un Payment tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase a snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawPayment {
  id: string;
  memberAccountId: string;
  chargeId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  paymentReference: string;
  receiptNumber: string | null;
  receiptDocument: Buffer | null;
  notes: string | null;
  registeredBy: string;
  status: string;
  createdAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y la entidad de dominio Payment.
 */
export class PaymentPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a una entidad Payment.
   * Utiliza Payment.reconstitute() para evitar validación de invariantes y emisión de eventos.
   */
  static toDomain(raw: PrismaRawPayment): Payment {
    return Payment.reconstitute({
      id: raw.id,
      chargeId: raw.chargeId,
      amount: raw.amount,
      paymentMethod: raw.paymentMethod,
      paymentDate: raw.paymentDate,
      paymentReference: raw.paymentReference,
      receiptNumber: raw.receiptNumber,
      notes: raw.notes,
      registeredBy: raw.registeredBy,
      status: raw.status,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convierte una entidad Payment a un objeto plano para persistencia con Prisma.
   * Incluye memberAccountId como parámetro explícito (ya que la entidad no lo lleva).
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(payment: Payment, memberAccountId: string): Record<string, unknown> {
    return {
      id: payment.id.toValue(),
      memberAccountId,
      chargeId: payment.chargeId.toValue(),
      amount: payment.amount.amount,
      paymentMethod: payment.paymentMethod.value,
      paymentDate: payment.paymentDate,
      paymentReference: payment.paymentReference.value,
      receiptNumber: payment.receiptNumber?.value ?? null,
      receiptDocument: null, // El PDF del recibo se almacena por separado
      notes: payment.notes,
      registeredBy: payment.registeredBy,
      status: payment.status.value,
      createdAt: payment.createdAt,
    };
  }
}
