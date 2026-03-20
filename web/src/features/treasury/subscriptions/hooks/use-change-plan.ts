import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { changePlan } from '../api/subscription.api';
import type { ChangePlanInput } from '../schemas/subscription.schemas';

/** Hook para cambiar el plan de una suscripcion activa. */
export function useChangePlan(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, input }: { subscriptionId: string; input: ChangePlanInput }) =>
      changePlan(memberAccountId, subscriptionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: 'Plan cambiado',
        message: 'Plan cambiado correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        notifications.show({
          title: 'Cambio no permitido',
          message: 'No se puede cambiar: hay cargos pendientes sin confirmar',
          color: 'red',
        });
      }
    },
  });
}
