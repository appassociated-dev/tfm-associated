import { Injectable } from '@nestjs/common';
import {
  SubscriptionQueryPort,
  SubscriptionSummary,
  PendingChargeSummary,
} from '../../domain/ports/subscription-query.port';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Adapter Prisma del puerto cross-BC para consultas de suscripciones y cargos (UC-013).
 * Opera contra las tablas member_accounts, fee_subscriptions, fee_plans y charges
 * de la BD del tenant (ADR-002).
 *
 * Soporta recibir un cliente transaccional (tx) para participar en
 * transacciones Prisma gestionadas por el handler.
 */
@Injectable()
export class PrismaSubscriptionQueryAdapter implements SubscriptionQueryPort {
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
        'tenantId no establecido en PrismaSubscriptionQueryAdapter. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /**
   * Obtiene las suscripciones activas de un socio.
   * Busca suscripciones sin fecha de baja asociadas a la cuenta del socio.
   */
  async getActiveSubscriptions(memberId: string): Promise<SubscriptionSummary[]> {
    // Obtener la cuenta del socio
    const memberAccount = await (
      await this.getPrisma()
    ).memberAccount.findFirst({
      where: { memberId },
    });

    if (!memberAccount) {
      return [];
    }

    // Buscar suscripciones activas (sin fecha de baja)
    const subscriptions = await (
      await this.getPrisma()
    ).feeSubscription.findMany({
      where: {
        memberAccountId: memberAccount.id,
        leaveDate: null,
      },
      include: {
        feePlan: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subscriptions.map((sub: any) => ({
      subscriptionId: sub.id,
      feePlanCode: sub.feePlan?.code ?? '',
      feePlanName: sub.feePlan?.name ?? '',
      amount: sub.effectiveAmount,
      startDate: sub.registrationDate,
    }));
  }

  /**
   * Obtiene los cargos pendientes de pago de un socio.
   * Busca cargos con estado PENDING asociados a la cuenta del socio.
   */
  async getPendingCharges(memberId: string): Promise<PendingChargeSummary[]> {
    // Obtener la cuenta del socio
    const memberAccount = await (
      await this.getPrisma()
    ).memberAccount.findFirst({
      where: { memberId },
    });

    if (!memberAccount) {
      return [];
    }

    // Buscar cargos pendientes
    const charges = await (
      await this.getPrisma()
    ).charge.findMany({
      where: {
        memberAccountId: memberAccount.id,
        status: 'PENDING',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return charges.map((charge: any) => ({
      chargeId: charge.id,
      concept: charge.concept,
      amount: charge.finalAmount,
      issueDate: charge.issueDate,
      dueDate: charge.dueDate,
    }));
  }

  /**
   * Calcula el total de deuda pendiente de un socio en centavos.
   * Suma los importes de todos los cargos con estado PENDING.
   */
  async getTotalPendingDebt(memberId: string): Promise<number> {
    // Obtener la cuenta del socio
    const memberAccount = await (
      await this.getPrisma()
    ).memberAccount.findFirst({
      where: { memberId },
    });

    if (!memberAccount) {
      return 0;
    }

    // Sumar cargos pendientes
    const result = await (
      await this.getPrisma()
    ).charge.aggregate({
      _sum: {
        finalAmount: true,
      },
      where: {
        memberAccountId: memberAccount.id,
        status: 'PENDING',
      },
    });

    return result._sum.finalAmount ?? 0;
  }

  /**
   * Cancela todas las suscripciones activas de un socio.
   * Establece la fecha de baja y el motivo de cancelación.
   * @returns Número de suscripciones canceladas.
   */
  async closeSubscriptions(memberId: string, cancelReason: string, tx?: unknown): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (tx ?? (await this.getPrisma())) as any;
    const now = new Date();

    // Obtener la cuenta del socio
    const memberAccount = await client.memberAccount.findFirst({
      where: { memberId },
    });

    if (!memberAccount) {
      return 0;
    }

    // Cancelar suscripciones activas
    const result = await client.feeSubscription.updateMany({
      where: {
        memberAccountId: memberAccount.id,
        leaveDate: null,
      },
      data: {
        leaveDate: now,
        cancelReason,
        status: 'CANCELLED',
      },
    });

    return result.count;
  }

  /**
   * Marca cargos específicos como pagados.
   * Actualiza el estado de los cargos indicados a PAID.
   */
  async markChargesAsPaid(memberId: string, chargeIds: string[], tx?: unknown): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (tx ?? (await this.getPrisma())) as any;

    // Obtener la cuenta del socio para verificar pertenencia
    const memberAccount = await client.memberAccount.findFirst({
      where: { memberId },
    });

    if (!memberAccount) {
      return;
    }

    // Marcar cargos como pagados (solo los que pertenecen a la cuenta del socio)
    await client.charge.updateMany({
      where: {
        id: { in: chargeIds },
        memberAccountId: memberAccount.id,
        status: 'PENDING',
      },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
      },
    });
  }
}
