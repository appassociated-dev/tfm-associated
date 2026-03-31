// Tests para handleMutationError — utilidad compartida para manejo de errores en mutations.
// Verifica el dispatch a handlers de dominio por status code y el fallback generico.

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiError } from '@/shared/api/api-error';
import { handleMutationError } from './handle-mutation-error';

// === Mock de notificaciones ===

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: unknown[]) => mockNotificationsShow(...args),
  },
}));

// === Tests ===

describe('handleMutationError', () => {
  beforeEach(() => {
    mockNotificationsShow.mockClear();
  });

  describe('ApiError con status en el mapa de handlers', () => {
    it('deberia llamar al handler mapeado cuando el status coincide', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(422, {
        code: 'INVALID_STATE',
        message: 'Estado inválido',
        details: null,
      });

      // Act
      handleMutationError(error, { 422: handler422 });

      // Assert — el handler de dominio se llama
      expect(handler422).toHaveBeenCalledTimes(1);
    });

    it('NO deberia mostrar la notificacion generica cuando hay handler mapeado', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(422, {
        code: 'INVALID_STATE',
        message: 'Estado inválido',
        details: null,
      });

      // Act
      handleMutationError(error, { 422: handler422 });

      // Assert — el fallback generico NO se llama
      expect(mockNotificationsShow).not.toHaveBeenCalled();
    });
  });

  describe('ApiError con status NO en el mapa de handlers', () => {
    it('deberia mostrar la notificacion generica cuando el status no tiene handler', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Error interno',
        details: null,
      });

      // Act
      handleMutationError(error, { 422: handler422 });

      // Assert — fallback generico con titulo, mensaje y color rojo correctos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });

    it('NO deberia llamar al handler 422 cuando el status es 500', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Error interno',
        details: null,
      });

      // Act
      handleMutationError(error, { 422: handler422 });

      // Assert — el handler de dominio NO se llama
      expect(handler422).not.toHaveBeenCalled();
    });
  });

  describe('Error que no es ApiError (fallo de red, error desconocido)', () => {
    it('deberia mostrar la notificacion generica para TypeError (fallo de red)', () => {
      // Arrange
      const error = new TypeError('Failed to fetch');

      // Act
      handleMutationError(error);

      // Assert — fallback generico con titulo, mensaje y color rojo correctos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });

    it('deberia mostrar la notificacion generica para Error generico desconocido', () => {
      // Arrange
      const error = new Error('Unknown error');

      // Act
      handleMutationError(error);

      // Assert — fallback generico con titulo, mensaje y color rojo correctos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });
  });

  describe('Parametro fallback opcional — notificacion personalizada', () => {
    it('deberia usar title y message del fallback cuando se proporcionan', () => {
      // Arrange — el caller pasa strings ya traducidos
      const error = new TypeError('Failed to fetch');
      const fallback = {
        title: 'Error de rehabilitacion',
        message: 'No se puede rehabilitar al socio desde el estado actual.',
      };

      // Act
      handleMutationError(error, undefined, fallback);

      // Assert — la notificacion usa los textos del fallback personalizado
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error de rehabilitacion',
          message: 'No se puede rehabilitar al socio desde el estado actual.',
          color: 'red',
        }),
      );
    });

    it('deberia usar el fallback cuando el status no tiene handler registrado', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Error interno',
        details: null,
      });
      const fallback = {
        title: 'No se puede activar',
        message: 'No se puede activar el plan desde el estado actual.',
      };

      // Act
      handleMutationError(error, { 422: handler422 }, fallback);

      // Assert — la notificacion usa los textos del fallback en lugar de los genericos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No se puede activar',
          message: 'No se puede activar el plan desde el estado actual.',
          color: 'red',
        }),
      );
    });

    it('deberia usar los textos genericos por defecto cuando fallback NO se proporciona', () => {
      // Arrange
      const error = new TypeError('Failed to fetch');

      // Act — sin fallback
      handleMutationError(error);

      // Assert — las traducciones genericas por defecto se mantienen
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });

    it('NO deberia usar el fallback cuando hay handler de dominio mapeado para el status', () => {
      // Arrange
      const handler422 = vi.fn();
      const error = new ApiError(422, {
        code: 'INVALID_STATE',
        message: 'Estado inválido',
        details: null,
      });
      const fallback = {
        title: 'Texto personalizado',
        message: 'No deberia aparecer.',
      };

      // Act
      handleMutationError(error, { 422: handler422 }, fallback);

      // Assert — el handler de dominio se llama y el fallback NO se usa
      expect(handler422).toHaveBeenCalledTimes(1);
      expect(mockNotificationsShow).not.toHaveBeenCalled();
    });
  });

  describe('Sin mapa de handlers (domainHandlers no proporcionado)', () => {
    it('deberia mostrar siempre la notificacion generica cuando no hay handlers', () => {
      // Arrange
      const error = new ApiError(422, {
        code: 'INVALID_STATE',
        message: 'Estado inválido',
        details: null,
      });

      // Act — sin pasar domainHandlers
      handleMutationError(error);

      // Assert — fallback generico con titulo, mensaje y color rojo correctos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });

    it('deberia mostrar la notificacion generica con mapa vacio', () => {
      // Arrange
      const error = new ApiError(422, {
        code: 'INVALID_STATE',
        message: 'Estado inválido',
        details: null,
      });

      // Act — mapa vacio
      handleMutationError(error, {});

      // Assert — fallback generico con titulo, mensaje y color rojo correctos
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Algo salio mal',
          message: 'Ha ocurrido un error inesperado.',
          color: 'red',
        }),
      );
    });
  });
});
