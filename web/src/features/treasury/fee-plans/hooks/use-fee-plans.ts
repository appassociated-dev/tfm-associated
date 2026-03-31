import { useQuery } from '@tanstack/react-query';

import { getFeePlans } from '../api/fee-plan.api';

/**
 * Hook para obtener el listado de planes de cuota.
 * Soporta filtrado por estado activo y por tipo de socio (REQ-SPU-005, REQ-SPU-007).
 * El queryKey incluye memberTypeId para invalidación de caché correcta.
 */
export function useFeePlans(params?: { active?: boolean; memberTypeId?: string }) {
  return useQuery({
    queryKey: ['fee-plans', params],
    queryFn: () => getFeePlans(params),
    staleTime: 30_000,
  });
}
