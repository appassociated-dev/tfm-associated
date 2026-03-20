import { useQuery } from '@tanstack/react-query';

import { getFeePlan } from '../api/fee-plan.api';

/** Hook para obtener el detalle de un plan de cuota por ID. */
export function useFeePlan(id: string) {
  return useQuery({
    queryKey: ['fee-plans', id],
    queryFn: () => getFeePlan(id),
    enabled: !!id,
  });
}
