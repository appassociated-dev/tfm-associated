import { describe, it, expect } from 'vitest';
import { Member } from '../aggregates/member';
import { MemberId } from '../value-objects/member-id';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberStatus } from '../value-objects/member-status';
import { StatusChangeReason } from '../value-objects/status-change-reason';
import { StatusTransitionValidator } from '../services/status-transition-validator';
import { MemberStatusChangedEvent } from '../events/member-status-changed.event';

describe('Member', () => {
  const validator = new StatusTransitionValidator();

  const createReason = (text: string) => {
    const result = StatusChangeReason.create(text);
    if (!result.ok) throw new Error('No debería fallar');
    return result.value;
  };

  // --- Factory create ---

  describe('create()', () => {
    it('debería crear un Member con estado APPLICANT, versión 0 e historial vacío', () => {
      const memberTypeId = MemberTypeId.create();
      const member = Member.create({ memberTypeId });

      expect(member.getCurrentStatus().equals(MemberStatus.APPLICANT)).toBe(true);
      expect(member.version).toBe(0);
      expect(member.getStatusHistory()).toHaveLength(0);
      expect(member.id).toBeDefined();
      expect(member.memberTypeId).toBe(memberTypeId);
    });
  });

  // --- Factory reconstitute ---

  describe('reconstitute()', () => {
    it('debería hidratar un Member desde persistencia', () => {
      const id = MemberId.create();
      const memberTypeId = MemberTypeId.create();

      const member = Member.reconstitute({
        id,
        memberTypeId,
        currentStatus: MemberStatus.ACTIVE,
        statusHistory: [],
        version: 3,
      });

      expect(member.id.equals(id)).toBe(true);
      expect(member.getCurrentStatus().equals(MemberStatus.ACTIVE)).toBe(true);
      expect(member.version).toBe(3);
    });
  });

  // --- changeStatus ---

  describe('changeStatus()', () => {
    it('debería transicionar ACTIVE → PENDING_PAYMENT exitosamente', () => {
      const member = createActiveMember();
      const reason = createReason('Impago de cuota trimestral');

      const result = member.changeStatus(
        MemberStatus.PENDING_PAYMENT,
        reason,
        'user-123',
        validator,
      );

      expect(result.ok).toBe(true);
      expect(member.getCurrentStatus().equals(MemberStatus.PENDING_PAYMENT)).toBe(true);
    });

    it('debería agregar una entrada al historial tras transición exitosa', () => {
      const member = createActiveMember();
      const reason = createReason('Impago de cuota');

      member.changeStatus(MemberStatus.PENDING_PAYMENT, reason, 'user-123', validator);

      const history = member.getStatusHistory();
      expect(history).toHaveLength(1);
      expect(history[0].previousStatus.equals(MemberStatus.ACTIVE)).toBe(true);
      expect(history[0].newStatus.equals(MemberStatus.PENDING_PAYMENT)).toBe(true);
      expect(history[0].changedBy).toBe('user-123');
    });

    it('debería emitir un MemberStatusChangedEvent tras transición exitosa', () => {
      const member = createActiveMember();
      const reason = createReason('Impago de cuota');

      member.changeStatus(MemberStatus.PENDING_PAYMENT, reason, 'user-123', validator);

      const events = member.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MemberStatusChangedEvent);

      const event = events[0] as MemberStatusChangedEvent;
      expect(event.payload.previousStatus).toBe('ACTIVE');
      expect(event.payload.newStatus).toBe('PENDING_PAYMENT');
      expect(event.payload.changedBy).toBe('user-123');
    });

    it('debería incrementar la versión tras transición exitosa', () => {
      const member = createActiveMember();
      const reason = createReason('Impago de cuota');

      expect(member.version).toBe(0);
      member.changeStatus(MemberStatus.PENDING_PAYMENT, reason, 'user-123', validator);
      expect(member.version).toBe(1);
    });

    it('debería rechazar transición inválida ACTIVE → DECEASED', () => {
      const member = createActiveMember();
      const reason = createReason('Fallecimiento');

      const result = member.changeStatus(MemberStatus.DECEASED, reason, 'user-123', validator);

      expect(result.ok).toBe(false);
      // Estado no cambiado
      expect(member.getCurrentStatus().equals(MemberStatus.ACTIVE)).toBe(true);
      // Historial no modificado
      expect(member.getStatusHistory()).toHaveLength(0);
      // Versión no incrementada
      expect(member.version).toBe(0);
      // Sin eventos
      expect(member.pullDomainEvents()).toHaveLength(0);
    });

    it('debería rechazar transición desde estado terminal DECEASED', () => {
      const member = createMemberWithStatus(MemberStatus.DECEASED);
      const reason = createReason('Intento de reactivación');

      const result = member.changeStatus(MemberStatus.ACTIVE, reason, 'user-123', validator);

      expect(result.ok).toBe(false);
      expect(member.getCurrentStatus().equals(MemberStatus.DECEASED)).toBe(true);
    });

    it('debería aceptar rehabilitación desde VOLUNTARY_LEAVE a ACTIVE (UC-013)', () => {
      const member = createMemberWithStatus(MemberStatus.VOLUNTARY_LEAVE);
      const reason = createReason('Rehabilitación aprobada');

      const result = member.changeStatus(MemberStatus.ACTIVE, reason, 'user-123', validator);

      expect(result.ok).toBe(true);
      expect(member.getCurrentStatus().equals(MemberStatus.ACTIVE)).toBe(true);
    });

    it('debería acumular múltiples transiciones secuenciales en el historial', () => {
      const member = createActiveMember();
      const reason1 = createReason('Impago detectado');
      const reason2 = createReason('Pago regularizado');

      member.changeStatus(MemberStatus.PENDING_PAYMENT, reason1, 'SYSTEM', validator);
      member.changeStatus(MemberStatus.ACTIVE, reason2, 'user-456', validator);

      const history = member.getStatusHistory();
      expect(history).toHaveLength(2);
      // Primera transición
      expect(history[0].previousStatus.equals(MemberStatus.ACTIVE)).toBe(true);
      expect(history[0].newStatus.equals(MemberStatus.PENDING_PAYMENT)).toBe(true);
      // Segunda transición
      expect(history[1].previousStatus.equals(MemberStatus.PENDING_PAYMENT)).toBe(true);
      expect(history[1].newStatus.equals(MemberStatus.ACTIVE)).toBe(true);

      // Versión incrementada dos veces
      expect(member.version).toBe(2);
    });
  });

  // --- Getters auxiliares ---

  describe('isActive()', () => {
    it('debería devolver true cuando el estado es ACTIVE', () => {
      const member = createActiveMember();
      expect(member.isActive()).toBe(true);
    });

    it('debería devolver false cuando el estado no es ACTIVE', () => {
      const member = createMemberWithStatus(MemberStatus.SUSPENDED);
      expect(member.isActive()).toBe(false);
    });
  });

  describe('isInGoodStanding()', () => {
    it('debería devolver true cuando el estado es ACTIVE', () => {
      const member = createActiveMember();
      expect(member.isInGoodStanding()).toBe(true);
    });

    it('debería devolver true cuando el estado es APPLICANT', () => {
      const memberTypeId = MemberTypeId.create();
      const member = Member.create({ memberTypeId });
      expect(member.isInGoodStanding()).toBe(true);
    });

    it('debería devolver false cuando el estado es SUSPENDED', () => {
      const member = createMemberWithStatus(MemberStatus.SUSPENDED);
      expect(member.isInGoodStanding()).toBe(false);
    });
  });

  // --- Helpers ---

  function createActiveMember(): Member {
    return Member.reconstitute({
      id: MemberId.create(),
      memberTypeId: MemberTypeId.create(),
      currentStatus: MemberStatus.ACTIVE,
      statusHistory: [],
      version: 0,
    });
  }

  function createMemberWithStatus(status: MemberStatus): Member {
    return Member.reconstitute({
      id: MemberId.create(),
      memberTypeId: MemberTypeId.create(),
      currentStatus: status,
      statusHistory: [],
      version: 0,
    });
  }
});
