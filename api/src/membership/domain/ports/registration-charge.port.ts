/** Token de inyección para el puerto de cargos de alta (NestJS DI). */
export const REGISTRATION_CHARGE_PORT = Symbol('REGISTRATION_CHARGE_PORT');

/** Información de un plan de alta encontrado. */
export interface RegistrationPlanInfo {
  /** Identificador del plan. */
  readonly feePlanId: string;
  /** Código del plan. */
  readonly code: string;
  /** Nombre del plan. */
  readonly name: string;
  /** Importe en centavos. */
  readonly amount: number;
}

/** Parámetros para crear los artefactos de tesorería durante el alta. */
export interface CreateRegistrationArtifactsParams {
  /** Identificador del socio. */
  readonly memberId: string;
  /** Identificador del plan de alta. */
  readonly feePlanId: string;
  /** Importe efectivo en centavos. */
  readonly effectiveAmount: number;
  /** Concepto del cargo. */
  readonly concept: string;
  /** Año de facturación. */
  readonly billingYear: number;
  /** Fecha de emisión del cargo. */
  readonly issueDate: Date;
  /** Fecha de vencimiento del cargo. */
  readonly dueDate: Date;
}

/** Resultado de la creación de artefactos de tesorería. */
export interface RegistrationChargeResult {
  /** Identificador de la cuenta creada. */
  readonly memberAccountId: string;
  /** Identificador de la suscripción creada. */
  readonly feeSubscriptionId: string;
  /** Identificador del cargo creado. */
  readonly chargeId: string;
}

/**
 * Puerto cross-BC para la creación de artefactos de tesorería durante el alta de socio.
 * Implementación en infraestructura con Prisma (adapter).
 * Permite a BC-Membership orquestar la creación de MemberAccount + FeeSubscription + Charge
 * sin depender directamente de BC-Treasury (ADR-003).
 */
export interface RegistrationChargePort {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /**
   * Crea los artefactos de tesorería asociados al alta de un socio:
   * MemberAccount, FeeSubscription y Charge.
   * @param params Datos para la creación de artefactos.
   * @param tx Cliente transaccional opcional para garantizar atomicidad.
   */
  createRegistrationArtifacts(
    params: CreateRegistrationArtifactsParams,
    tx?: unknown,
  ): Promise<RegistrationChargeResult>;

  /**
   * Busca el plan de cuota de alta activo (tipo ONE_TIME) en el tenant.
   * Retorna null si no existe ninguno activo.
   */
  findRegistrationPlan(): Promise<RegistrationPlanInfo | null>;
}
