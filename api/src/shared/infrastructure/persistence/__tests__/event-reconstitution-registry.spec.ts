import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventReconstitutionRegistry,
  EventTypeNotRegisteredError,
} from '../event-reconstitution.registry';
import { DomainEvent, type DomainEventParams } from '../../../domain/domain-event.base';

// --- Clase de evento concreta para tests ---
interface MemberRegisteredPayload {
  memberNumber: string;
  name: string;
}

class MemberRegisteredEvent extends DomainEvent<MemberRegisteredPayload> {
  readonly eventType = 'MemberRegistered';

  constructor(params: DomainEventParams<MemberRegisteredPayload>) {
    super(params);
  }
}

// --- Helper: fila de outbox simulada ---
const makeOutboxRow = (
  overrides?: Partial<{
    id: string;
    eventType: string;
    payload: unknown;
    aggregateId: string;
    aggregateType: string;
    boundedContext: string;
    actorId: string | null;
    createdAt: Date;
    retryCount: number;
    maxRetries: number;
    status: string;
    processingStartedAt: Date | null;
  }>,
) => ({
  id: '550e8400-e29b-41d4-a716-000000000001',
  eventType: 'MemberRegistered',
  payload: { memberNumber: 'M-001', name: 'Juan García' },
  aggregateId: '550e8400-e29b-41d4-a716-000000000002',
  aggregateType: 'Member',
  boundedContext: 'BC-Membership',
  actorId: '550e8400-e29b-41d4-a716-000000000003',
  createdAt: new Date('2026-01-01T10:00:00Z'),
  retryCount: 0,
  maxRetries: 3,
  status: 'processing',
  processingStartedAt: null,
  ...overrides,
});

describe('EventReconstitutionRegistry', () => {
  let registry: EventReconstitutionRegistry;

  beforeEach(() => {
    registry = new EventReconstitutionRegistry();
  });

  describe('register + reconstitute — flujo exitoso', () => {
    it('deberia retornar una instancia del tipo correcto al reconstituir', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      const row = makeOutboxRow();
      const event = registry.reconstitute(row.eventType, row);

      expect(event).toBeInstanceOf(MemberRegisteredEvent);
    });

    it('deberia mapear correctamente todos los campos del outbox al evento', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      const row = makeOutboxRow();
      const event = registry.reconstitute(row.eventType, row);

      expect(event.eventId).toBe(row.id);
      expect(event.aggregateId).toBe(row.aggregateId);
      expect(event.aggregateType).toBe(row.aggregateType);
      expect(event.boundedContext).toBe(row.boundedContext);
      expect(event.actorId).toBe(row.actorId);
      expect(event.payload).toEqual(row.payload);
    });

    it('deberia asignar occurredOn desde createdAt de la fila del outbox', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      const createdAt = new Date('2026-03-15T12:00:00Z');
      const row = makeOutboxRow({ createdAt });
      const event = registry.reconstitute(row.eventType, row);

      expect(event.occurredOn).toEqual(createdAt);
    });

    it('deberia manejar actorId null (operaciones de sistema)', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      const row = makeOutboxRow({ actorId: null });
      const event = registry.reconstitute(row.eventType, row);

      expect(event.actorId).toBeUndefined();
    });
  });

  describe('reconstitute — tipo desconocido', () => {
    it('deberia lanzar EventTypeNotRegisteredError si el tipo no está registrado', () => {
      const row = makeOutboxRow({ eventType: 'UnknownEvent' });

      expect(() => registry.reconstitute('UnknownEvent', row)).toThrow(EventTypeNotRegisteredError);
    });

    it('deberia incluir el nombre del tipo desconocido en el mensaje de error', () => {
      const row = makeOutboxRow({ eventType: 'GhostEvent' });

      expect(() => registry.reconstitute('GhostEvent', row)).toThrow('GhostEvent');
    });
  });

  describe('register — multiples tipos', () => {
    class FeePlanCreatedEvent extends DomainEvent<{ planName: string }> {
      readonly eventType = 'FeePlanCreated';
      constructor(params: DomainEventParams<{ planName: string }>) {
        super(params);
      }
    }

    it('deberia registrar y reconstituir multiples tipos independientemente', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);
      registry.register('FeePlanCreated', FeePlanCreatedEvent);

      const memberRow = makeOutboxRow({
        eventType: 'MemberRegistered',
        payload: { memberNumber: 'M-001', name: 'Test' },
      });
      const feeRow = makeOutboxRow({
        eventType: 'FeePlanCreated',
        payload: { planName: 'Basic' },
        aggregateType: 'FeePlan',
        boundedContext: 'BC-Treasury',
      });

      const memberEvent = registry.reconstitute('MemberRegistered', memberRow);
      const feeEvent = registry.reconstitute('FeePlanCreated', feeRow);

      expect(memberEvent).toBeInstanceOf(MemberRegisteredEvent);
      expect(feeEvent).toBeInstanceOf(FeePlanCreatedEvent);
    });
  });

  describe('register — duplicados', () => {
    class DuplicateEvent extends DomainEvent<{ value: string }> {
      readonly eventType = 'MemberRegistered';
      constructor(params: DomainEventParams<{ value: string }>) {
        super(params);
      }
    }

    it('deberia lanzar error si se registra el mismo eventType con una clase diferente', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      // Intentar registrar el mismo eventType con una clase distinta debe lanzar error
      expect(() => registry.register('MemberRegistered', DuplicateEvent as never)).toThrow(
        /MemberRegistered/,
      );
    });

    it('deberia ser idempotente si se registra el mismo eventType con la misma clase', () => {
      registry.register('MemberRegistered', MemberRegisteredEvent);

      // Registrar la misma clase dos veces no debe lanzar error
      expect(() => registry.register('MemberRegistered', MemberRegisteredEvent)).not.toThrow();
    });
  });
});
