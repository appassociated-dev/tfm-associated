// Clases base DDD — Shared Kernel
export { Identifier } from './identifier.base';
export { ValueObject } from './value-object.base';
export { Entity } from './entity.base';
export { DomainEvent } from './domain-event.base';
export { AggregateRoot } from './aggregate-root.base';

// Interfaces de repositorio
export type { Repository } from './repository.interface';

// Puertos de observabilidad
export type { ErrorReporter } from './ports/error-reporter.port';
export { ERROR_REPORTER } from './ports/error-reporter.port';
export type { EventTracker } from './ports/event-tracker.port';
export { EVENT_TRACKER } from './ports/event-tracker.port';
