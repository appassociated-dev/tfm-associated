// Barrel de exportaciones del Shared Kernel de dominio — clases base DDD y puertos de observabilidad
export { Entity } from './entity.base';
export { ValueObject } from './value-object.base';
export { DomainEvent } from './domain-event.base';
export { AggregateRoot } from './aggregate-root.base';
export { Identifier } from './identifier.base';
export type { IRepository } from './repository.interface';
export { ERROR_REPORTER } from './ports/error-reporter.port';
export type { ErrorReporter } from './ports/error-reporter.port';
export { EVENT_TRACKER } from './ports/event-tracker.port';
export type { EventTracker } from './ports/event-tracker.port';
