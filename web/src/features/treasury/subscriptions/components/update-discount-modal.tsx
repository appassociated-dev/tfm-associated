import { useState, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  NumberInput,
  Textarea,
  TextInput,
  Alert,
  Button,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useUpdateDiscount } from '../hooks/use-update-discount';
import type { FeeSubscription } from '../schemas/subscription.schemas';
import { calculateEffectiveAmount } from '../utils/discount-calculator';
import { formatMoney } from '@/shared/utils/format-money';

interface UpdateDiscountModalProps {
  opened: boolean;
  onClose: () => void;
  memberAccountId: string;
  subscription: FeeSubscription;
}

/** Modal para modificar el descuento personalizado de una suscripcion activa. */
export function UpdateDiscountModal({
  opened,
  onClose,
  memberAccountId,
  subscription,
}: UpdateDiscountModalProps) {
  const { t } = useTranslation('treasury');
  const currentPersonalPercent =
    subscription.personalDiscount != null ? Math.round(subscription.personalDiscount * 100) : 0;

  const [personalPercent, setPersonalPercent] = useState<number>(currentPersonalPercent);
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const updateDiscountMutation = useUpdateDiscount(memberAccountId);

  // Desglose del nuevo descuento en tiempo real.
  // Usa effectiveAmount como base de calculo (sin baseAmount — D2 design):
  // el DTO proporciona efectiveAmount calculado, que usamos como referencia aproximada.
  const newBreakdown = useMemo(() => {
    const newDiscount = personalPercent > 0 ? personalPercent / 100 : null;
    try {
      return calculateEffectiveAmount(
        subscription.effectiveAmount,
        subscription.typeDiscount,
        newDiscount,
      );
    } catch {
      return null;
    }
  }, [subscription.effectiveAmount, subscription.typeDiscount, personalPercent]);

  // Validacion: descuento combinado < 100%
  const typeFactor = 1 - (subscription.typeDiscount ?? 0);
  const personalFactor = 1 - personalPercent / 100;
  const combinedExceedsLimit = typeFactor * personalFactor <= 0;

  const isReasonValid = reason.trim().length >= 3;
  const isApprovedByValid = approvedBy.trim().length >= 3;
  const canSubmit =
    !combinedExceedsLimit &&
    isReasonValid &&
    isApprovedByValid &&
    personalPercent >= 0 &&
    personalPercent <= 99;

  const handleSubmit = () => {
    if (!canSubmit) return;

    updateDiscountMutation.mutate(
      {
        subscriptionId: subscription.id,
        input: {
          personalDiscount: personalPercent / 100,
          reason: reason.trim(),
          approvedBy: approvedBy.trim(),
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setPersonalPercent(currentPersonalPercent);
    setReason('');
    setApprovedBy('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('subscriptions.updateDiscountModal.title')}
      size="lg"
    >
      <Stack gap="md">
        {/* Descuento actual — muestra effectiveAmount del DTO directamente (D2 design) */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            {t('subscriptions.updateDiscountModal.currentDiscount')}
          </Text>
          <Stack gap={2}>
            <Group justify="space-between">
              <Text size="sm">{t('subscriptions.updateDiscountModal.currentEffectiveAmount')}</Text>
              <Text
                size="sm"
                fw={500}
                style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
              >
                {formatMoney(subscription.effectiveAmount)}
              </Text>
            </Group>
            {subscription.typeDiscount != null && subscription.typeDiscount > 0 && (
              <Text size="xs" c="dimmed">
                {t('subscriptions.updateDiscountModal.typeDiscountWithPercent', {
                  percent: Math.round(subscription.typeDiscount * 100),
                })}
              </Text>
            )}
            {subscription.personalDiscount != null && subscription.personalDiscount > 0 && (
              <Text size="xs" c="dimmed">
                {t('subscriptions.updateDiscountModal.personalDiscountWithPercent', {
                  percent: Math.round(subscription.personalDiscount * 100),
                })}
              </Text>
            )}
          </Stack>
        </div>

        {/* Input de nuevo descuento personal */}
        <NumberInput
          label={t('subscriptions.updateDiscountModal.newDiscountLabel')}
          description={t('subscriptions.updateDiscountModal.newDiscountDescription')}
          value={personalPercent}
          onChange={(v) => setPersonalPercent(typeof v === 'number' ? v : 0)}
          min={0}
          max={99}
          suffix="%"
          clampBehavior="strict"
          error={
            combinedExceedsLimit
              ? t('subscriptions.updateDiscountModal.discountExceededError')
              : undefined
          }
        />

        {/* Motivo (obligatorio) */}
        <Textarea
          label={t('subscriptions.updateDiscountModal.reasonLabel')}
          placeholder={t('subscriptions.updateDiscountModal.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={2}
          error={
            reason.length > 0 && !isReasonValid
              ? t('subscriptions.updateDiscountModal.minChars')
              : undefined
          }
          required
        />

        {/* Aprobado por (obligatorio) */}
        <TextInput
          label={t('subscriptions.updateDiscountModal.approvedByLabel')}
          placeholder={t('subscriptions.updateDiscountModal.approvedByPlaceholder')}
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.currentTarget.value)}
          error={
            approvedBy.length > 0 && !isApprovedByValid
              ? t('subscriptions.updateDiscountModal.minChars')
              : undefined
          }
          required
        />

        {/* Preview del nuevo importe efectivo en tiempo real */}
        {newBreakdown && !combinedExceedsLimit && (
          <div>
            <Text fw={600} size="sm" c="dimmed" mb={4}>
              {t('subscriptions.updateDiscountModal.newEffectivePreview')}
            </Text>
            <Stack gap={2}>
              <Group justify="space-between">
                <Text size="sm">{t('subscriptions.updateDiscountModal.baseAmount')}</Text>
                <Text
                  size="sm"
                  fw={500}
                  style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {formatMoney(newBreakdown.baseAmount)}
                </Text>
              </Group>
              {newBreakdown.typeDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('subscriptions.updateDiscountModal.typeDiscountWithPercent', {
                      percent: Math.round(newBreakdown.typeDiscount * 100),
                    })}
                  </Text>
                  <Text
                    size="sm"
                    c="red"
                    style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                  >
                    -{formatMoney(newBreakdown.baseAmount - newBreakdown.afterTypeDiscount)}
                  </Text>
                </Group>
              )}
              {newBreakdown.personalDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('subscriptions.updateDiscountModal.personalDiscountWithPercent', {
                      percent: Math.round(personalPercent),
                    })}
                  </Text>
                  <Text
                    size="sm"
                    c="red"
                    style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                  >
                    -{formatMoney(newBreakdown.afterTypeDiscount - newBreakdown.effectiveAmount)}
                  </Text>
                </Group>
              )}
              <Group
                justify="space-between"
                mt={4}
                style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 4 }}
              >
                <Text size="sm" fw={700}>
                  {t('subscriptions.updateDiscountModal.newEffectiveAmount')}
                </Text>
                <Text
                  size="sm"
                  fw={700}
                  c="teal"
                  style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {formatMoney(newBreakdown.effectiveAmount)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" ta="right">
                {t('subscriptions.updateDiscountModal.discountTotal')}{' '}
                {newBreakdown.totalDiscountPercent}%
              </Text>
            </Stack>
          </div>
        )}

        {/* Alerta informativa */}
        <Alert
          color="blue"
          variant="light"
          title={t('subscriptions.updateDiscountModal.infoTitle')}
        >
          {t('subscriptions.updateDiscountModal.infoText')}
        </Alert>

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('subscriptions.updateDiscountModal.cancel')}
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={updateDiscountMutation.isPending}
            disabled={!canSubmit}
          >
            {t('subscriptions.updateDiscountModal.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
