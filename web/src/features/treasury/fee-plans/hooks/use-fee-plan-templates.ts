import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { getTemplates, importTemplate } from '../api/fee-plan.api';

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
        title: 'Plantilla importada',
        message: `Plantilla importada: ${data.length} planes creados`,
        color: 'green',
      });
    },
  });
}
