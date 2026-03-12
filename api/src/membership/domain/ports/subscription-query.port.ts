/** Token de inyección para el puerto de consultas de suscripciones (NestJS DI). */
export const SUBSCRIPTION_QUERY_PORT = Symbol('SUBSCRIPTION_QUERY_PORT');

/** Resumen de una suscripción activa de un socio. */
export interface SubscriptionSummary {
  /** Identificador de la suscripción. */
  readonly subscriptionId: string;
  /** Código del plan de cuota asociado. */
  readonly feePlanCode: string;
  /** Nombre del plan de cuota asociado. */
  readonly feePlanName: string;
  /** Importe periódico en centavos. */
  readonly amount: number;
  /** Fecha de inicio de la suscripción. */
  readonly startDate: Date;
}

/** Resumen de un cargo pendiente de pago de un socio. */
export interface PendingChargeSummary {
  /** Identificador del cargo. */
  readonly chargeId: string;
  /** Concepto del cargo. */
  readonly concept: string;
  /** Importe en centavos. */
  readonly amount: number;
  /** Fecha de emisión. */
  readonly issueDate: Date;
  /** Fecha de vencimiento. */
  readonly dueDate: Date;
}

/**
 * Puerto cross-BC para consultas de suscripciones y cargos de un socio.
 * Implementación en infraestructura con Prisma (adapter).
 * Permite a BC-Membership consultar y gestionar suscripciones/cargos
 * sin depender directamente de BC-Treasury (ADR-003).
 */
export interface SubscriptionQueryPort {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /**
   * Obtiene las suscripciones activas de un socio.
   * @param memberId Identificador del socio.
   */
  getActiveSubscriptions(memberId: string): Promise<SubscriptionSummary[]>;

  /**
   * Obtiene los cargos pendientes de pago de un socio.
   * @param memberId Identificador del socio.
   */
  getPendingCharges(memberId: string): Promise<PendingChargeSummary[]>;

  /**
   * Calcula el total de deuda pendiente de un socio en centavos.
   * @param memberId Identificador del socio.
   */
  getTotalPendingDebt(memberId: string): Promise<number>;

  /**
   * Cancela todas las suscripciones activas de un socio.
   * @param memberId Identificador del socio.
   * @param cancelReason Motivo de la cancelación.
   * @param tx Cliente transaccional opcional para garantizar atomicidad.
   * @returns Número de suscripciones canceladas.
   */
  closeSubscriptions(memberId: string, cancelReason: string, tx?: unknown): Promise<number>;

  /**
   * Marca cargos específicos como pagados.
   * @param memberId Identificador del socio.
   * @param chargeIds Lista de identificadores de cargos a marcar como pagados.
   * @param tx Cliente transaccional opcional para garantizar atomicidad.
   */
  markChargesAsPaid(memberId: string, chargeIds: string[], tx?: unknown): Promise<void>;
}
