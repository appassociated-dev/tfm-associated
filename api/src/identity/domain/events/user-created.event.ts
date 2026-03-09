import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de creación de usuario. */
export interface UserCreatedPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: Date;
}

/**
 * Evento de dominio emitido cuando se crea un nuevo usuario.
 * Puede ser consumido por auditoría u otros BCs.
 */
export class UserCreatedEvent extends DomainEvent<UserCreatedPayload> {
  readonly eventType = 'user.created';
}
