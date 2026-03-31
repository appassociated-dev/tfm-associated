import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de provisión de tenant. */
export interface TenantProvisionedPayload {
  tenantId: string;
  organizationName: string;
  organizationType: string;
  adminUserId: string;
  adminEmail: string;
  cif: string;
}

/**
 * Evento de dominio emitido cuando se provisiona un nuevo tenant.
 * Contiene la información necesaria para que otros BCs reaccionen.
 */
export class TenantProvisionedEvent extends DomainEvent<TenantProvisionedPayload> {
  readonly eventType = 'TenantProvisioned';
}
