import { Entity } from './entity.base';
import { type DomainEvent } from './domain-event.base';

// Clase base para Agregados del dominio — gestiona la consistencia transaccional y los Domain Events
export abstract class AggregateRoot<TId> extends Entity<TId> {
  // Colección privada de eventos de dominio pendientes de ser despachados
  private _domainEvents: DomainEvent[] = [];

  // Registra un nuevo Domain Event en el agregado
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Retorna y vacía los eventos de dominio pendientes — patrón flush para el dispatcher
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // Retorna los eventos pendientes sin vaciar la cola — solo para inspección
  getDomainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }
}
