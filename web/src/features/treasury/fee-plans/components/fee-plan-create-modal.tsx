import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';
import { useCreateFeePlan } from '../hooks/use-create-fee-plan';
import { FeePlanForm } from './fee-plan-form';

// === Tipos ===

interface FeePlanCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

// === Componente ===

/**
 * Modal para crear un nuevo plan de cuota.
 * Encapsula el formulario y la mutación de creación.
 */
export function FeePlanCreateModal({ opened, onClose }: FeePlanCreateModalProps) {
  const { t } = useTranslation('treasury');
  const createMutation = useCreateFeePlan();

  /** Envía los datos al backend y cierra el modal en caso de éxito. */
  async function handleSubmit(values: CreateFeePlanInput): Promise<void> {
    await createMutation.mutateAsync(values);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('feePlans.createModal.title')} size="lg">
      <FeePlanForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
    </Modal>
  );
}
