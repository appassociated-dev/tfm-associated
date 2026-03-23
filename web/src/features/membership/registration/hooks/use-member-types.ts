import { useQuery } from '@tanstack/react-query';

import { getMemberTypes } from '../api/registration.api';

/** Obtiene los tipos de socio activos con cache de 5 minutos. */
export function useMemberTypes() {
  return useQuery({
    queryKey: ['member-types', { active: true }],
    queryFn: getMemberTypes,
    staleTime: 300_000, // 5 minutos
  });
}
