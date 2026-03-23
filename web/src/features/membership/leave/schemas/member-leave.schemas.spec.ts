import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  leaveTypeSchema,
  effectiveDateConfigSchema,
  leaveSummarySchema,
  voluntaryLeaveRequestSchema,
  leaveResponseSchema,
  reinstatementSummarySchema,
  reinstatementRequestSchema,
  statusHistoryEntrySchema,
  availableTransitionsSchema,
} from './member-leave.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';
const VALID_DATETIME = '2026-03-15T10:00:00.000Z';

const validLeaveSummary = {
  memberId: VALID_UUID,
  memberName: 'Juan García López',
  memberNumber: 'SOC-001',
  currentStatus: 'ACTIVE',
  effectiveDateOptions: [
    {
      type: 'IMMEDIATE' as const,
      effectiveDate: VALID_DATETIME,
      label: 'Inmediata',
    },
  ],
  activeSubscriptions: [
    {
      subscriptionId: VALID_UUID_2,
      feePlanCode: 'ANNUAL-001',
      feePlanName: 'Cuota Anual',
      amount: 12000,
      startDate: VALID_DATETIME,
    },
  ],
  pendingCharges: [
    {
      chargeId: VALID_UUID_2,
      amount: 5000,
      issueDate: VALID_DATETIME,
      dueDate: VALID_DATETIME,
    },
  ],
  totalPendingDebt: 5000,
};

const validReinstatementSummary = {
  memberId: VALID_UUID,
  memberName: 'Juan García López',
  leaveDate: VALID_DATETIME,
  leaveType: 'VOLUNTARY_LEAVE',
  pendingDebt: 5000,
  penalty: 2000,
  newRegistrationFee: 3000,
  totalToPay: 10000,
  keepSeniority: true,
};

const validStatusHistoryEntry = {
  id: VALID_UUID,
  previousStatus: 'ACTIVE',
  newStatus: 'VOLUNTARY_LEAVE',
  reason: 'Solicitud del socio',
  changedBy: 'admin@example.com',
  changedAt: VALID_DATETIME,
};

// === Tests ===

describe('leaveTypeSchema', () => {
  it.each(['VOLUNTARY_LEAVE', 'NONPAYMENT_LEAVE', 'DISCIPLINARY_LEAVE'])(
    'deberia aceptar valor valido: %s',
    (value) => {
      const result = leaveTypeSchema.parse(value);
      expect(result).toBe(value);
    },
  );

  it('deberia rechazar valor invalido', () => {
    expect(() => leaveTypeSchema.parse('INVALID_LEAVE')).toThrow(ZodError);
  });

  it('deberia rechazar string vacio', () => {
    expect(() => leaveTypeSchema.parse('')).toThrow(ZodError);
  });
});

describe('effectiveDateConfigSchema', () => {
  it.each(['IMMEDIATE', 'END_OF_FISCAL_YEAR', 'END_OF_NEXT_MONTH', 'NOTICE_PERIOD'])(
    'deberia aceptar valor valido: %s',
    (value) => {
      const result = effectiveDateConfigSchema.parse(value);
      expect(result).toBe(value);
    },
  );

  it('deberia rechazar valor invalido', () => {
    expect(() => effectiveDateConfigSchema.parse('WEEKLY')).toThrow(ZodError);
  });
});

describe('leaveSummarySchema', () => {
  it('deberia aceptar datos validos de resumen de baja', () => {
    const result = leaveSummarySchema.parse(validLeaveSummary);

    expect(result.memberId).toBe(VALID_UUID);
    expect(result.memberName).toBe('Juan García López');
    expect(result.memberNumber).toBe('SOC-001');
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.effectiveDateOptions).toHaveLength(1);
    expect(result.activeSubscriptions).toHaveLength(1);
    expect(result.pendingCharges).toHaveLength(1);
    expect(result.totalPendingDebt).toBe(5000);
  });

  it('deberia rechazar sin campos obligatorios', () => {
    expect(() => leaveSummarySchema.parse({})).toThrow(ZodError);
  });

  it('deberia rechazar memberId no UUID', () => {
    const invalid = { ...validLeaveSummary, memberId: 'not-a-uuid' };
    expect(() => leaveSummarySchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar arrays vacios de suscripciones y cargos', () => {
    const withEmptyArrays = {
      ...validLeaveSummary,
      activeSubscriptions: [],
      pendingCharges: [],
      totalPendingDebt: 0,
    };
    const result = leaveSummarySchema.parse(withEmptyArrays);

    expect(result.activeSubscriptions).toEqual([]);
    expect(result.pendingCharges).toEqual([]);
  });
});

