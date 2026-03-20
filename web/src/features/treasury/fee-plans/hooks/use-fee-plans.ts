import { useQuery } from '@tanstack/react-query';

import { getFeePlans } from '../api/fee-plan.api';

/** Hook para obtener el listado de planes de cuota. */
export function useFeePlans(params?: { active?: boolean }) {
  return useQuery({
    queryKey: ['fee-plans', params],
    queryFn: () => getFeePlans(params),
    staleTime: 30_000,
  });
}
