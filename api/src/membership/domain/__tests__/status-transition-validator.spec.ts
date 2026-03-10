import { describe, it, expect } from 'vitest';
import { StatusTransitionValidator } from '../services/status-transition-validator';
import { MemberStatus } from '../value-objects/member-status';

describe('StatusTransitionValidator', () => {
  const validator = new StatusTransitionValidator();

  // --- Transiciones válidas ---

  describe('validate() — transiciones válidas', () => {
    const validTransitions: [MemberStatus, MemberStatus][] = [
      // Desde ACTIVE
      [MemberStatus.ACTIVE, MemberStatus.PENDING_PAYMENT],
      [MemberStatus.ACTIVE, MemberStatus.SUSPENDED],
      [MemberStatus.ACTIVE, MemberStatus.VOLUNTARY_LEAVE],
      // Desde PENDING_PAYMENT
      [MemberStatus.PENDING_PAYMENT, MemberStatus.ACTIVE],
      [MemberStatus.PENDING_PAYMENT, MemberStatus.SUSPENDED],
      [MemberStatus.PENDING_PAYMENT, MemberStatus.NONPAYMENT_LEAVE],
      // Desde SUSPENDED
      [MemberStatus.SUSPENDED, MemberStatus.ACTIVE],
      [MemberStatus.SUSPENDED, MemberStatus.DISCIPLINARY_LEAVE],
      // Desde APPLICANT
      [MemberStatus.APPLICANT, MemberStatus.ACTIVE],
      [MemberStatus.APPLICANT, MemberStatus.VOLUNTARY_LEAVE],
    ];

    it.each(validTransitions)('debería aceptar transición de %s a %s', (from, to) => {
      const result = validator.validate(from, to);
      expect(result.ok).toBe(true);
    });
  });

  // --- Transiciones inválidas ---

  describe('validate() — transiciones inválidas', () => {
    const invalidTransitions: [MemberStatus, MemberStatus][] = [
      // Desde ACTIVE a estados no permitidos
      [MemberStatus.ACTIVE, MemberStatus.DECEASED],
      [MemberStatus.ACTIVE, MemberStatus.APPLICANT],
      [MemberStatus.ACTIVE, MemberStatus.NONPAYMENT_LEAVE],
      [MemberStatus.ACTIVE, MemberStatus.DISCIPLINARY_LEAVE],
      // Desde PENDING_PAYMENT a estados no permitidos
      [MemberStatus.PENDING_PAYMENT, MemberStatus.DECEASED],
      [MemberStatus.PENDING_PAYMENT, MemberStatus.VOLUNTARY_LEAVE],
      // Desde SUSPENDED a estados no permitidos
      [MemberStatus.SUSPENDED, MemberStatus.PENDING_PAYMENT],
      [MemberStatus.SUSPENDED, MemberStatus.DECEASED],
      // Desde APPLICANT a estados no permitidos
      [MemberStatus.APPLICANT, MemberStatus.PENDING_PAYMENT],
      [MemberStatus.APPLICANT, MemberStatus.DECEASED],
    ];

    it.each(invalidTransitions)('debería rechazar transición de %s a %s', (from, to) => {
      const result = validator.validate(from, to);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MEMBER.TRANSITION_NOT_ALLOWED');
      }
    });
  });

  // --- Transiciones desde estados inmutables ---

  describe('validate() — desde estados inmutables', () => {
    const immutableStates = [MemberStatus.DISCIPLINARY_LEAVE, MemberStatus.DECEASED];

    it.each(immutableStates)(
      'debería rechazar cualquier transición desde %s',
      (immutableStatus) => {
        const result = validator.validate(immutableStatus, MemberStatus.ACTIVE);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('MEMBER.TRANSITION_NOT_ALLOWED');
        }
      },
    );
  });

  // --- Transiciones de rehabilitación (UC-013) ---

  describe('validate() — rehabilitación desde estados de baja', () => {
    it('debería aceptar transición de VOLUNTARY_LEAVE a ACTIVE', () => {
      const result = validator.validate(MemberStatus.VOLUNTARY_LEAVE, MemberStatus.ACTIVE);
      expect(result.ok).toBe(true);
    });

    it('debería aceptar transición de NONPAYMENT_LEAVE a ACTIVE', () => {
      const result = validator.validate(MemberStatus.NONPAYMENT_LEAVE, MemberStatus.ACTIVE);
      expect(result.ok).toBe(true);
    });
  });

  // --- getAvailableTransitions ---

  describe('getAvailableTransitions()', () => {
    it('debería devolver 3 transiciones para ACTIVE', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.ACTIVE);
      expect(transitions).toHaveLength(3);
      expect(transitions).toContainEqual(MemberStatus.PENDING_PAYMENT);
      expect(transitions).toContainEqual(MemberStatus.SUSPENDED);
      expect(transitions).toContainEqual(MemberStatus.VOLUNTARY_LEAVE);
    });

    it('debería devolver 3 transiciones para PENDING_PAYMENT', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.PENDING_PAYMENT);
      expect(transitions).toHaveLength(3);
      expect(transitions).toContainEqual(MemberStatus.ACTIVE);
      expect(transitions).toContainEqual(MemberStatus.SUSPENDED);
      expect(transitions).toContainEqual(MemberStatus.NONPAYMENT_LEAVE);
    });

    it('debería devolver 3 transiciones para SUSPENDED', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.SUSPENDED);
      expect(transitions).toHaveLength(3);
      expect(transitions).toContainEqual(MemberStatus.ACTIVE);
      expect(transitions).toContainEqual(MemberStatus.DISCIPLINARY_LEAVE);
      expect(transitions).toContainEqual(MemberStatus.NONPAYMENT_LEAVE);
    });

    it('debería devolver 2 transiciones para APPLICANT', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.APPLICANT);
      expect(transitions).toHaveLength(2);
      expect(transitions).toContainEqual(MemberStatus.ACTIVE);
      expect(transitions).toContainEqual(MemberStatus.VOLUNTARY_LEAVE);
    });

    it('debería devolver 1 transición para VOLUNTARY_LEAVE (rehabilitación)', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.VOLUNTARY_LEAVE);
      expect(transitions).toHaveLength(1);
      expect(transitions).toContainEqual(MemberStatus.ACTIVE);
    });

    it('debería devolver 1 transición para NONPAYMENT_LEAVE (rehabilitación)', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.NONPAYMENT_LEAVE);
      expect(transitions).toHaveLength(1);
      expect(transitions).toContainEqual(MemberStatus.ACTIVE);
    });

    it('debería devolver array vacío para DISCIPLINARY_LEAVE', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.DISCIPLINARY_LEAVE);
      expect(transitions).toHaveLength(0);
    });

    it('debería devolver array vacío para DECEASED', () => {
      const transitions = validator.getAvailableTransitions(MemberStatus.DECEASED);
      expect(transitions).toHaveLength(0);
    });
  });

  // --- isTerminal ---

  describe('isTerminal()', () => {
    it('debería devolver true para estados terminales (inmutables)', () => {
      expect(validator.isTerminal(MemberStatus.DISCIPLINARY_LEAVE)).toBe(true);
      expect(validator.isTerminal(MemberStatus.DECEASED)).toBe(true);
    });

    it('debería devolver false para estados de baja rehabilitables', () => {
      expect(validator.isTerminal(MemberStatus.VOLUNTARY_LEAVE)).toBe(false);
      expect(validator.isTerminal(MemberStatus.NONPAYMENT_LEAVE)).toBe(false);
    });

    it('debería devolver false para estados no terminales', () => {
      expect(validator.isTerminal(MemberStatus.ACTIVE)).toBe(false);
      expect(validator.isTerminal(MemberStatus.PENDING_PAYMENT)).toBe(false);
      expect(validator.isTerminal(MemberStatus.SUSPENDED)).toBe(false);
      expect(validator.isTerminal(MemberStatus.APPLICANT)).toBe(false);
    });
  });

  // --- isImmutable ---

  describe('isImmutable()', () => {
    it('debería devolver true solo para DISCIPLINARY_LEAVE y DECEASED', () => {
      expect(validator.isImmutable(MemberStatus.DISCIPLINARY_LEAVE)).toBe(true);
      expect(validator.isImmutable(MemberStatus.DECEASED)).toBe(true);
    });

    it('debería devolver false para estados rehabilitables y no terminales', () => {
      expect(validator.isImmutable(MemberStatus.VOLUNTARY_LEAVE)).toBe(false);
      expect(validator.isImmutable(MemberStatus.NONPAYMENT_LEAVE)).toBe(false);
      expect(validator.isImmutable(MemberStatus.ACTIVE)).toBe(false);
      expect(validator.isImmutable(MemberStatus.PENDING_PAYMENT)).toBe(false);
      expect(validator.isImmutable(MemberStatus.SUSPENDED)).toBe(false);
      expect(validator.isImmutable(MemberStatus.APPLICANT)).toBe(false);
    });
  });
});
