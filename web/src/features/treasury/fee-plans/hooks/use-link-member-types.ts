import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
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
        title: i18n.t('treasury:feePlans.notifications.linkSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.linkSuccess.message'),
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      const backendMessage = error instanceof ApiError ? error.message : undefined;
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.linkError.title'),
        message:
          backendMessage ?? i18n.t('treasury:feePlans.notifications.linkError.messageFallback'),
        color: 'red',
        autoClose: 4000,
      });
    },
  });
}
