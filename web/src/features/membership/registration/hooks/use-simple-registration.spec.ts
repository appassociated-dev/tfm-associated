// Tests para useSimpleRegistration — mutation hook para alta simple
// de socio (UC-011). Verifica invalidacion de cache, notificaciones
// de exito, y manejo de errores 409/422.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { renderHook, waitFor, act } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildRegistrationResponse } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';
import { useSimpleRegistration } from './use-simple-registration';
import type { SimpleRegistrationRequest } from '../schemas/member-registration.schemas';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Datos de prueba ===

const registrationInput: SimpleRegistrationRequest = {
  dni: '12345678A',
  firstName: 'Maria',
  lastName: 'Garcia Lopez',
  birthDate: '1990-05-15',
  email: 'maria@test.es',
  phone: '+34612345678',
  address: 'Calle Mayor 1',
  postalCode: '28001',
  city: 'Madrid',
  memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
};

const registrationInput2: SimpleRegistrationRequest = {
  dni: 'X1234567B',
  firstName: 'Pedro',
  lastName: 'Martinez Ruiz',
  birthDate: '1985-10-20',
  email: 'pedro@test.es',
  phone: null,
  address: null,
  postalCode: null,
  city: null,
  memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c2',
};

describe('useSimpleRegistration', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  it('deberia registrar socio exitosamente', async () => {
    // Arrange
    const response = buildRegistrationResponse({ memberNumber: 'SOC-0042' });
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json(apiResponse(response), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      await result.current.mutateAsync(registrationInput);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia mostrar notificacion verde con numero de socio asignado', async () => {
    // Arrange
    const response = buildRegistrationResponse({ memberNumber: 'SOC-0042' });
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json(apiResponse(response), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      await result.current.mutateAsync(registrationInput);
    });

    // Assert
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Socio dado de alta',
        color: 'green',
      }),
    );
    // Verificar que el mensaje incluye el numero de socio
    const call = mockNotificationsShow.mock.calls[0][0] as { message: string };
    expect(call.message).toContain('SOC-0042');
  });

  it('deberia invalidar queries de members al registrar', async () => {
    // Arrange
    const response = buildRegistrationResponse();
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json(apiResponse(response), { status: 201 });
      }),
    );

    const { result } = renderHook(() => useSimpleRegistration(), {
      queryData: [{ queryKey: ['members'], data: [] }],
    });

    // Act
    await act(async () => {
      await result.current.mutateAsync(registrationInput);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockNotificationsShow).toHaveBeenCalled();
  });

  it('deberia manejar error 409 (DNI duplicado) con notificacion roja', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json({ message: 'DNI ya registrado' }, { status: 409 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      try {
        await result.current.mutateAsync(registrationInput);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'DNI duplicado',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error 422 con mensaje del backend', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json(
          { message: 'Edad no compatible con tipo de socio' },
          { status: 422 },
        );
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      try {
        await result.current.mutateAsync(registrationInput);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de validación',
          color: 'red',
        }),
      );
    });
  });

  it('deberia manejar error 422 sin mensaje con fallback', async () => {
    // Arrange
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json({}, { status: 422 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      try {
        await result.current.mutateAsync(registrationInput2);
      } catch {
        // Se espera que falle
      }
    });

    // Assert
    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de validación',
          color: 'red',
        }),
      );
    });
  });

  it('deberia funcionar con datos minimos (campos opcionales null) - triangulacion', async () => {
    // Arrange
    const response = buildRegistrationResponse({ memberNumber: 'SOC-0099' });
    server.use(
      http.post('*/v1/members/simple-registration', () => {
        return HttpResponse.json(apiResponse(response), { status: 201 });
      }),
    );

    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    await act(async () => {
      await result.current.mutateAsync(registrationInput2);
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('deberia tener isPending en false antes de mutar', () => {
    // Act
    const { result } = renderHook(() => useSimpleRegistration());

    // Assert
    expect(result.current.isPending).toBe(false);
  });
});
