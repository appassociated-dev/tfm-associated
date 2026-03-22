import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { createSubscription } from '../api/subscription.api';
import { ApiError } from '@/shared/api/api-error';
import type { CreateSubscriptionInput } from '../schemas/subscription.schemas';

/** Hook para crear una nueva suscripcion para un socio. */
export function useCreateSubscription(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => createSubscription(memberAccountId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: 'Suscripcion creada',
        message: 'La suscripcion se ha creado correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 409) {
        notifications.show({
          title: 'Suscripcion duplicada',
          message: 'Ya existe una suscripcion periodica activa. Cierrela primero o cambie de plan.',
          color: 'red',
        });
      }
    },
  });
}
