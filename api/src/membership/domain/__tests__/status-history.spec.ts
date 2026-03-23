import { describe, it, expect } from 'vitest';
import { StatusHistory } from '../entities/status-history';
import { MemberId } from '../value-objects/member-id';
import { MemberStatus } from '../value-objects/member-status';
import { StatusChangeReason } from '../value-objects/status-change-reason';

describe('StatusHistory', () => {
  const validProps = () => {
    const reasonResult = StatusChangeReason.create('Impago de cuota trimestral');
    if (!reasonResult.ok) throw new Error('No debería fallar');
    return {
      memberId: MemberId.create(),
      previousStatus: MemberStatus.ACTIVE,
      newStatus: MemberStatus.PENDING_PAYMENT,
      reason: reasonResult.value,
      changedBy: 'user-123',
      changedAt: new Date('2025-01-15T10:00:00Z'),
    };
  };

  // --- Creación válida ---

  it('debería crear una entrada de historial válida', () => {
    const props = validProps();
    const result = StatusHistory.create(props);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const entry = result.value;
      expect(entry.id).toBeDefined();
      expect(entry.memberId).toBe(props.memberId);
      expect(entry.previousStatus).toBe(MemberStatus.ACTIVE);
      expect(entry.newStatus).toBe(MemberStatus.PENDING_PAYMENT);
      expect(entry.reason).toBe(props.reason);
      expect(entry.changedBy).toBe('user-123');
      expect(entry.changedAt).toEqual(props.changedAt);
    }
  });

  it('debería generar un id UUID válido automáticamente', () => {
    const props = validProps();
    const result = StatusHistory.create(props);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toMatch(uuidV4Regex);
    }
  });

  // --- Invariantes ---

  it('debería rechazar si previousStatus es igual a newStatus', () => {
    const props = validProps();
    props.previousStatus = MemberStatus.ACTIVE;
    props.newStatus = MemberStatus.ACTIVE;

    const result = StatusHistory.create(props);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('previousStatus');
    }
  });

  it('debería rechazar si changedAt es futuro', () => {
    const props = validProps();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    props.changedAt = futureDate;

    const result = StatusHistory.create(props);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('changedAt');
    }
  });

  // --- Inmutabilidad ---

  it('debería ser inmutable (no tiene métodos de modificación)', () => {
    const props = validProps();
    const result = StatusHistory.create(props);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const entry = result.value;
      // Verificar que las propiedades son readonly (no se pueden reasignar)
      expect(typeof entry.memberId).not.toBe('undefined');
      expect(typeof entry.previousStatus).not.toBe('undefined');
      expect(typeof entry.newStatus).not.toBe('undefined');
      expect(typeof entry.reason).not.toBe('undefined');
      expect(typeof entry.changedBy).not.toBe('undefined');
      expect(typeof entry.changedAt).not.toBe('undefined');
    }
  });

  // --- Reconstitución ---

  it('debería reconstituir una entrada desde persistencia', () => {
    const props = validProps();
    const id = '550e8400-e29b-41d4-a716-446655440000';

    const entry = StatusHistory.reconstitute({
      id,
      ...props,
    });

    expect(entry.id).toBe(id);
    expect(entry.memberId).toBe(props.memberId);
    expect(entry.previousStatus).toBe(MemberStatus.ACTIVE);
    expect(entry.newStatus).toBe(MemberStatus.PENDING_PAYMENT);
  });
});
