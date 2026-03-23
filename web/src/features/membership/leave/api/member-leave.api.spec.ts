// Tests para member-leave.api.ts — funciones de la capa API de baja/rehabilitación de socios.
// Valida URLs con parámetros dinámicos (memberId), métodos HTTP, parseo Zod, y manejo de errores.
// Usa MSW para interceptar peticiones a nivel de red.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import {
  buildLeaveSummary,
  buildReinstatementSummary,
  resetMemberCounters,
} from '@/test/factories';

// Mock de auth.provider para el interceptor de httpClient
vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => 'test-token',
  setTokens: () => {},
}));

// Importar DESPUÉS de vi.mock
import {
  getLeaveSummary,
  processVoluntaryLeave,
  processNonpaymentLeave,
  getReinstatementSummary,
  reinstateMember,
  getStatusHistory,
  getAvailableTransitions,
} from './member-leave.api';

describe('Member Leave API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMemberCounters();
    localStorage.clear();
  });

  // ===========================================
  // getLeaveSummary()
  // ===========================================
  describe('getLeaveSummary()', () => {
    it('debería enviar GET a /v1/members/:memberId/leave-summary', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const summary = buildLeaveSummary();

      server.use(
        http.get('*/v1/members/:memberId/leave-summary', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse(summary));
        }),
      );

      // Act
      const result = await getLeaveSummary('d0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedUrl).toContain(
        '/v1/members/d0000001-0000-4000-8000-000000000001/leave-summary',
      );
      expect(result).toEqual(summary);
    });

    it('debería parsear LeaveSummary con suscripciones activas y cargos pendientes', async () => {
      // Arrange
      const summary = buildLeaveSummary({
        totalPendingDebt: 5000,
        pendingCharges: [
          {
            chargeId: 'a0000001-0000-4000-8000-000000000050',
            amount: 5000,
            issueDate: '2026-01-15T00:00:00.000Z',
            dueDate: '2026-02-15T00:00:00.000Z',
          },
        ],
      });

      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () => {
          return HttpResponse.json(apiResponse(summary));
        }),
      );

      // Act
      const result = await getLeaveSummary('d0000001-0000-4000-8000-000000000002');

      // Assert
      expect(result.totalPendingDebt).toBe(5000);
      expect(result.pendingCharges).toHaveLength(1);
      expect(result.pendingCharges[0].chargeId).toBe('a0000001-0000-4000-8000-000000000050');
    });

    it('debería usar el memberId correcto en la URL (triangulación)', async () => {
      // Arrange
      let capturedMemberId: string | undefined;

      server.use(
        http.get('*/v1/members/:memberId/leave-summary', ({ params }) => {
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(buildLeaveSummary()));
        }),
      );

      // Act
      await getLeaveSummary('abc-123-def');

      // Assert
      expect(capturedMemberId).toBe('abc-123-def');
    });

    it('debería propagar error 404 si el socio no existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/:memberId/leave-summary', () => {
          return HttpResponse.json(
            { error: { code: 'MEMBER_NOT_FOUND', message: 'Socio no encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getLeaveSummary('nonexistent')).rejects.toThrow();
    });
  });

  // ===========================================
  // processVoluntaryLeave()
  // ===========================================
  describe('processVoluntaryLeave()', () => {
    it('debería enviar POST a /v1/members/:memberId/voluntary-leave con datos de baja', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedMemberId: string | undefined;
      const leaveResponse = {
        memberId: 'd0000001-0000-4000-8000-000000000001',
        previousStatus: 'ACTIVE',
        newStatus: 'VOLUNTARY_LEAVE',
        effectiveDate: '2026-03-22T00:00:00.000Z',
        subscriptionsClosed: 1,
        pendingChargesAmount: 0,
      };

      server.use(
        http.post('*/v1/members/:memberId/voluntary-leave', async ({ request, params }) => {
          capturedBody = await request.json();
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(leaveResponse));
        }),
      );

      // Act
      const result = await processVoluntaryLeave('d0000001-0000-4000-8000-000000000001', {
        effectiveDateType: 'IMMEDIATE',
        reason: 'Cambio de residencia',
      });

      // Assert
      expect(capturedMemberId).toBe('d0000001-0000-4000-8000-000000000001');
      expect(capturedBody).toEqual({
        effectiveDateType: 'IMMEDIATE',
        reason: 'Cambio de residencia',
      });
      expect(result.newStatus).toBe('VOLUNTARY_LEAVE');
      expect(result.subscriptionsClosed).toBe(1);
    });

    it('debería parsear LeaveResponse con diferentes parámetros (triangulación)', async () => {
      // Arrange
      const leaveResponse = {
        memberId: 'd0000001-0000-4000-8000-000000000099',
        previousStatus: 'ACTIVE',
        newStatus: 'VOLUNTARY_LEAVE',
        effectiveDate: '2026-12-31T00:00:00.000Z',
        subscriptionsClosed: 3,
        pendingChargesAmount: 15000,
      };

      server.use(
        http.post('*/v1/members/:memberId/voluntary-leave', () => {
          return HttpResponse.json(apiResponse(leaveResponse));
        }),
      );

      // Act
      const result = await processVoluntaryLeave('d0000001-0000-4000-8000-000000000099', {
        effectiveDateType: 'END_OF_FISCAL_YEAR',
        reason: 'Motivos personales y familiares',
      });

      // Assert
      expect(result.subscriptionsClosed).toBe(3);
      expect(result.pendingChargesAmount).toBe(15000);
      expect(result.effectiveDate).toBe('2026-12-31T00:00:00.000Z');
    });

    it('debería propagar error 409 si hay conflicto de estado', async () => {
      // Arrange
      server.use(
        http.post('*/v1/members/:memberId/voluntary-leave', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'INVALID_STATUS_TRANSITION',
                message: 'El socio ya está de baja',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(
        processVoluntaryLeave('member-001', {
          effectiveDateType: 'IMMEDIATE',
          reason: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  // ===========================================
  // processNonpaymentLeave()
  // ===========================================
  describe('processNonpaymentLeave()', () => {
    it('debería enviar POST a /v1/members/:memberId/nonpayment-leave sin body', async () => {
      // Arrange
      let capturedMemberId: string | undefined;
      const leaveResponse = {
        memberId: 'd0000001-0000-4000-8000-000000000001',
        previousStatus: 'ACTIVE',
        newStatus: 'NONPAYMENT_LEAVE',
        effectiveDate: '2026-03-22T00:00:00.000Z',
        subscriptionsClosed: 1,
        pendingChargesAmount: 6000,
      };

      server.use(
        http.post('*/v1/members/:memberId/nonpayment-leave', ({ params }) => {
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(leaveResponse));
        }),
      );

      // Act
      const result = await processNonpaymentLeave('d0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedMemberId).toBe('d0000001-0000-4000-8000-000000000001');
      expect(result.newStatus).toBe('NONPAYMENT_LEAVE');
    });

    it('debería propagar error 422 si no cumple requisitos de baja por impago', async () => {
      // Arrange
      server.use(
        http.post('*/v1/members/:memberId/nonpayment-leave', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'NONPAYMENT_NOT_APPLICABLE',
                message: 'No hay impagos',
                details: null,
              },
            },
            { status: 422 },
          );
        }),
      );

      // Act & Assert
      await expect(processNonpaymentLeave('member-001')).rejects.toThrow();
    });
  });

  // ===========================================
  // getReinstatementSummary()
  // ===========================================
  describe('getReinstatementSummary()', () => {
    it('debería enviar GET a /v1/members/:memberId/reinstatement-summary', async () => {
      // Arrange
      let capturedMemberId: string | undefined;
      const summary = buildReinstatementSummary();

      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', ({ params }) => {
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(summary));
        }),
      );

      // Act
      const result = await getReinstatementSummary('ex-member-001');

      // Assert
      expect(capturedMemberId).toBe('ex-member-001');
      expect(result).toEqual(summary);
    });

    it('debería parsear costes de rehabilitación correctamente (triangulación)', async () => {
      // Arrange
      const summary = buildReinstatementSummary({
        pendingDebt: 3000,
        penalty: 5000,
        newRegistrationFee: 8000,
        totalToPay: 16000,
        keepSeniority: false,
      });

      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () => {
          return HttpResponse.json(apiResponse(summary));
        }),
      );

      // Act
      const result = await getReinstatementSummary('ex-member-002');

      // Assert
      expect(result.pendingDebt).toBe(3000);
      expect(result.penalty).toBe(5000);
      expect(result.newRegistrationFee).toBe(8000);
      expect(result.totalToPay).toBe(16000);
      expect(result.keepSeniority).toBe(false);
    });

    it('debería propagar error 404 si el ex-socio no existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/:memberId/reinstatement-summary', () => {
          return HttpResponse.json(
            { error: { code: 'MEMBER_NOT_FOUND', message: 'No encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getReinstatementSummary('nonexistent')).rejects.toThrow();
    });
  });

  // ===========================================
  // reinstateMember()
  // ===========================================
  describe('reinstateMember()', () => {
    it('debería enviar POST a /v1/members/:memberId/reinstate con confirmación de pago', async () => {
      // Arrange
      let capturedBody: unknown;
      const response = {
        memberId: 'd0000001-0000-4000-8000-000000000001',
        newStatus: 'ACTIVE',
        debtPaid: 7500,
        seniorityRecovered: true,
        registrationDate: '2026-03-22T00:00:00.000Z',
      };

      server.use(
        http.post('*/v1/members/:memberId/reinstate', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(response));
        }),
      );

      // Act
      const result = await reinstateMember('d0000001-0000-4000-8000-000000000001', {
        paymentConfirmed: true,
      });

      // Assert
      expect(capturedBody).toEqual({ paymentConfirmed: true });
      expect(result.newStatus).toBe('ACTIVE');
      expect(result.debtPaid).toBe(7500);
      expect(result.seniorityRecovered).toBe(true);
    });

    it('debería parsear ReinstatementResponse (triangulación sin seniority)', async () => {
      // Arrange
      const response = {
        memberId: 'd0000001-0000-4000-8000-000000000002',
        newStatus: 'ACTIVE',
        debtPaid: 16000,
        seniorityRecovered: false,
        registrationDate: '2026-06-01T00:00:00.000Z',
      };

      server.use(
        http.post('*/v1/members/:memberId/reinstate', () => {
          return HttpResponse.json(apiResponse(response));
        }),
      );

      // Act
      const result = await reinstateMember('d0000001-0000-4000-8000-000000000002', {
        paymentConfirmed: true,
      });

      // Assert
      expect(result.debtPaid).toBe(16000);
      expect(result.seniorityRecovered).toBe(false);
    });

    it('debería propagar error 402 si el pago no se confirma', async () => {
      // Arrange
      server.use(
        http.post('*/v1/members/:memberId/reinstate', () => {
          return HttpResponse.json(
            { error: { code: 'PAYMENT_REQUIRED', message: 'Pago no confirmado', details: null } },
            { status: 402 },
          );
        }),
      );

      // Act & Assert
      await expect(reinstateMember('member-001', { paymentConfirmed: true })).rejects.toThrow();
    });
  });

  // ===========================================
  // getStatusHistory()
  // ===========================================
  describe('getStatusHistory()', () => {
    it('debería enviar GET a /v1/members/:memberId/status-history', async () => {
      // Arrange
      let capturedMemberId: string | undefined;
      const history = {
        memberId: 'd0000001-0000-4000-8000-000000000001',
        currentStatus: 'ACTIVE',
        entries: [
          {
            id: 'e0000001-0000-4000-8000-000000000001',
            previousStatus: 'PENDING',
            newStatus: 'ACTIVE',
            reason: 'Alta aprobada',
            changedBy: 'admin@club.es',
            changedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      server.use(
        http.get('*/v1/members/:memberId/status-history', ({ params }) => {
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(history));
        }),
      );

      // Act
      const result = await getStatusHistory('d0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedMemberId).toBe('d0000001-0000-4000-8000-000000000001');
      expect(result.currentStatus).toBe('ACTIVE');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].newStatus).toBe('ACTIVE');
    });

    it('debería parsear historial con múltiples entradas (triangulación)', async () => {
      // Arrange
      const history = {
        memberId: 'd0000001-0000-4000-8000-000000000002',
        currentStatus: 'VOLUNTARY_LEAVE',
        entries: [
          {
            id: 'e0000001-0000-4000-8000-000000000010',
            previousStatus: 'PENDING',
            newStatus: 'ACTIVE',
            reason: 'Alta',
            changedBy: 'admin@club.es',
            changedAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'e0000001-0000-4000-8000-000000000020',
            previousStatus: 'ACTIVE',
            newStatus: 'VOLUNTARY_LEAVE',
            reason: 'Cambio de ciudad',
            changedBy: 'admin@club.es',
            changedAt: '2026-03-01T00:00:00.000Z',
          },
        ],
      };

      server.use(
        http.get('*/v1/members/:memberId/status-history', () => {
          return HttpResponse.json(apiResponse(history));
        }),
      );

      // Act
      const result = await getStatusHistory('d0000001-0000-4000-8000-000000000002');

      // Assert
      expect(result.entries).toHaveLength(2);
      expect(result.currentStatus).toBe('VOLUNTARY_LEAVE');
    });

    it('debería propagar error 404', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/:memberId/status-history', () => {
          return HttpResponse.json(
            { error: { code: 'MEMBER_NOT_FOUND', message: 'No existe', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getStatusHistory('ghost')).rejects.toThrow();
    });
  });

  // ===========================================
  // getAvailableTransitions()
  // ===========================================
  describe('getAvailableTransitions()', () => {
    it('debería enviar GET a /v1/members/:memberId/available-transitions', async () => {
      // Arrange
      let capturedMemberId: string | undefined;
      const transitions = {
        memberId: 'd0000001-0000-4000-8000-000000000001',
        currentStatus: 'ACTIVE',
        availableTransitions: [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }],
      };

      server.use(
        http.get('*/v1/members/:memberId/available-transitions', ({ params }) => {
          capturedMemberId = params.memberId as string;
          return HttpResponse.json(apiResponse(transitions));
        }),
      );

      // Act
      const result = await getAvailableTransitions('d0000001-0000-4000-8000-000000000001');

      // Assert
      expect(capturedMemberId).toBe('d0000001-0000-4000-8000-000000000001');
      expect(result.currentStatus).toBe('ACTIVE');
      expect(result.availableTransitions).toHaveLength(1);
      expect(result.availableTransitions[0].status).toBe('VOLUNTARY_LEAVE');
    });

    it('debería parsear múltiples transiciones (triangulación con socio de baja)', async () => {
      // Arrange
      const transitions = {
        memberId: 'd0000001-0000-4000-8000-000000000002',
        currentStatus: 'VOLUNTARY_LEAVE',
        availableTransitions: [
          { status: 'ACTIVE', description: 'Rehabilitación' },
          { status: 'EXPELLED', description: 'Expulsión disciplinaria' },
        ],
      };

      server.use(
        http.get('*/v1/members/:memberId/available-transitions', () => {
          return HttpResponse.json(apiResponse(transitions));
        }),
      );

      // Act
      const result = await getAvailableTransitions('d0000001-0000-4000-8000-000000000002');

      // Assert
      expect(result.availableTransitions).toHaveLength(2);
      expect(result.currentStatus).toBe('VOLUNTARY_LEAVE');
    });

    it('debería propagar error 404', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/:memberId/available-transitions', () => {
          return HttpResponse.json(
            { error: { code: 'MEMBER_NOT_FOUND', message: 'No encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(getAvailableTransitions('nonexistent')).rejects.toThrow();
    });
  });
});
