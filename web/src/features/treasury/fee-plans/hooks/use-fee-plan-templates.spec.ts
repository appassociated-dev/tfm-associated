// Tests para useFeePlanTemplates y useImportTemplate — hooks para
// obtener e importar plantillas predefinidas de planes de cuota.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useFeePlanTemplates, useImportTemplate } from './use-fee-plan-templates';

// === Mock de notificaciones (para useImportTemplate) ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const templateResponse = {
  collectivityType: 'SPORTS_CLUB',
  templates: [
    {
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      type: 'RECURRING' as const,
      amount: 12000,
      frequency: 'ANNUAL' as const,
      billingMonths: [1],
    },
    {
      code: 'CUOTA-ALTA',
      name: 'Cuota de Alta',
      type: 'ONE_TIME' as const,
      amount: 5000,
      frequency: null,
      billingMonths: [],
    },
  ],
};

const templateResponseAssociation = {
  collectivityType: 'CULTURAL_ASSOCIATION',
  templates: [
    {
      code: 'CUOTA-TRIMESTRAL',
      name: 'Cuota Trimestral',
      type: 'RECURRING' as const,
      amount: 3000,
      frequency: 'QUARTERLY' as const,
      billingMonths: [1, 4, 7, 10],
    },
  ],
};

describe('useFeePlanTemplates', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia retornar plantillas para club deportivo', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans/templates', () => {
        return HttpResponse.json(apiResponse(templateResponse));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlanTemplates('SPORTS_CLUB'));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.collectivityType).toBe('SPORTS_CLUB');
    expect(result.current.data?.templates).toHaveLength(2);
  });

  it('deberia retornar plantillas para asociacion cultural (triangulacion)', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans/templates', () => {
        return HttpResponse.json(apiResponse(templateResponseAssociation));
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlanTemplates('CULTURAL_ASSOCIATION'));

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.templates).toHaveLength(1);
    expect(result.current.data?.templates[0].frequency).toBe('QUARTERLY');
  });

  it('deberia retornar error cuando la API falla', async () => {
    // Arrange
    server.use(
      http.get('*/v1/treasury/fee-plans/templates', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useFeePlanTemplates('UNKNOWN_TYPE'));

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('no deberia ejecutar query con tipo de colectividad vacio', () => {
    // Act
    const { result } = renderHook(() => useFeePlanTemplates(''));

    // Assert
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useImportTemplate', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia importar plantilla exitosamente', async () => {
    // Arrange
    const importedPlans = [buildFeePlan(), buildFeePlan()];
    server.use(
      http.post('*/v1/treasury/fee-plans/import-template', () => {
        return HttpResponse.json(apiResponse(importedPlans));
      }),
    );

    // Act
    const { result } = renderHook(() => useImportTemplate());

    await act(async () => {
      await result.current.mutateAsync('SPORTS_CLUB');
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde con cantidad de planes importados', async () => {
    // Arrange
    const importedPlans = [buildFeePlan(), buildFeePlan(), buildFeePlan()];
    server.use(
      http.post('*/v1/treasury/fee-plans/import-template', () => {
        return HttpResponse.json(apiResponse(importedPlans));
      }),
    );

    // Act
    const { result } = renderHook(() => useImportTemplate());

    await act(async () => {
      await result.current.mutateAsync('SPORTS_CLUB');
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Plantilla importada',
        color: 'green',
      }),
    );
    // Verificar que el mensaje incluye la cantidad
    const call = mockNotificationsShow.mock.calls[0][0] as { message: string };
    expect(call.message).toContain('3');
  });

  it('deberia manejar error de importacion', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/import-template', () => {
        return HttpResponse.json({ message: 'Plantilla no encontrada' }, { status: 404 });
      }),
    );

    // Act
    const { result } = renderHook(() => useImportTemplate());

    await act(async () => {
      try {
        await result.current.mutateAsync('INVALID_TYPE');
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deberia mostrar notificacion roja de dominio para error 422 (plantilla no disponible)', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/import-template', () => {
        return HttpResponse.json(
          { error: { code: 'TEMPLATE_NOT_FOUND', message: 'Sin plantilla', details: null } },
          { status: 422 },
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useImportTemplate());

    await act(async () => {
      try {
        await result.current.mutateAsync('INVALID_TYPE');
      } catch {
        // Se espera que falle
      }
    });

    // Assert — 422: notificacion roja de dominio especifica para importacion
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error al importar plantilla',
        color: 'red',
      }),
    );
  });

  it('deberia mostrar notificacion roja generica para error 500', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/import-template', () => {
        return HttpResponse.json({ message: 'Server Error' }, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useImportTemplate());

    await act(async () => {
      try {
        await result.current.mutateAsync('SPORTS_CLUB');
      } catch {
        // Se espera que falle
      }
    });

    // Assert — error generico: notificacion roja con mensaje generico
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useImportTemplate());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
