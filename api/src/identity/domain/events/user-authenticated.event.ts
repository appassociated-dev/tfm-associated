import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de autenticación exitosa de usuario. */
export interface UserAuthenticatedPayload {
  userId: string;
  tenantId: string;
  email: string;
  rol: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Evento de dominio emitido cuando un usuario se autentica exitosamente.
 * Puede ser consumido por auditoría u otros BCs para registrar accesos.
 */
export class UserAuthenticatedEvent extends DomainEvent<UserAuthenticatedPayload> {
  readonly eventType = 'UserAuthenticated';
}
