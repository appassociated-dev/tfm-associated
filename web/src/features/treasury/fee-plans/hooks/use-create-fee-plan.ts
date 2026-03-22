import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { createFeePlan } from '../api/fee-plan.api';
import { ApiError } from '@/shared/api/api-error';
import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';

/** Hook para crear un nuevo plan de cuota. */
export function useCreateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFeePlanInput) => createFeePlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: 'Plan creado',
        message: 'El plan de cuota se ha creado correctamente',
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      const backendMessage = error instanceof ApiError ? error.message : undefined;
      if (status === 409) {
        notifications.show({
          title: 'Código duplicado',
          message: 'Ya existe un plan con ese código. Pruebe con otro.',
          color: 'red',
          autoClose: 4000,
        });
      } else {
        notifications.show({
          title: 'Error al crear plan',
          message: backendMessage ?? 'Ocurrió un error inesperado. Intente de nuevo.',
          color: 'red',
          autoClose: 4000,
        });
      }
    },
  });
}
