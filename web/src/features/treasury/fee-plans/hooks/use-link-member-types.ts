import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { linkMemberTypes } from '../api/fee-plan.api';
import { ApiError } from '@/shared/api/api-error';
import type { LinkMemberTypeInput } from '../schemas/fee-plan.schemas';

/** Hook para vincular tipos de socio a un plan de cuota. */
export function useLinkMemberTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, links }: { planId: string; links: LinkMemberTypeInput[] }) =>
      linkMemberTypes(planId, links),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      queryClient.invalidateQueries({ queryKey: ['fee-plans', variables.planId] });
      notifications.show({
        title: 'Vinculaciones actualizadas',
        message: 'Las vinculaciones de tipos de socio se han actualizado correctamente',
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      const backendMessage = error instanceof ApiError ? error.message : undefined;
      notifications.show({
        title: 'Error al guardar vinculaciones',
        message: backendMessage ?? 'Ocurrió un error al guardar las vinculaciones.',
        color: 'red',
        autoClose: 4000,
      });
    },
  });
}
