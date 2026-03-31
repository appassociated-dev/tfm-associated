import { useState } from 'react';
import { Badge, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TenantInfo } from '../schemas/auth.schemas';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

// === Types ===

export interface TenantSelectorProps {
  tenants: Array<TenantInfo & { role: string }>;
  onSelect: (tenantId: string) => Promise<void>;
}

// === Componente ===

/**
 * Selector de colectividad para usuarios multi-tenant.
 *
 * Se muestra después del login cuando el usuario pertenece
 * a más de una colectividad. Permite elegir a cuál acceder.
 */
export function TenantSelector({ tenants, onSelect }: TenantSelectorProps) {
  const { t } = useTranslation('auth');
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const lastTenantId = getLastTenantId();

  /** Gestiona la selección de un tenant con estado de carga. */
  async function handleSelect(tenantId: string): Promise<void> {
    // Evitar doble click mientras se procesa
    if (selectingId) return;

    setSelectingId(tenantId);

    try {
      await onSelect(tenantId);
      // Persistir la selección para futuras sesiones
      persistLastTenant(tenantId);
    } catch {
      // Si falla, liberar el estado para permitir reintentar
      setSelectingId(null);
    }
  }

  return (
    <Stack gap="md" w="100%">
      <Stack gap={4} align="center">
        <Title order={3}>{t('tenantSelector.title')}</Title>
        <Text c="dimmed">{t('tenantSelector.description')}</Text>
      </Stack>

      <Stack gap="md">
        {tenants.map((tenant) => {
          const isSelecting = selectingId === tenant.id;
          const isLastSession = tenant.id === lastTenantId;

          return (
            <Card
              key={tenant.id}
              withBorder
              shadow="sm"
              padding="lg"
              style={{ cursor: selectingId ? 'default' : 'pointer' }}
              opacity={selectingId && !isSelecting ? 0.6 : 1}
              onClick={() => handleSelect(tenant.id)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Group gap="xs">
                    <Text fw={600}>{tenant.name}</Text>
                    {isLastSession && (
                      <Badge size="xs" color="gray" variant="light">
                        {t('tenantSelector.lastSession')}
                      </Badge>
                    )}
                  </Group>
                </Stack>

                <Group gap="sm" wrap="nowrap">
                  <Badge color="brand" variant="light">
                    {tenant.role}
                  </Badge>
                  {isSelecting && <Loader size="xs" color="brand" />}
                </Group>
              </Group>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}

// === Utilidades privadas ===

/** Lee el último tenant seleccionado desde localStorage. */
function getLastTenantId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_TENANT);
  } catch {
    // localStorage puede no estar disponible (SSR, iframe sandbox, etc.)
    return null;
  }
}

/** Persiste el tenant seleccionado en localStorage. */
function persistLastTenant(tenantId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_TENANT, tenantId);
  } catch {
    // Silenciar errores de localStorage (quota, sandbox, etc.)
  }
}
