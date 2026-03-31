import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { updateFeePlan } from '../api/fee-plan.api';
import type { UpdateFeePlanInput } from '../schemas/fee-plan.schemas';
import { handleMutationError } from '@/shared/utils/handle-mutation-error';

/** Hook para actualizar un plan de cuota existente. */
export function useUpdateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFeePlanInput }) =>
      updateFeePlan(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      queryClient.invalidateQueries({ queryKey: ['fee-plans', variables.id] });
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.updateSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.updateSuccess.message'),
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      // Delegamos al manejador compartido — sin handlers de dominio especificos para esta mutacion
      handleMutationError(error);
    },
  });
}
