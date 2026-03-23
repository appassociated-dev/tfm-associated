// Factories de datos de membership.
// Producen objetos que pasan los Zod schemas de member-leave y member-registration.

import type {
  LeaveSummary,
  ReinstatementSummary,
} from '@/features/membership/leave/schemas/member-leave.schemas';
import type {
  MemberType,
  RegistrationResponse,
} from '@/features/membership/registration/schemas/member-registration.schemas';

let memberCounter = 0;

/**
 * Genera un UUID v4 determinista basado en un prefijo y contador.
 */
function deterministicUuid(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  const pfx = prefix.padEnd(8, '0').slice(0, 8);
  return `${pfx}-0000-4000-8000-${hex}`;
}

/**
 * Construye un MemberType (tipo de socio) con defaults deterministas.
 */
export function buildMemberType(overrides?: Partial<MemberType>): MemberType {
  memberCounter++;
  return {
    id: deterministicUuid('c0000001', memberCounter),
    code: `SOCIO-${memberCounter}`,
    name: `Tipo Socio ${memberCounter}`,
    description: null,
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: false,
    active: true,
    ...overrides,
  };
}

/**
 * Construye un LeaveSummary (resumen previo a baja).
 */
export function buildLeaveSummary(overrides?: Partial<LeaveSummary>): LeaveSummary {
  memberCounter++;
  const memberId = deterministicUuid('d0000001', memberCounter);
  return {
    memberId,
    memberName: `Socio Test ${memberCounter}`,
    memberNumber: `SOC-${String(memberCounter).padStart(4, '0')}`,
    currentStatus: 'ACTIVE',
    effectiveDateOptions: [
      {
        type: 'IMMEDIATE',
        effectiveDate: '2026-03-22T00:00:00.000Z',
        label: 'Inmediata',
      },
      {
        type: 'END_OF_FISCAL_YEAR',
        effectiveDate: '2026-12-31T00:00:00.000Z',
        label: 'Fin del ejercicio fiscal',
      },
    ],
    activeSubscriptions: [
      {
        subscriptionId: deterministicUuid('e0000001', memberCounter),
        feePlanCode: 'CUOTA-ANUAL',
        feePlanName: 'Cuota Anual',
        amount: 12000,
        startDate: '2026-01-01T00:00:00.000Z',
      },
    ],
    pendingCharges: [],
    totalPendingDebt: 0,
    ...overrides,
  };
}

/**
 * Construye un ReinstatementSummary (resumen de rehabilitación).
 */
export function buildReinstatementSummary(
  overrides?: Partial<ReinstatementSummary>,
): ReinstatementSummary {
  memberCounter++;
  return {
    memberId: deterministicUuid('d0000001', memberCounter),
    memberName: `Ex-Socio ${memberCounter}`,
    leaveDate: '2025-06-15T00:00:00.000Z',
    leaveType: 'VOLUNTARY_LEAVE',
    pendingDebt: 0,
    penalty: 2500,
    newRegistrationFee: 5000,
    totalToPay: 7500,
    keepSeniority: true,
    ...overrides,
  };
}

/**
 * Construye una RegistrationResponse (respuesta de alta exitosa).
 */
export function buildRegistrationResponse(
  overrides?: Partial<RegistrationResponse>,
): RegistrationResponse {
  memberCounter++;
  return {
    memberId: deterministicUuid('d0000001', memberCounter),
    memberNumber: `SOC-${String(memberCounter).padStart(4, '0')}`,
    status: 'ACTIVE',
    memberTypeName: 'Socio Ordinario',
    registrationDate: '2026-03-22T00:00:00.000Z',
    registrationCharge: null,
    ...overrides,
  };
}

/**
 * Resetea el contador de member factories.
 */
export function resetMemberCounters(): void {
  memberCounter = 0;
}
