import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { closeSubscription } from '../api/subscription.api';
import { ApiError } from '@/shared/api/api-error';
import type { CancelReason } from '../schemas/subscription.schemas';

/** Hook para cerrar una suscripcion con motivo. */
export function useCloseSubscription(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, reason }: { subscriptionId: string; reason: CancelReason }) =>
      closeSubscription(memberAccountId, subscriptionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: 'Suscripcion cerrada',
        message: 'La suscripcion se ha cerrado correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 409) {
        notifications.show({
          title: 'Error',
          message: 'No se pudo cerrar la suscripcion',
          color: 'red',
        });
      }
    },
  });
}
