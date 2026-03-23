import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de fallo de autenticación. */
export interface AuthenticationFailedPayload {
  email: string;
  ipAddress: string;
  timestamp: Date;
  attemptCount: number;
}

/**
 * Evento de dominio emitido cuando un intento de autenticación falla.
 * Útil para auditoría y detección de ataques de fuerza bruta.
 */
export class AuthenticationFailedEvent extends DomainEvent<AuthenticationFailedPayload> {
  readonly eventType = 'identity.authentication.failed';
}
