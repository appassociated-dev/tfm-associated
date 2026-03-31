import { notifications } from '@mantine/notifications';

import { ApiError } from '@/shared/api/api-error';
import i18n from '@/i18n/i18n';

/** Mapa de handlers por código HTTP — cada handler muestra su propia notificación de dominio. */
type MutationErrorHandlers = Partial<Record<number, () => void>>;

/** Notificación de fallback personalizada — recibe textos ya traducidos por el caller. */
interface FallbackNotification {
  title: string;
  message: string;
}

/**
 * Maneja errores de mutación mostrando una notificación al usuario.
 * Si el error es ApiError y hay un handler registrado para su status, lo ejecuta.
 * De lo contrario, muestra la notificación genérica (o la personalizada si se proporciona fallback).
 */
export function handleMutationError(
  error: unknown,
  domainHandlers?: MutationErrorHandlers,
  fallback?: FallbackNotification,
): void {
  // Extrae el status si el error proviene de la API
  if (error instanceof ApiError && domainHandlers) {
    const handler = domainHandlers[error.status];
    if (handler) {
      handler();
      return;
    }
  }

  // Fallback generico — dos rutas llegan aqui: (1) el error no es ApiError (red, timeout, etc.),
  // o (2) es ApiError pero su status no tiene handler registrado en domainHandlers.
  notifications.show({
    title: fallback?.title ?? i18n.t('common:errors.somethingWentWrong'),
    message: fallback?.message ?? i18n.t('common:errors.unexpected'),
    color: 'red',
  });
}
