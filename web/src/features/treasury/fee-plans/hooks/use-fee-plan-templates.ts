import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { getTemplates, importTemplate } from '../api/fee-plan.api';
import { handleMutationError } from '@/shared/utils/handle-mutation-error';

/** Hook para obtener plantillas predefinidas segun tipo de colectividad. */
export function useFeePlanTemplates(collectivityType: string) {
  return useQuery({
    queryKey: ['fee-plan-templates', collectivityType],
    queryFn: () => getTemplates(collectivityType),
    enabled: !!collectivityType,
  });
}

/** Hook para importar plantillas predefinidas de planes de cuota. */
export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectivityType: string) => importTemplate(collectivityType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.importSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.importSuccess.message', {
          count: data.length,
        }),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      // 422 indica que no hay plantilla disponible para el tipo de colectividad
      handleMutationError(error, {
        422: () => {
          notifications.show({
            title: i18n.t('treasury:feePlans.notifications.importError.title'),
            message: i18n.t('treasury:feePlans.notifications.importError.message'),
            color: 'red',
          });
        },
      });
    },
  });
}
