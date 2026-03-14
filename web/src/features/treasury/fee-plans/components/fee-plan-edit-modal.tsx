import { Modal } from '@mantine/core';

import type { CreateFeePlanInput, FeePlan } from '../schemas/fee-plan.schemas';
import { useUpdateFeePlan } from '../hooks/use-update-fee-plan';
import { FeePlanForm } from './fee-plan-form';

// === Tipos ===

interface FeePlanEditModalProps {
  opened: boolean;
  onClose: () => void;
  plan: FeePlan | null;
}

// === Componente ===

/**
 * Modal para editar un plan de cuota existente.
 * Precarga el formulario con los datos del plan seleccionado.
 */
export function FeePlanEditModal({ opened, onClose, plan }: FeePlanEditModalProps) {
  const updateMutation = useUpdateFeePlan();

  /** Envía los datos actualizados y cierra el modal en caso de éxito. */
  async function handleSubmit(values: CreateFeePlanInput): Promise<void> {
    if (!plan) return;

    // Omitir el code del payload de update
    const { code: _code, ...updatePayload } = values;
    await updateMutation.mutateAsync({ id: plan.id, input: updatePayload });
    onClose();
  }

  if (!plan) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Editar Plan de Cuota" size="lg">
      <FeePlanForm
        initialValues={{
          code: plan.code,
          name: plan.name,
          description: plan.description,
          type: plan.type,
          amount: plan.amount,
          frequency: plan.frequency,
          billingMonths: plan.billingMonths,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        isEditing
      />
    </Modal>
  );
}
