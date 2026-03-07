import { v4 as uuidV4 } from 'uuid';

/**
 * Clase abstracta base para Domain Events.
 * Cada evento tiene un ID único, una fecha de ocurrencia, un tipo y un payload.
 */
export abstract class DomainEvent<TPayload = unknown> {
  /** Identificador único del evento (UUID v4 auto-generado). */
  readonly eventId: string;

  /** Fecha y hora en que ocurrió el evento. */
  readonly occurredOn: Date;

  /** Tipo del evento (e.g., "MemberRegistered", "FeeCharged"). */
  abstract readonly eventType: string;

  /** Datos del evento. */
  readonly payload: TPayload;

  constructor(payload: TPayload) {
    this.eventId = uuidV4();
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
