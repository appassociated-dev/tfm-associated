import { describe, it, expect } from 'vitest';
import { MemberStatus } from '../value-objects/member-status';

describe('MemberStatus', () => {
  // --- Instancias estáticas ---

  it.each([
    ['ACTIVE', MemberStatus.ACTIVE],
    ['PENDING_PAYMENT', MemberStatus.PENDING_PAYMENT],
    ['SUSPENDED', MemberStatus.SUSPENDED],
    ['APPLICANT', MemberStatus.APPLICANT],
    ['VOLUNTARY_LEAVE', MemberStatus.VOLUNTARY_LEAVE],
    ['NONPAYMENT_LEAVE', MemberStatus.NONPAYMENT_LEAVE],
    ['DISCIPLINARY_LEAVE', MemberStatus.DISCIPLINARY_LEAVE],
    ['DECEASED', MemberStatus.DECEASED],
  ])('debería tener el singleton %s definido con valor correcto', (expected, status) => {
    expect(status).toBeDefined();
    expect(status.value).toBe(expected);
  });

  // --- fromString ---

  it.each([
    ['ACTIVE', MemberStatus.ACTIVE],
    ['PENDING_PAYMENT', MemberStatus.PENDING_PAYMENT],
    ['SUSPENDED', MemberStatus.SUSPENDED],
    ['APPLICANT', MemberStatus.APPLICANT],
    ['VOLUNTARY_LEAVE', MemberStatus.VOLUNTARY_LEAVE],
    ['NONPAYMENT_LEAVE', MemberStatus.NONPAYMENT_LEAVE],
    ['DISCIPLINARY_LEAVE', MemberStatus.DISCIPLINARY_LEAVE],
    ['DECEASED', MemberStatus.DECEASED],
  ])('debería devolver la instancia singleton para fromString("%s")', (value, singleton) => {
    expect(MemberStatus.fromString(value)).toBe(singleton);
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
