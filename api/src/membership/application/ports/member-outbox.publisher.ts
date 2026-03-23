import { DomainEvent } from '../../../shared/domain';

export const MEMBER_OUTBOX_PUBLISHER = Symbol('MEMBER_OUTBOX_PUBLISHER');

export interface MemberOutboxPublisher {
  publish(tenantId: string, events: DomainEvent[]): Promise<void>;
}
