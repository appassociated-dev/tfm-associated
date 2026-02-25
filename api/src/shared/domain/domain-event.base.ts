// Clase base abstracta para Domain Events — captura hechos significativos del dominio
export abstract class DomainEvent {
  // Identificador único del evento — UUID v4 generado en construcción
  readonly eventId: string;

  // Momento exacto en que ocurrió el evento
  readonly occurredOn: Date;

  // Identificador opcional del agregado que generó el evento
  readonly aggregateId?: string;

  // Payload con los datos relevantes del evento
  readonly payload: Record<string, unknown>;

  // Tipo de evento — debe ser único y descriptivo (e.g. 'member.registered')
  abstract readonly eventType: string;

  protected constructor(params: {
    aggregateId?: string;
    payload: Record<string, unknown>;
    eventId?: string;
    occurredOn?: Date;
  }) {
    // Generación de ID único para el evento usando crypto nativo (sin dependencias externas)
    this.eventId = params.eventId ?? crypto.randomUUID();
    this.occurredOn = params.occurredOn ?? new Date();
    this.aggregateId = params.aggregateId;
    this.payload = params.payload;
  }
}
