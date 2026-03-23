import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de finalización de generación mensual masiva. */
export interface MonthlyGenerationCompletedPayload {
  tenantId: string;
  month: number;
  year: number;
  totalSubscriptions: number;
  chargesGenerated: number;
  totalAmount: number;
  duplicatesSkipped: number;
  errorsCount: number;
  durationMs: number;
}

/**
 * Evento de dominio emitido cuando se completa la generación masiva
 * de cargos periódicos para un mes/año.
 * Útil para auditoría y alertas al tesorero.
 */
export class MonthlyGenerationCompletedEvent extends DomainEvent<MonthlyGenerationCompletedPayload> {
  readonly eventType = 'monthly-generation.completed';
}
