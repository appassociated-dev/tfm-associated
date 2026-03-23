import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';

import { checkDni } from '../api/registration.api';

/** Verifica unicidad de DNI con debounce de 500ms. */
export function useCheckDni(dni: string) {
  const [debouncedDni] = useDebouncedValue(dni, 500);

  return useQuery({
    queryKey: ['check-dni', debouncedDni],
    queryFn: () => checkDni(debouncedDni),
    enabled: !!debouncedDni && debouncedDni.length >= 8,
  });
}
