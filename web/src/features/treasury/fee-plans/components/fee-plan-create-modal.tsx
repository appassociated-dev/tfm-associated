import { Modal } from '@mantine/core';

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
  const createMutation = useCreateFeePlan();

  /** Envía los datos al backend y cierra el modal en caso de éxito. */
  async function handleSubmit(values: CreateFeePlanInput): Promise<void> {
    await createMutation.mutateAsync(values);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nuevo Plan de Cuota" size="lg">
      <FeePlanForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
    </Modal>
  );
}
