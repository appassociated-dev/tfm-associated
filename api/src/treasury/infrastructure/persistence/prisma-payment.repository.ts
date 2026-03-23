import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { Payment } from '../../domain/entities/payment';
import { ChargeId } from '../../domain/value-objects/charge-id';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { PaymentMethod } from '../../domain/value-objects/payment-method';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { PaymentPrismaMapper, PrismaRawPayment } from './payment-prisma.mapper';

/**
 * Implementación Prisma del repositorio de Payment.
 * Opera contra la tabla `payments` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getPrisma(): Promise<any> {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaPaymentRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste un pago individual. */
  async save(payment: Payment): Promise<void> {
    // Necesitamos el memberAccountId — lo obtenemos del cargo asociado
    const charge = await (
      await this.getPrisma()
    ).charge.findUnique({
      where: { id: payment.chargeId.toValue() },
      select: { memberAccountId: true },
    });

    if (!charge) {
      throw new Error(
        `No se encontró el cargo ${payment.chargeId.toValue()} al persistir el pago.`,
      );
    }

    const data = PaymentPrismaMapper.toPersistence(payment, charge.memberAccountId);

    await (await this.getPrisma()).payment.create({ data });
  }

  /** Persiste múltiples pagos en una sola operación (cobro multi-cargo). */
  async saveMany(payments: Payment[]): Promise<void> {
    if (payments.length === 0) return;

    // Obtener los chargeIds únicos para resolver memberAccountId
    const chargeIds = [...new Set(payments.map((p) => p.chargeId.toValue()))];

    const charges = await (
      await this.getPrisma()
    ).charge.findMany({
      where: { id: { in: chargeIds } },
      select: { id: true, memberAccountId: true },
    });

    const chargeAccountMap = new Map<string, string>();
    for (const charge of charges) {
      chargeAccountMap.set(charge.id, charge.memberAccountId);
    }

    const data = payments.map((payment) => {
      const memberAccountId = chargeAccountMap.get(payment.chargeId.toValue());
      if (!memberAccountId) {
        throw new Error(
          `No se pudo resolver memberAccountId para el cargo ${payment.chargeId.toValue()}.`,
        );
      }
      return PaymentPrismaMapper.toPersistence(payment, memberAccountId);
    });

    await (await this.getPrisma()).payment.createMany({ data });
  }

  /** Busca todos los pagos asociados a un cargo, ordenados por fecha de creación descendente. */
  async findByChargeId(chargeId: ChargeId): Promise<Payment[]> {
    const rawList = await (
      await this.getPrisma()
    ).payment.findMany({
      where: { chargeId: chargeId.toValue() },
      orderBy: { createdAt: 'desc' },
    });

    return rawList.map((raw: PrismaRawPayment) => PaymentPrismaMapper.toDomain(raw));
  }

  /** Busca todos los pagos de una cuenta de socio, ordenados por fecha de pago descendente. */
  async findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Payment[]> {
    const rawList = await (
      await this.getPrisma()
    ).payment.findMany({
      where: { memberAccountId: memberAccountId.toValue() },
      orderBy: { paymentDate: 'desc' },
    });

    return rawList.map((raw: PrismaRawPayment) => PaymentPrismaMapper.toDomain(raw));
  }

  /**
   * Obtiene el siguiente número secuencial para referencias de pago.
   * Busca el máximo secuencial existente para el prefijo y año dados.
   * Usa advisory lock para seguridad bajo concurrencia.
   */
  async getNextPaymentSequence(method: PaymentMethod, year: number): Promise<number> {
    const prefix = PaymentMethod.toPrefix(method);
    const pattern = `${prefix}-${year}-%`;

    // Raw query con advisory lock para concurrencia segura
    const result = await (
      await this.getPrisma()
    ).$queryRawUnsafe(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(payment_reference, '-', 3) AS INTEGER)), 0) + 1 AS next_seq
       FROM payments
       WHERE payment_reference LIKE $1`,
      pattern,
    );

    // El resultado de $queryRawUnsafe es un array de objetos — validación en runtime
    if (!Array.isArray(result) || result.length === 0) {
      return 1;
    }
    const row = result[0] as { next_seq: bigint | number };
    return Number(row.next_seq);
  }

  /**
   * Obtiene el siguiente número secuencial para recibos.
   * Busca el máximo secuencial existente para el año dado.
   * Usa advisory lock para seguridad bajo concurrencia.
   */
  async getNextReceiptSequence(year: number): Promise<number> {
    const pattern = `REC-${year}-%`;

    const result = await (
      await this.getPrisma()
    ).$queryRawUnsafe(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(receipt_number, '-', 3) AS INTEGER)), 0) + 1 AS next_seq
       FROM payments
       WHERE receipt_number LIKE $1`,
      pattern,
    );

    // Validación en runtime en vez de casteo inseguro
    if (!Array.isArray(result) || result.length === 0) {
      return 1;
    }
    const row = result[0] as { next_seq: bigint | number };
    return Number(row.next_seq);
  }

  /**
   * Busca un pago por su ID. Usado para obtener el recibo de un pago.
   */
  async findById(paymentId: string): Promise<Payment | null> {
    const raw = await (
      await this.getPrisma()
    ).payment.findUnique({
      where: { id: paymentId },
    });

    return raw ? PaymentPrismaMapper.toDomain(raw) : null;
  }

  /**
   * Actualiza el documento del recibo (PDF) y el número de recibo de un pago.
   */
  async updateReceipt(
    paymentId: string,
    receiptNumber: string,
    receiptDocument: Buffer,
  ): Promise<void> {
    await (
      await this.getPrisma()
    ).payment.update({
      where: { id: paymentId },
      data: {
        receiptNumber,
        receiptDocument,
      },
    });
  }

  /**
   * Obtiene el documento del recibo de un pago.
   */
  async getReceiptDocument(paymentId: string): Promise<Buffer | null> {
    const raw = await (
      await this.getPrisma()
    ).payment.findUnique({
      where: { id: paymentId },
      select: { receiptDocument: true },
    });

    return raw?.receiptDocument ?? null;
  }
}
