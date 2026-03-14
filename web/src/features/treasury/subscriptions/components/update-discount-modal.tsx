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
  const currentPersonalPercent =
    subscription.personalDiscount != null ? Math.round(subscription.personalDiscount * 100) : 0;

  const [personalPercent, setPersonalPercent] = useState<number>(currentPersonalPercent);
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const updateDiscountMutation = useUpdateDiscount(memberAccountId);

  // Desglose actual
  const currentBreakdown = useMemo(() => {
    try {
      return calculateEffectiveAmount(
        subscription.baseAmount,
        subscription.typeDiscount,
        subscription.personalDiscount,
      );
    } catch {
      return null;
    }
  }, [subscription.baseAmount, subscription.typeDiscount, subscription.personalDiscount]);

  // Desglose con nuevo descuento (en tiempo real)
  const newBreakdown = useMemo(() => {
    const newDiscount = personalPercent > 0 ? personalPercent / 100 : null;
    try {
      return calculateEffectiveAmount(
        subscription.baseAmount,
        subscription.typeDiscount,
        newDiscount,
      );
    } catch {
      return null;
    }
  }, [subscription.baseAmount, subscription.typeDiscount, personalPercent]);

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
    <Modal opened={opened} onClose={handleClose} title="Modificar Descuento" size="lg">
      <Stack gap="md">
        {/* Desglose actual del descuento */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            Descuento actual
          </Text>
          {currentBreakdown && (
            <Stack gap={2}>
              <Group justify="space-between">
                <Text size="sm">Importe base</Text>
                <Text
                  size="sm"
                  fw={500}
                  style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {formatMoney(currentBreakdown.baseAmount)}
                </Text>
              </Group>
              {currentBreakdown.typeDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Dto. tipo ({Math.round(currentBreakdown.typeDiscount * 100)}%)
                  </Text>
                  <Text
                    size="sm"
                    c="red"
                    style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                  >
                    -{formatMoney(currentBreakdown.baseAmount - currentBreakdown.afterTypeDiscount)}
                  </Text>
                </Group>
              )}
              {currentBreakdown.personalDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Dto. personal ({Math.round(currentBreakdown.personalDiscount * 100)}%)
                  </Text>
                  <Text
                    size="sm"
                    c="red"
                    style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                  >
                    -
                    {formatMoney(
                      currentBreakdown.afterTypeDiscount - currentBreakdown.effectiveAmount,
                    )}
                  </Text>
                </Group>
              )}
              <Group
                justify="space-between"
                mt={4}
                style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 4 }}
              >
                <Text size="sm" fw={700}>
                  Importe efectivo actual
                </Text>
                <Text
                  size="sm"
                  fw={700}
                  style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {formatMoney(currentBreakdown.effectiveAmount)}
                </Text>
              </Group>
            </Stack>
          )}
        </div>

        {/* Input de nuevo descuento personal */}
        <NumberInput
          label="Nuevo descuento personalizado (%)"
          description="Valor entre 0 y 99%"
          value={personalPercent}
          onChange={(v) => setPersonalPercent(typeof v === 'number' ? v : 0)}
          min={0}
          max={99}
          suffix="%"
          clampBehavior="strict"
          error={
            combinedExceedsLimit ? 'El descuento combinado no puede alcanzar el 100%' : undefined
          }
        />

        {/* Motivo (obligatorio) */}
        <Textarea
          label="Motivo del cambio"
          placeholder="Indique el motivo del cambio de descuento"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={2}
          error={reason.length > 0 && !isReasonValid ? 'Minimo 3 caracteres' : undefined}
          required
        />

        {/* Aprobado por (obligatorio) */}
        <TextInput
          label="Aprobado por"
          placeholder='Ej: "Junta Directiva 15/03/2026"'
          value={approvedBy}
          onChange={(e) => setApprovedBy(e.currentTarget.value)}
          error={approvedBy.length > 0 && !isApprovedByValid ? 'Minimo 3 caracteres' : undefined}
          required
        />

        {/* Preview del nuevo importe efectivo en tiempo real */}
        {newBreakdown && !combinedExceedsLimit && (
          <div>
            <Text fw={600} size="sm" c="dimmed" mb={4}>
              Nuevo importe efectivo (preview)
            </Text>
            <Stack gap={2}>
              <Group justify="space-between">
                <Text size="sm">Importe base</Text>
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
                    Dto. tipo ({Math.round(newBreakdown.typeDiscount * 100)}%)
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
                    Dto. personal ({Math.round(personalPercent)}%)
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
                  Nuevo importe efectivo
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
                Descuento total: {newBreakdown.totalDiscountPercent}%
              </Text>
            </Stack>
          </div>
        )}

        {/* Alerta informativa */}
        <Alert color="blue" variant="light" title="Informacion">
          Los cargos ya generados mantienen su importe original. Solo los cargos futuros usaran el
          nuevo descuento.
        </Alert>

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={updateDiscountMutation.isPending}
            disabled={!canSubmit}
          >
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
