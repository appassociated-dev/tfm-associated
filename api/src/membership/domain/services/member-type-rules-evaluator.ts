import { MemberType } from '../aggregates/member-type';

/** Resultado de la evaluación de elegibilidad por edad. */
export interface AgeEligibilityResult {
  eligible: boolean;
  reason?: string;
}

/** Resultado de la evaluación de derecho a voto. */
export interface VotingRightResult {
  hasRight: boolean;
  reason?: string;
  monthsRemaining?: number;
}

/** Resultado de la evaluación de elegibilidad para cargo. */
export interface OfficeEligibilityResult {
  eligible: boolean;
  reason?: string;
  monthsRemaining?: number;
}

/**
 * Servicio de dominio que evalúa las reglas de un tipo de socio.
 * Encapsula la lógica de evaluación de elegibilidad, voto y cargos.
 */
export class MemberTypeRulesEvaluator {
  /**
   * Evalúa si una persona con la fecha de nacimiento dada es elegible por edad.
   * @param memberType Tipo de socio a evaluar.
   * @param birthDate Fecha de nacimiento de la persona.
   */
  evaluateAgeEligibility(memberType: MemberType, birthDate: Date): AgeEligibilityResult {
    const age = this.calculateAge(birthDate);
    const eligible = memberType.canAcceptAge(age);

    if (eligible) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason: `Age ${age} is not within the accepted range for member type '${memberType.code.value}'`,
    };
  }

  /**
   * Evalúa si un socio tiene derecho a voto según su fecha de registro.
   * @param memberType Tipo de socio a evaluar.
   * @param registrationDate Fecha de registro del socio.
   */
  evaluateVotingRight(memberType: MemberType, registrationDate: Date): VotingRightResult {
    if (!memberType.votingRight) {
      return {
        hasRight: false,
        reason: `Member type '${memberType.code.value}' does not have voting rights`,
      };
    }

    const seniorityMonths = this.calculateMonthsDiff(registrationDate);
    const hasRight = memberType.hasVotingRight(seniorityMonths);

    if (hasRight) {
      return { hasRight: true };
    }

    const monthsRemaining = memberType.minimumSeniorityForVoting - seniorityMonths;
    return {
      hasRight: false,
      reason: `Insufficient seniority: ${seniorityMonths} months, requires ${memberType.minimumSeniorityForVoting}`,
      monthsRemaining: Math.max(0, monthsRemaining),
    };
  }

  /**
   * Evalúa si un socio es elegible para cargo según su fecha de registro.
   * @param memberType Tipo de socio a evaluar.
   * @param registrationDate Fecha de registro del socio.
   */
  evaluateOfficeEligibility(
    memberType: MemberType,
    registrationDate: Date,
  ): OfficeEligibilityResult {
    if (!memberType.eligibleForOffice) {
      return {
        eligible: false,
        reason: `Member type '${memberType.code.value}' is not eligible for office`,
      };
    }

    const seniorityMonths = this.calculateMonthsDiff(registrationDate);
    const eligible = memberType.isEligibleForOffice(seniorityMonths);

    if (eligible) {
      return { eligible: true };
    }

    const monthsRemaining = memberType.minimumSeniorityForOffice - seniorityMonths;
    return {
      eligible: false,
      reason: `Insufficient seniority: ${seniorityMonths} months, requires ${memberType.minimumSeniorityForOffice}`,
      monthsRemaining: Math.max(0, monthsRemaining),
    };
  }

  /** Calcula la edad en años a partir de la fecha de nacimiento. */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /** Calcula la diferencia en meses entre una fecha y hoy. */
  private calculateMonthsDiff(fromDate: Date): number {
    const today = new Date();
    const years = today.getFullYear() - fromDate.getFullYear();
    const months = today.getMonth() - fromDate.getMonth();
    return years * 12 + months;
  }
}
