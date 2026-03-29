import { Injectable } from '@nestjs/common';
import { DomainEvent, type DomainEventParams } from '../../domain/domain-event.base';

/**
 * Fila de outbox tal como la devuelve Prisma (DB-Main outbox_events).
 * Los campos coinciden con ENT-006 en camelCase de Prisma.
 */
export interface OutboxEventRow {
  /** ID del evento (eventId del DomainEvent original). */
  id: string;
  /** Tipo del evento en PascalCase (ej: MemberRegistered). */
  eventType: string;
  /** Payload JSON del evento. */
  payload: unknown;
  /** ID del agregado. */
  aggregateId: string;
  /** Tipo del agregado. */
  aggregateType: string;
  /** Bounded Context que publicó el evento. */
  boundedContext: string;
  /** ID del actor. Null para operaciones de sistema. */
  actorId: string | null;
  /** Fecha de creación en el outbox (corresponde a occurredOn del evento). */
  createdAt: Date;
  /** Número de reintentos realizados. */
  retryCount: number;
  /** Número máximo de reintentos permitidos. */
  maxRetries: number;
  /** Estado actual del evento en el outbox. */
  status: string;
  /** Fecha en que comenzó el procesamiento. Null si aún no fue procesado. */
  processingStartedAt: Date | null;
}

/** Tipo del constructor de una clase concreta de DomainEvent. */
type DomainEventClass<TPayload = unknown> = new (
  params: DomainEventParams<TPayload>,
) => DomainEvent<TPayload>;

/**
 * Error lanzado cuando se intenta reconstituir un evento con un tipo no registrado.
 */
export class EventTypeNotRegisteredError extends Error {
  constructor(eventType: string) {
    super(
      `EventReconstitutionRegistry: el tipo de evento '${eventType}' no está registrado. ` +
        `Asegurate de llamar registry.register('${eventType}', EventClass) en el onModuleInit del BC correspondiente.`,
    );
    this.name = 'EventTypeNotRegisteredError';
  }
}

/**
 * Registro de clases de eventos de dominio para reconstitución desde el outbox.
 * Cada Bounded Context registra sus clases durante la inicialización del módulo (onModuleInit).
 * Permite que el OutboxProcessorService reconstituya eventos tipados antes de despacharlos al EventBus.
 */
@Injectable()
export class EventReconstitutionRegistry {
  private readonly registry = new Map<string, DomainEventClass>();

  /**
   * Registra una clase de evento bajo el eventType indicado.
   * Llamar una vez por tipo de evento durante el OnModuleInit del BC.
   */
  register<TPayload>(eventType: string, eventClass: DomainEventClass<TPayload>): void {
    const existing = this.registry.get(eventType);

    // Si ya existe y es una clase distinta → error para evitar sobrescritura silenciosa entre BCs.
    // Si es la misma clase → idempotente (onModuleInit puede llamarse más de una vez en tests).
    if (existing && existing !== (eventClass as DomainEventClass)) {
      throw new Error(
        `EventReconstitutionRegistry: el tipo '${eventType}' ya está registrado con una clase diferente. ` +
          `Asegurate de que cada eventType sea único en todos los Bounded Contexts.`,
      );
    }

    this.registry.set(eventType, eventClass as DomainEventClass);
  }

  /**
   * Reconstituye una instancia tipada del evento a partir de una fila del outbox.
   * @throws {EventTypeNotRegisteredError} si el tipo no está registrado.
   */
  reconstitute(eventType: string, row: OutboxEventRow): DomainEvent {
    const EventClass = this.registry.get(eventType);

    if (!EventClass) {
      throw new EventTypeNotRegisteredError(eventType);
    }

    // Pasar eventId y occurredOn por constructor para preservar la identidad original del evento
    const instance = new EventClass({
      payload: row.payload,
      aggregateId: row.aggregateId,
      aggregateType: row.aggregateType,
      boundedContext: row.boundedContext,
      actorId: row.actorId ?? undefined,
      eventId: row.id,
      occurredOn: row.createdAt,
    });

    return instance;
  }
}
