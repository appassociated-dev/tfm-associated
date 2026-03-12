import { Injectable } from '@nestjs/common';
import {
  RegistrationChargePort,
  RegistrationPlanInfo,
  CreateRegistrationArtifactsParams,
  RegistrationChargeResult,
} from '../../domain/ports/registration-charge.port';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Adapter Prisma del puerto cross-BC para cargos de alta (UC-011).
 * Opera contra las tablas fee_plans, member_accounts, fee_subscriptions y charges
 * de la BD del tenant (ADR-002).
 *
 * Soporta recibir un cliente transaccional (tx) para participar en
 * transacciones Prisma gestionadas por el handler.
 */
@Injectable()
export class PrismaRegistrationChargeAdapter implements RegistrationChargePort {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get prisma(): any {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaRegistrationChargeAdapter. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /**
   * Busca el plan de cuota de alta activo (tipo ONE_TIME) en el tenant.
   * Retorna null si no existe ninguno activo.
   */
  async findRegistrationPlan(): Promise<RegistrationPlanInfo | null> {
    const plan = await this.prisma.feePlan.findFirst({
      where: {
        type: 'ONE_TIME',
        active: true,
      },
    });

    if (!plan) {
      return null;
    }

    return {
      feePlanId: plan.id,
      code: plan.code,
      name: plan.name,
      amount: plan.amount,
    };
  }

  /**
   * Crea los artefactos de tesorería asociados al alta de un socio:
   * MemberAccount, FeeSubscription (inmediatamente completada) y Charge.
   *
   * @param params Datos para la creación.
   * @param tx Cliente transaccional Prisma opcional. Si se proporciona, usa tx; si no, usa el cliente normal.
   */
  async createRegistrationArtifacts(
    params: CreateRegistrationArtifactsParams,
    tx?: unknown,
  ): Promise<RegistrationChargeResult> {
    // Usar el cliente transaccional si se proporciona, o el cliente normal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (tx ?? this.prisma) as any;
    const now = new Date();

    // 1. Crear MemberAccount
    const memberAccount = await client.memberAccount.create({
      data: {
        memberId: params.memberId,
        balance: 0,
      },
    });

    // 2. Crear FeeSubscription (ONE_TIME: se completa inmediatamente)
    const feeSubscription = await client.feeSubscription.create({
      data: {
        memberAccountId: memberAccount.id,
        feePlanId: params.feePlanId,
        registrationDate: now,
        leaveDate: now,
        cancelReason: 'ONE_TIME_COMPLETED',
        effectiveAmount: params.effectiveAmount,
        status: 'COMPLETED',
      },
    });

    // 3. Crear Charge con estado PENDING
    const charge = await client.charge.create({
      data: {
        memberAccountId: memberAccount.id,
        feeSubscriptionId: feeSubscription.id,
        concept: params.concept,
        finalAmount: params.effectiveAmount,
        billingYear: params.billingYear,
        status: 'PENDING',
        issueDate: params.issueDate,
        dueDate: params.dueDate,
      },
    });

    return {
      memberAccountId: memberAccount.id,
      feeSubscriptionId: feeSubscription.id,
      chargeId: charge.id,
    };
  }
}
