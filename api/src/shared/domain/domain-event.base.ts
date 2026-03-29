import { v4 as uuidV4 } from 'uuid';

/**
 * Parámetros del constructor del DomainEvent.
 * Permite instanciar un evento con todos sus campos de contexto en un único objeto.
 */
export interface DomainEventParams<TPayload> {
  /** Datos del evento. */
  payload: TPayload;
  /** ID del agregado que originó el evento (UUID). */
  aggregateId: string;
  /** Tipo del agregado (ej: Member, FeePlan). */
  aggregateType: string;
  /** Bounded Context que publica el evento (ej: BC-Membership). */
  boundedContext: string;
  /** ID del usuario que ejecutó la acción. Nullable para operaciones de sistema. */
  actorId?: string;
  /** ID del evento. Si se proporciona, se usa en lugar de generar uno nuevo (reconstitución desde outbox). */
  eventId?: string;
  /** Fecha de ocurrencia del evento. Si se proporciona, se usa en lugar de new Date() (reconstitución desde outbox). */
  occurredOn?: Date;
}

/**
 * Clase abstracta base para Domain Events.
 * Cada evento tiene un ID único, una fecha de ocurrencia, un tipo, un payload
 * y los campos de contexto del agregado que lo originó (GAP-002).
 */
export abstract class DomainEvent<TPayload = unknown> {
  /** Identificador único del evento (UUID v4 auto-generado). */
  readonly eventId: string;

  /** Fecha y hora en que ocurrió el evento. */
  readonly occurredOn: Date;

  /** Tipo del evento en PascalCase (ej: MemberRegistered, FeePlanCreated). */
  abstract readonly eventType: string;

  /** Datos del evento. */
  readonly payload: TPayload;

  /** ID del agregado que originó el evento. */
  readonly aggregateId: string;

  /** Tipo del agregado (ej: Member, Tenant, FeePlan). */
  readonly aggregateType: string;

  /** Bounded Context que publica el evento (ej: BC-Membership). */
  readonly boundedContext: string;

  /** Usuario que ejecutó la acción. Undefined para operaciones de sistema. */
  readonly actorId?: string;

  constructor(params: DomainEventParams<TPayload>) {
    this.eventId = params.eventId ?? uuidV4();
    this.occurredOn = params.occurredOn ?? new Date();
    this.payload = params.payload;
    this.aggregateId = params.aggregateId;
    this.aggregateType = params.aggregateType;
    this.boundedContext = params.boundedContext;
    this.actorId = params.actorId;
  }
}
