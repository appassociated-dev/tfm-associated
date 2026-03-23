import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Center, Loader, Modal, Stack, Text } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/use-auth';
import { TenantSelector } from '@/features/auth/components/tenant-selector';
import { getMyTenants } from '@/features/auth/api/auth.api';

// === Tipos ===

export interface SwitchTenantModalProps {
  opened: boolean;
  onClose: () => void;
}

// === Componente ===

/**
 * Modal para cambiar de colectividad (tenant).
 * Carga la lista de tenants del usuario y reutiliza TenantSelector.
 */
export function SwitchTenantModal({ opened, onClose }: SwitchTenantModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { switchTenant, tenant: currentTenant } = useAuth();

  // Cargar tenants solo cuando el modal está abierto
  const {
    data: tenants,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'my-tenants'],
    queryFn: getMyTenants,
    enabled: opened,
    staleTime: 5 * 60 * 1000, // 5 minutos — la lista de tenants cambia poco
  });

  /** Cambia de tenant, limpia cache y navega al dashboard. */
  async function handleSelect(tenantId: string): Promise<void> {
    // No cambiar si ya está en el mismo tenant
    if (tenantId === currentTenant?.id) {
      onClose();
      return;
    }

    await switchTenant(tenantId);

    // Invalidar toda la cache de React Query al cambiar de tenant
    queryClient.clear();

    navigate('/dashboard');
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('tenant.switchTitle')} size="md">
      {isLoading && (
        <Center py="xl">
          <Loader color="brand" size="md" />
        </Center>
      )}

      {error && (
        <Stack align="center" py="xl" gap="sm">
          <Text c="red" size="sm">
            {t('tenant.loadError')}
          </Text>
          <Text c="dimmed" size="xs">
            {t('tenant.loadErrorDetail')}
          </Text>
        </Stack>
      )}

      {tenants && tenants.length > 0 && (
        <TenantSelector tenants={tenants} onSelect={handleSelect} />
      )}

      {tenants && tenants.length === 0 && (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          {t('tenant.emptyState')}
        </Text>
      )}
    </Modal>
  );
}
