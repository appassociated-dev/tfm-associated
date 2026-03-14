import { useQuery } from '@tanstack/react-query';

import { getMemberTypes } from '../api/fee-plan.api';

/** Hook para obtener los tipos de socio activos (para selector de vinculacion). */
export function useMemberTypes() {
  return useQuery({
    queryKey: ['member-types'],
    queryFn: getMemberTypes,
    staleTime: 300_000,
  });
}