describe('voluntaryLeaveRequestSchema', () => {
  it('deberia aceptar peticion valida de baja voluntaria', () => {
    const validRequest = {
      effectiveDateType: 'IMMEDIATE' as const,
      reason: 'Me mudo de ciudad',
    };
    const result = voluntaryLeaveRequestSchema.parse(validRequest);

    expect(result.effectiveDateType).toBe('IMMEDIATE');
    expect(result.reason).toBe('Me mudo de ciudad');
  });

  it('deberia rechazar motivo menor a 3 caracteres', () => {
    const invalid = { effectiveDateType: 'IMMEDIATE', reason: 'ab' };
    expect(() => voluntaryLeaveRequestSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar motivo vacio', () => {
    const invalid = { effectiveDateType: 'IMMEDIATE', reason: '' };
    expect(() => voluntaryLeaveRequestSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar motivo de exactamente 3 caracteres', () => {
    const valid = { effectiveDateType: 'IMMEDIATE', reason: 'abc' };
    const result = voluntaryLeaveRequestSchema.parse(valid);
    expect(result.reason).toBe('abc');
  });

  it('deberia rechazar motivo mayor a 500 caracteres', () => {
    const invalid = { effectiveDateType: 'IMMEDIATE', reason: 'a'.repeat(501) };
    expect(() => voluntaryLeaveRequestSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('leaveResponseSchema', () => {
  it('deberia aceptar respuesta valida de baja', () => {
    const validResponse = {
      memberId: VALID_UUID,
      previousStatus: 'ACTIVE',
      newStatus: 'VOLUNTARY_LEAVE',
      effectiveDate: VALID_DATETIME,
      subscriptionsClosed: 2,
      pendingChargesAmount: 5000,
    };
    const result = leaveResponseSchema.parse(validResponse);

    expect(result.memberId).toBe(VALID_UUID);
    expect(result.previousStatus).toBe('ACTIVE');
    expect(result.newStatus).toBe('VOLUNTARY_LEAVE');
    expect(result.subscriptionsClosed).toBe(2);
    expect(result.pendingChargesAmount).toBe(5000);
  });

  it('deberia rechazar sin campos obligatorios', () => {
    expect(() => leaveResponseSchema.parse({ memberId: VALID_UUID })).toThrow(ZodError);
  });
});

describe('reinstatementSummarySchema', () => {
  it('deberia aceptar datos validos de resumen de rehabilitacion', () => {
    const result = reinstatementSummarySchema.parse(validReinstatementSummary);

    expect(result.memberId).toBe(VALID_UUID);
    expect(result.memberName).toBe('Juan García López');
    expect(result.leaveType).toBe('VOLUNTARY_LEAVE');
    expect(result.pendingDebt).toBe(5000);
    expect(result.penalty).toBe(2000);
    expect(result.newRegistrationFee).toBe(3000);
    expect(result.totalToPay).toBe(10000);
    expect(result.keepSeniority).toBe(true);
  });

  it('deberia aceptar cualquier string como leaveType', () => {
    const withCustomType = { ...validReinstatementSummary, leaveType: 'NONPAYMENT_LEAVE' };
    const result = reinstatementSummarySchema.parse(withCustomType);
    expect(result.leaveType).toBe('NONPAYMENT_LEAVE');
  });
});

describe('reinstatementRequestSchema', () => {
  it('deberia aceptar paymentConfirmed=true', () => {
    const result = reinstatementRequestSchema.parse({ paymentConfirmed: true });
    expect(result.paymentConfirmed).toBe(true);
  });

  it('deberia rechazar paymentConfirmed=false por refine', () => {
    expect(() => reinstatementRequestSchema.parse({ paymentConfirmed: false })).toThrow(ZodError);
  });

  it('deberia rechazar sin paymentConfirmed', () => {
    expect(() => reinstatementRequestSchema.parse({})).toThrow(ZodError);
  });
});

describe('statusHistoryEntrySchema', () => {
  it('deberia aceptar entrada valida de historial', () => {
    const result = statusHistoryEntrySchema.parse(validStatusHistoryEntry);

    expect(result.id).toBe(VALID_UUID);
    expect(result.previousStatus).toBe('ACTIVE');
    expect(result.newStatus).toBe('VOLUNTARY_LEAVE');
    expect(result.reason).toBe('Solicitud del socio');
    expect(result.changedBy).toBe('admin@example.com');
  });

  it('deberia rechazar changedAt no datetime', () => {
    const invalid = { ...validStatusHistoryEntry, changedAt: 'not-a-date' };
    expect(() => statusHistoryEntrySchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('availableTransitionsSchema', () => {
  it('deberia aceptar transiciones validas', () => {
    const validTransitions = {
      memberId: VALID_UUID,
      currentStatus: 'ACTIVE',
      availableTransitions: [
        { status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' },
        { status: 'SUSPENDED', description: 'Suspender socio' },
      ],
    };
    const result = availableTransitionsSchema.parse(validTransitions);

    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.availableTransitions).toHaveLength(2);
  });

  it('deberia aceptar array vacio de transiciones', () => {
    const noTransitions = {
      memberId: VALID_UUID,
      currentStatus: 'DECEASED',
      availableTransitions: [],
    };
    const result = availableTransitionsSchema.parse(noTransitions);

    expect(result.availableTransitions).toEqual([]);
  });
});
