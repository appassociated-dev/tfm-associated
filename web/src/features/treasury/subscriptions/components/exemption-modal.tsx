import { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  SegmentedControl,
  Textarea,
  TextInput,
  Alert,
  Button,
} from '@mantine/core';
import { useCloseSubscription } from '../hooks/use-close-subscription';

interface ExemptionModalProps {
  opened: boolean;
  onClose: () => void;
  memberAccountId: string;
  subscriptionId: string;
}

/**
 * Tipo de exencion seleccionable.
 * Para MVP, solo se implementa la exencion total (cierre con EXEMPTION).
 * La opcion de trazabilidad (descuento 100%) se muestra deshabilitada
 * ya que el schema limita el descuento maximo a 99%.
 */
type ExemptionType = 'total' | 'traceability';

/** Modal para aplicar una exencion temporal a una suscripcion. */
export function ExemptionModal({
  opened,
  onClose,
  memberAccountId,
  subscriptionId,
}: ExemptionModalProps) {
  const [exemptionType, setExemptionType] = useState<ExemptionType>('total');
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const closeSubscriptionMutation = useCloseSubscription(memberAccountId);

  const isReasonValid = reason.trim().length >= 3;

  // Para MVP solo se soporta exencion total
  const canSubmit = exemptionType === 'total' && isReasonValid;

  const handleSubmit = () => {
    if (!canSubmit) return;

    closeSubscriptionMutation.mutate(
      {
        subscriptionId,
        reason: 'EXEMPTION',
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setExemptionType('total');
    setReason('');
    setApprovedBy('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Exencion Temporal" size="md">
      <Stack gap="md">
        {/* Selector de tipo de exencion */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            Tipo de exencion
          </Text>
          <SegmentedControl
            fullWidth
            value={exemptionType}
            onChange={(v) => setExemptionType(v as ExemptionType)}
            data={[
              { value: 'total', label: 'Exencion total (sin suscripcion)' },
              {
                value: 'traceability',
                label: 'Exencion con trazabilidad',
                disabled: true,
              },
            ]}
          />
          {exemptionType === 'total' && (
            <Text size="xs" c="dimmed" mt={4}>
              Se cerrara la suscripcion con motivo EXEMPTION. No se generaran cargos mientras la
              suscripcion permanezca cerrada.
            </Text>
          )}
          {exemptionType === 'traceability' && (
            <Text size="xs" c="yellow" mt={4}>
              La exencion con trazabilidad (descuento 100%) no esta disponible en esta version. El
              descuento maximo permitido es 99%.
            </Text>
          )}
        </div>

        {/* Motivo (obligatorio) */}
        <Textarea
          label="Motivo de la exencion"
          placeholder="Indique el motivo de la exencion temporal"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={3}
          error={reason.length > 0 && !isReasonValid ? 'Minimo 3 caracteres' : undefined}
          required
        />

        {/* Aprobado por */}
        <TextInput
          label="Aprobado por"
          placeholder='Ej: "Junta Directiva 15/03/2026"'
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.currentTarget.value)}
        />

        {/* Alerta informativa */}
        <Alert color="blue" variant="light" title="Informacion">
          No se generaran cargos durante el periodo de exencion
        </Alert>

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={closeSubscriptionMutation.isPending}
            disabled={!canSubmit}
          >
            Aplicar Exencion
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
