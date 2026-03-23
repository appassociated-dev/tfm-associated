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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('treasury');
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
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('subscriptions.exemptionModal.title')}
      size="md"
    >
      <Stack gap="md">
        {/* Selector de tipo de exencion */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            {t('subscriptions.exemptionModal.typeLabel')}
          </Text>
          <SegmentedControl
            fullWidth
            value={exemptionType}
            onChange={(v) => setExemptionType(v as ExemptionType)}
            data={[
              { value: 'total', label: t('subscriptions.exemptionModal.totalOption') },
              {
                value: 'traceability',
                label: t('subscriptions.exemptionModal.traceabilityOption'),
                disabled: true,
              },
            ]}
          />
          {exemptionType === 'total' && (
            <Text size="xs" c="dimmed" mt={4}>
              {t('subscriptions.exemptionModal.totalDescription')}
            </Text>
          )}
          {exemptionType === 'traceability' && (
            <Text size="xs" c="yellow" mt={4}>
              {t('subscriptions.exemptionModal.traceabilityDescription')}
            </Text>
          )}
        </div>

        {/* Motivo (obligatorio) */}
        <Textarea
          label={t('subscriptions.exemptionModal.reasonLabel')}
          placeholder={t('subscriptions.exemptionModal.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={3}
          error={
            reason.length > 0 && !isReasonValid
              ? t('subscriptions.exemptionModal.minChars')
              : undefined
          }
          required
        />

        {/* Aprobado por */}
        <TextInput
          label={t('subscriptions.exemptionModal.approvedByLabel')}
          placeholder={t('subscriptions.exemptionModal.approvedByPlaceholder')}
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.currentTarget.value)}
        />

        {/* Alerta informativa */}
        <Alert color="blue" variant="light" title={t('subscriptions.exemptionModal.infoTitle')}>
          {t('subscriptions.exemptionModal.infoText')}
        </Alert>

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('subscriptions.exemptionModal.cancel')}
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={closeSubscriptionMutation.isPending}
            disabled={!canSubmit}
          >
            {t('subscriptions.exemptionModal.apply')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
