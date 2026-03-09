import { describe, it, expect } from 'vitest';
import { MemberTypeRulesEvaluator } from '../services/member-type-rules-evaluator';
import { MemberType } from '../aggregates/member-type';

/** Helper para crear un MemberType válido con opciones configurables. */
function createMemberType(overrides: Record<string, unknown> = {}): MemberType {
  const result = MemberType.create({
    code: 'SOCIO',
    name: 'Socio Numerario',
    description: 'Socio de pleno derecho',
    ageRangeMin: 18,
    ageRangeMax: 65,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 6,
    minimumSeniorityForOffice: 12,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    collectivityType: 'PENA',
    tenantId: '660e8400-e29b-41d4-a716-446655440001',
    ...overrides,
  });

  if (!result.ok) {
    throw new Error('Failed to create MemberType for test');
  }
  return result.value;
}

describe('MemberTypeRulesEvaluator', () => {
  const evaluator = new MemberTypeRulesEvaluator();

  // --- evaluateAgeEligibility ---

  describe('evaluateAgeEligibility', () => {
    it('debería ser elegible cuando la edad está dentro del rango', () => {
      const mt = createMemberType({ ageRangeMin: 18, ageRangeMax: 65 });
      // Fecha de nacimiento de alguien de 30 años
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const result = evaluator.evaluateAgeEligibility(mt, birthDate);

      expect(result.eligible).toBe(true);
    });

    it('debería no ser elegible cuando la edad está fuera del rango', () => {
      const mt = createMemberType({ ageRangeMin: 18, ageRangeMax: 65 });
      // Fecha de nacimiento de alguien de 10 años
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);

      const result = evaluator.evaluateAgeEligibility(mt, birthDate);

      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('debería ser elegible cuando no hay restricción de edad', () => {
      const mt = createMemberType({ ageRangeMin: null, ageRangeMax: null });
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 5);

      const result = evaluator.evaluateAgeEligibility(mt, birthDate);

      expect(result.eligible).toBe(true);
    });
  });

  // --- evaluateVotingRight ---

  describe('evaluateVotingRight', () => {
    it('debería tener derecho a voto con suficiente antigüedad', () => {
      const mt = createMemberType({
        votingRight: true,
        minimumSeniorityForVoting: 6,
      });
      // Registrado hace 12 meses
      const registrationDate = new Date();
      registrationDate.setMonth(registrationDate.getMonth() - 12);

      const result = evaluator.evaluateVotingRight(mt, registrationDate);

      expect(result.hasRight).toBe(true);
    });

    it('debería no tener derecho a voto sin suficiente antigüedad', () => {
      const mt = createMemberType({
        votingRight: true,
        minimumSeniorityForVoting: 12,
      });
      // Registrado hace 3 meses
      const registrationDate = new Date();
      registrationDate.setMonth(registrationDate.getMonth() - 3);

      const result = evaluator.evaluateVotingRight(mt, registrationDate);

      expect(result.hasRight).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.monthsRemaining).toBeGreaterThan(0);
    });

    it('debería no tener derecho a voto cuando votingRight es false', () => {
      const mt = createMemberType({ votingRight: false });
      const registrationDate = new Date();
      registrationDate.setFullYear(registrationDate.getFullYear() - 10);

      const result = evaluator.evaluateVotingRight(mt, registrationDate);

      expect(result.hasRight).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // --- evaluateOfficeEligibility ---

  describe('evaluateOfficeEligibility', () => {
    it('debería ser elegible para cargo con suficiente antigüedad', () => {
      const mt = createMemberType({
        eligibleForOffice: true,
        minimumSeniorityForOffice: 12,
      });
      // Registrado hace 24 meses
      const registrationDate = new Date();
      registrationDate.setMonth(registrationDate.getMonth() - 24);

      const result = evaluator.evaluateOfficeEligibility(mt, registrationDate);

      expect(result.eligible).toBe(true);
    });

    it('debería no ser elegible para cargo sin suficiente antigüedad', () => {
      const mt = createMemberType({
        eligibleForOffice: true,
        minimumSeniorityForOffice: 24,
      });
      // Registrado hace 6 meses
      const registrationDate = new Date();
      registrationDate.setMonth(registrationDate.getMonth() - 6);

      const result = evaluator.evaluateOfficeEligibility(mt, registrationDate);

      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.monthsRemaining).toBeGreaterThan(0);
    });

    it('debería no ser elegible cuando eligibleForOffice es false', () => {
      const mt = createMemberType({ eligibleForOffice: false });
      const registrationDate = new Date();
      registrationDate.setFullYear(registrationDate.getFullYear() - 10);

      const result = evaluator.evaluateOfficeEligibility(mt, registrationDate);

      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
