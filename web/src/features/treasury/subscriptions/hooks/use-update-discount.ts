import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { updateDiscount } from '../api/subscription.api';
import type { UpdateDiscountInput } from '../schemas/subscription.schemas';

/** Hook para modificar el descuento personalizado de una suscripcion. */
export function useUpdateDiscount(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: UpdateDiscountInput;
    }) => updateDiscount(memberAccountId, subscriptionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: 'Descuento actualizado',
        message: 'El descuento se ha actualizado correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        notifications.show({
          title: 'Error',
          message: 'No se pudo actualizar el descuento',
          color: 'red',
        });
      }
    },
  });
}
