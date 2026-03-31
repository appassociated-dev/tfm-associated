import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de cierre de ejercicio fiscal. */
export interface FiscalYearClosedPayload {
  fiscalYearId: string;
  name: string;
  membersAtEnd: number;
  closedAt: Date;
  warnings: string[];
}

/**
 * Evento de dominio emitido cuando se cierra un ejercicio fiscal.
 * Contiene los datos finales del ejercicio y advertencias pendientes.
 */
export class FiscalYearClosedEvent extends DomainEvent<FiscalYearClosedPayload> {
  readonly eventType = 'FiscalYearClosed';
}
