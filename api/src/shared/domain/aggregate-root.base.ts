import { DomainEvent } from './domain-event.base';
import { Entity } from './entity.base';

/**
 * Clase abstracta base para Aggregate Roots.
 * Extiende Entity añadiendo la gestión de Domain Events.
 * Los eventos de dominio se acumulan hasta ser publicados por la infraestructura.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  /** Añade un evento de dominio a la lista interna. */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Extrae y devuelve todos los eventos de dominio acumulados.
   * Limpia la lista interna tras la extracción.
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /** Limpia todos los eventos de dominio sin devolverlos. */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
