import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { reinstateMember } from '../api/member-leave.api';
import type { ReinstatementRequest } from '../schemas/member-leave.schemas';
import { handleMutationError } from '@/shared/utils/handle-mutation-error';
import i18n from '@/i18n/i18n';

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
        title: i18n.t('membership:leave.notifications.reinstatement.successTitle'),
        message: i18n.t('membership:leave.notifications.reinstatement.successText'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      // 422 indica conflicto de estado: el socio no puede rehabilitarse desde el estado actual
      handleMutationError(error, {
        422: () =>
          notifications.show({
            title: i18n.t('membership:leave.notifications.reinstatement.stateErrorTitle'),
            message: i18n.t('membership:leave.notifications.reinstatement.stateErrorText'),
            color: 'red',
          }),
      });
    },
  });
}
