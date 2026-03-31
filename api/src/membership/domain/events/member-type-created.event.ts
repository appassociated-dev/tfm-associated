import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de creación de tipo de socio. */
export interface MemberTypeCreatedPayload {
  memberTypeId: string;
  code: string;
  name: string;
  description: string;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se crea un nuevo tipo de socio.
 * Contiene la información necesaria para que otros BCs reaccionen.
 */
export class MemberTypeCreatedEvent extends DomainEvent<MemberTypeCreatedPayload> {
  readonly eventType = 'MemberTypeCreated';
}
