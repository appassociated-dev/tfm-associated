import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { reinstateMember } from '../api/member-leave.api';
import type { ReinstatementRequest } from '../schemas/member-leave.schemas';

/** Mutation para rehabilitar un ex-socio tras confirmacion de pago. */
export function useReinstateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: ReinstatementRequest }) =>
      reinstateMember(memberId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['status-history', variables.memberId] });
      notifications.show({
        title: 'Rehabilitacion exitosa',
        message: 'Socio rehabilitado correctamente',
        color: 'green',
      });
    },
  });
}
