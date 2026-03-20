import { useState, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Select,
  SegmentedControl,
  Alert,
  Checkbox,
  Button,
} from '@mantine/core';
import { useFeePlans } from '../../fee-plans/hooks/use-fee-plans';
import type { FeePlan } from '../../fee-plans/schemas/fee-plan.schemas';
import { useChangePlan } from '../hooks/use-change-plan';
import type { FeeSubscription, EffectiveDateType } from '../schemas/subscription.schemas';
import { calculateEffectiveAmount } from '../utils/discount-calculator';
import { formatMoney } from '@/shared/utils/format-money';

interface ChangePlanModalProps {
  opened: boolean;
  onClose: () => void;
  memberAccountId: string;
  subscription: FeeSubscription;
}

/** Modal para cambiar la modalidad de pago (plan) de una suscripcion activa. */
export function ChangePlanModal({
  opened,
  onClose,
  memberAccountId,
  subscription,
}: ChangePlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [effectiveDateType, setEffectiveDateType] = useState<EffectiveDateType>('IMMEDIATE');
  const [keepPendingCharges, setKeepPendingCharges] = useState(true);

  const { data: feePlans, isLoading: plansLoading } = useFeePlans({ active: true });
  const changePlanMutation = useChangePlan(memberAccountId);

  // Planes disponibles excluyendo el plan actual
  const availablePlans = useMemo(() => {
    if (!feePlans) return [];
    return feePlans.filter((p: FeePlan) => p.id !== subscription.feePlanId);
  }, [feePlans, subscription.feePlanId]);

  // Opciones para el Select
  const planOptions = useMemo(
    () =>
      availablePlans.map((p: FeePlan) => ({
        value: p.id,
        label: `${p.name} — ${formatMoney(p.amount)}`,
      })),
    [availablePlans],
  );

  // Plan seleccionado
  const selectedPlan = useMemo(
    () => availablePlans.find((p: FeePlan) => p.id === selectedPlanId) ?? null,
    [availablePlans, selectedPlanId],
  );

  // Preview del nuevo importe efectivo manteniendo descuentos actuales
  const newBreakdown = useMemo(() => {
    if (!selectedPlan) return null;
    try {
      return calculateEffectiveAmount(
        selectedPlan.amount,
        subscription.typeDiscount,
        subscription.personalDiscount,
      );
    } catch {
      return null;
    }
  }, [selectedPlan, subscription.typeDiscount, subscription.personalDiscount]);

  // Breakdown del plan actual
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

  const handleSubmit = () => {
    if (!selectedPlanId) return;

    // Calcular fecha efectiva segun tipo
    const now = new Date();
    let effectiveDate: string;

    if (effectiveDateType === 'IMMEDIATE') {
      effectiveDate = now.toISOString();
    } else if (effectiveDateType === 'NEXT_MONTH') {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      effectiveDate = nextMonth.toISOString();
    } else {
      // NEXT_FISCAL_YEAR — inicio del proximo anio
      const nextYear = new Date(now.getFullYear() + 1, 0, 1);
      effectiveDate = nextYear.toISOString();
    }

    changePlanMutation.mutate(
      {
        subscriptionId: subscription.id,
        input: {
          newFeePlanId: selectedPlanId,
          effectiveDate,
          effectiveDateType,
          keepPendingCharges,
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
    setSelectedPlanId(null);
    setEffectiveDateType('IMMEDIATE');
    setKeepPendingCharges(true);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Cambiar Plan" size="lg">
      <Stack gap="md">
        {/* Seccion: Plan actual */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            Plan actual
          </Text>
          <Group gap="sm">
            <Text fw={500}>{subscription.feePlanName}</Text>
            <Badge variant="light" radius="sm">
              {subscription.feePlanCode}
            </Badge>
          </Group>
          <Group gap="lg" mt={4}>
            <Text size="sm">
              Importe base:{' '}
              <Text component="span" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(subscription.baseAmount)}
              </Text>
            </Text>
            {currentBreakdown && (
              <Text size="sm">
                Importe efectivo:{' '}
                <Text component="span" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(currentBreakdown.effectiveAmount)}
                </Text>
              </Text>
            )}
          </Group>
          {subscription.typeDiscount != null && (
            <Text size="xs" c="dimmed" mt={2}>
              Dto. tipo: {Math.round(subscription.typeDiscount * 100)}%
              {subscription.personalDiscount != null &&
                ` | Dto. personal: ${Math.round(subscription.personalDiscount * 100)}%`}
            </Text>
          )}
        </div>

        {/* Selector de nuevo plan */}
        <Select
          label="Nuevo plan"
          placeholder="Selecciona un plan"
          data={planOptions}
          value={selectedPlanId}
          onChange={setSelectedPlanId}
          disabled={plansLoading}
          searchable
        />

        {/* Preview del nuevo importe efectivo */}
        {newBreakdown && selectedPlan && (
          <div>
            <Text fw={600} size="sm" c="dimmed" mb={4}>
              Nuevo importe efectivo
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
                    Dto. personal ({Math.round(newBreakdown.personalDiscount * 100)}%)
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
                  Importe efectivo
                </Text>
                <Text
                  size="sm"
                  fw={700}
                  style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {formatMoney(newBreakdown.effectiveAmount)}
                </Text>
              </Group>
            </Stack>
          </div>
        )}

        {/* Selector de fecha efectiva */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            Fecha efectiva del cambio
          </Text>
          <SegmentedControl
            fullWidth
            value={effectiveDateType}
            onChange={(v) => setEffectiveDateType(v as EffectiveDateType)}
            data={[
              { value: 'IMMEDIATE', label: 'Inmediato (proximo cargo)' },
              { value: 'NEXT_MONTH', label: 'Inicio proximo mes' },
              { value: 'NEXT_FISCAL_YEAR', label: 'Inicio proximo ejercicio' },
            ]}
          />
        </div>

        {/* Alerta informativa */}
        <Alert color="blue" variant="light" title="Informacion">
          Los cargos futuros del plan actual se cancelaran
        </Alert>

        {/* Checkbox de cargos pendientes */}
        <Checkbox
          label="Mantener cargos pendientes (la deuda se arrastra al nuevo plan)"
          checked={keepPendingCharges}
          onChange={(e) => setKeepPendingCharges(e.currentTarget.checked)}
        />

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={changePlanMutation.isPending}
            disabled={!selectedPlanId}
          >
            Confirmar Cambio
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
