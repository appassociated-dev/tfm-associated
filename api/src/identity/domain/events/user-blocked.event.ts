import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de bloqueo de usuario. */
export interface UserBlockedPayload {
  userId: string;
  email: string;
  blockReason: string;
  blockDuration: number;
  timestamp: Date;
}

/**
 * Evento de dominio emitido cuando un usuario es bloqueado.
 * Puede ser consumido para notificaciones o auditoría de seguridad.
 */
export class UserBlockedEvent extends DomainEvent<UserBlockedPayload> {
  readonly eventType = 'identity.user.blocked';
}
