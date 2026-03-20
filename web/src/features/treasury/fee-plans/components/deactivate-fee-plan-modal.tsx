import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
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
      <Modal opened={opened} onClose={onClose} title="Inactivar Plan" size="sm">
        <Text c="dimmed" size="sm" ta="center" py="md">
          No se ha seleccionado ningún plan.
        </Text>
      </Modal>
    );
  }

  const hasActiveSubscriptions = activeSubscriptionsCount > 0;

  return (
    <Modal opened={opened} onClose={onClose} title="Inactivar Plan" size="sm">
      <Stack gap="md">
        {/* Advertencia si tiene suscripciones activas */}
        {hasActiveSubscriptions ? (
          <Alert color="yellow">
            Este plan tiene {activeSubscriptionsCount} suscripciones activas. No puede eliminarse,
            pero sí marcarse como inactivo.
          </Alert>
        ) : (
          <Text size="sm">
            ¿Está seguro de que desea inactivar el plan &lsquo;{plan.name}&rsquo;?
          </Text>
        )}

        {/* Nota informativa (siempre visible) */}
        <Text size="sm" c="dimmed">
          El plan dejará de aparecer en los selectores de alta pero las suscripciones existentes no
          se verán afectadas.
        </Text>

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="yellow" loading={deactivateMutation.isPending} onClick={handleDeactivate}>
            Marcar como Inactivo
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
