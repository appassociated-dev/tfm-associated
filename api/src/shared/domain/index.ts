// Clases base DDD — Shared Kernel
export { Identifier } from './identifier.base';
export { ValueObject } from './value-object.base';
export { Entity } from './entity.base';
export { DomainEvent } from './domain-event.base';
export { AggregateRoot } from './aggregate-root.base';

// Interfaces de repositorio
export type { Repository } from './repository.interface';

// Value Objects compartidos
export { EncryptedSecret } from './value-objects/encrypted-secret';

// Puertos de cifrado
export type { EncryptionService } from './ports/encryption-service.port';
export { ENCRYPTION_SERVICE } from './ports/encryption-service.port';

// Puerto de credenciales de tenant (consumidores cross-BC)
export type { TenantCredentialProvider } from './ports/tenant-credential-provider.port';
export { TENANT_CREDENTIAL_PROVIDER } from './ports/tenant-credential-provider.port';

// Puertos de observabilidad
export type { ErrorReporter } from './ports/error-reporter.port';
export { ERROR_REPORTER } from './ports/error-reporter.port';
export type { EventTracker } from './ports/event-tracker.port';
export { EVENT_TRACKER } from './ports/event-tracker.port';
