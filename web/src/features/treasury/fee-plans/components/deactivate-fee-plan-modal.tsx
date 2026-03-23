import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useDeactivateFeePlan } from '../hooks/use-deactivate-fee-plan';
import type { FeePlan } from '../schemas/fee-plan.schemas';

// === Tipos ===

export interface DeactivateFeePlanModalProps {
  opened: boolean;
  onClose: () => void;
  plan: FeePlan | null;
  /** Cantidad de suscripciones activas del plan (proporcionado por el padre). */
  activeSubscriptionsCount?: number;
}

// === Componente ===

/**
 * Modal de confirmación para inactivar un plan de cuota.
 *
 * Si el plan tiene suscripciones activas, informa al usuario
 * que no se puede eliminar pero sí marcar como inactivo.
 */
export function DeactivateFeePlanModal({
  opened,
  onClose,
  plan,
  activeSubscriptionsCount = 0,
}: DeactivateFeePlanModalProps) {
  const { t } = useTranslation('treasury');
  const deactivateMutation = useDeactivateFeePlan();

  /** Ejecuta la inactivación del plan. */
  async function handleDeactivate(): Promise<void> {
    if (!plan) return;
    await deactivateMutation.mutateAsync(plan.id);
    onClose();
  }

  // No renderizar contenido si no hay plan
  if (!plan) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('feePlans.deactivateModal.title')}
        size="sm"
      >
        <Text c="dimmed" size="sm" ta="center" py="md">
          {t('feePlans.deactivateModal.noPlanSelected')}
        </Text>
      </Modal>
    );
  }

  const hasActiveSubscriptions = activeSubscriptionsCount > 0;

  return (
    <Modal opened={opened} onClose={onClose} title={t('feePlans.deactivateModal.title')} size="sm">
      <Stack gap="md">
        {/* Advertencia si tiene suscripciones activas */}
        {hasActiveSubscriptions ? (
          <Alert color="yellow">
            {t('feePlans.deactivateModal.activeSubscriptions', { count: activeSubscriptionsCount })}
          </Alert>
        ) : (
          <Text size="sm">{t('feePlans.deactivateModal.confirmMessage', { name: plan.name })}</Text>
        )}

        {/* Nota informativa (siempre visible) */}
        <Text size="sm" c="dimmed">
          {t('feePlans.deactivateModal.infoNote')}
        </Text>

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {t('feePlans.deactivateModal.cancel')}
          </Button>
          <Button color="yellow" loading={deactivateMutation.isPending} onClick={handleDeactivate}>
            {t('feePlans.deactivateModal.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
