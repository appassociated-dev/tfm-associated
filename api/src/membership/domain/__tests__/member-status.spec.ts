import { describe, it, expect } from 'vitest';
import { MemberStatus } from '../value-objects/member-status';

describe('MemberStatus', () => {
  // --- Instancias estáticas ---

  it('debería tener 8 estados definidos como singletons', () => {
    expect(MemberStatus.ACTIVE).toBeDefined();
    expect(MemberStatus.PENDING_PAYMENT).toBeDefined();
    expect(MemberStatus.SUSPENDED).toBeDefined();
    expect(MemberStatus.APPLICANT).toBeDefined();
    expect(MemberStatus.VOLUNTARY_LEAVE).toBeDefined();
    expect(MemberStatus.NONPAYMENT_LEAVE).toBeDefined();
    expect(MemberStatus.DISCIPLINARY_LEAVE).toBeDefined();
    expect(MemberStatus.DECEASED).toBeDefined();
  });

  it('debería devolver el valor textual correcto para cada estado', () => {
    expect(MemberStatus.ACTIVE.value).toBe('ACTIVE');
    expect(MemberStatus.PENDING_PAYMENT.value).toBe('PENDING_PAYMENT');
    expect(MemberStatus.SUSPENDED.value).toBe('SUSPENDED');
    expect(MemberStatus.APPLICANT.value).toBe('APPLICANT');
    expect(MemberStatus.VOLUNTARY_LEAVE.value).toBe('VOLUNTARY_LEAVE');
    expect(MemberStatus.NONPAYMENT_LEAVE.value).toBe('NONPAYMENT_LEAVE');
    expect(MemberStatus.DISCIPLINARY_LEAVE.value).toBe('DISCIPLINARY_LEAVE');
    expect(MemberStatus.DECEASED.value).toBe('DECEASED');
  });

  // --- fromString ---

  it('debería crear un MemberStatus desde un string válido', () => {
    const status = MemberStatus.fromString('ACTIVE');
    expect(status).toBe(MemberStatus.ACTIVE);
  });

  it('debería devolver la misma instancia singleton con fromString()', () => {
    expect(MemberStatus.fromString('PENDING_PAYMENT')).toBe(MemberStatus.PENDING_PAYMENT);
    expect(MemberStatus.fromString('SUSPENDED')).toBe(MemberStatus.SUSPENDED);
    expect(MemberStatus.fromString('APPLICANT')).toBe(MemberStatus.APPLICANT);
    expect(MemberStatus.fromString('VOLUNTARY_LEAVE')).toBe(MemberStatus.VOLUNTARY_LEAVE);
    expect(MemberStatus.fromString('NONPAYMENT_LEAVE')).toBe(MemberStatus.NONPAYMENT_LEAVE);
    expect(MemberStatus.fromString('DISCIPLINARY_LEAVE')).toBe(MemberStatus.DISCIPLINARY_LEAVE);
    expect(MemberStatus.fromString('DECEASED')).toBe(MemberStatus.DECEASED);
  });

  it('debería lanzar error con fromString() si el valor no es válido', () => {
    expect(() => MemberStatus.fromString('INVALID')).toThrow();
    expect(() => MemberStatus.fromString('')).toThrow();
  });

  // --- equals ---

  it('debería ser igual a sí mismo', () => {
    expect(MemberStatus.ACTIVE.equals(MemberStatus.ACTIVE)).toBe(true);
  });

  it('debería ser diferente a otro estado', () => {
    expect(MemberStatus.ACTIVE.equals(MemberStatus.SUSPENDED)).toBe(false);
  });

  it('debería devolver false al comparar con undefined', () => {
    expect(MemberStatus.ACTIVE.equals(undefined)).toBe(false);
  });
});
