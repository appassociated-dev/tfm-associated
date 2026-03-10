import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de apertura de ejercicio fiscal. */
export interface FiscalYearOpenedPayload {
  fiscalYearId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  carriedOverMembers: number;
  appliedTransitions: Array<{
    memberId: string;
    previousTypeId: string;
    newTypeId: string;
  }>;
}

/**
 * Evento de dominio emitido cuando se abre un ejercicio fiscal.
 * Contiene información sobre el periodo y las transiciones aplicadas.
 */
export class FiscalYearOpenedEvent extends DomainEvent<FiscalYearOpenedPayload> {
  readonly eventType = 'fiscal-year.opened';
}
