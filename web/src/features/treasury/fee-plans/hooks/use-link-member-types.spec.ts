// Tests para useLinkMemberTypes — mutation hook para vincular
// tipos de socio a un plan de cuota. Verifica invalidacion
// de cache y manejo de errores.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { useLinkMemberTypes } from './use-link-member-types';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const PLAN_ID = 'f47ac10b-58cc-4372-a567-000000000001';

const singleLink = [
  { memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1', isDefault: true, order: 0 },
];

const multipleLinks = [
  { memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1', isDefault: true, order: 0 },
  { memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c2', isDefault: false, order: 1 },
  { memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c3', isDefault: false, order: 2 },
];

describe('useLinkMemberTypes', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia vincular tipos de socio exitosamente', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    await act(async () => {
      await result.current.mutateAsync({ planId: PLAN_ID, links: singleLink });
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde al vincular', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    await act(async () => {
      await result.current.mutateAsync({ planId: PLAN_ID, links: singleLink });
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Vinculaciones actualizadas',
        color: 'green',
      }),
    );
  });

  it('deberia enviar payload correcto con multiples vinculaciones (triangulacion)', async () => {
    // Arrange
    let capturedBody: unknown;
    server.use(
      http.post('*/v1/treasury/fee-plans/:planId/link-member-types', async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    await act(async () => {
      await result.current.mutateAsync({ planId: PLAN_ID, links: multipleLinks });
    });

    // Assert
    expect(capturedBody).toEqual(
      expect.objectContaining({
        links: multipleLinks,
      }),
    );
  });

  it('deberia manejar error con mensaje del backend', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
        return HttpResponse.json({ message: 'Tipo de socio no existe' }, { status: 400 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    await act(async () => {
      try {
        await result.current.mutateAsync({ planId: PLAN_ID, links: singleLink });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al guardar vinculaciones',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error sin mensaje con fallback', async () => {
    // Arrange
    server.use(
      http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    await act(async () => {
      try {
        await result.current.mutateAsync({ planId: PLAN_ID, links: singleLink });
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error al guardar vinculaciones',
          color: 'red',
        }),
      );
    });
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useLinkMemberTypes());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
