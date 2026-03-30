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
import { useTranslation } from 'react-i18next';

import classes from './change-plan-modal.module.css';
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
  memberTypeId: string;
  subscription: FeeSubscription;
}

/** Modal para cambiar la modalidad de pago (plan) de una suscripcion activa. */
export function ChangePlanModal({
  opened,
  onClose,
  memberAccountId,
  memberTypeId,
  subscription,
}: ChangePlanModalProps) {
  const { t } = useTranslation('treasury');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [effectiveDateType, setEffectiveDateType] = useState<EffectiveDateType>('IMMEDIATE');
  const [keepPendingCharges, setKeepPendingCharges] = useState(true);

  const { data: feePlans, isLoading: plansLoading } = useFeePlans({ active: true, memberTypeId });
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
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t('subscriptions.changePlanModal.title')}
      size="lg"
    >
      <Stack gap="md">
        {/* Seccion: Plan actual */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            {t('subscriptions.changePlanModal.currentPlan')}
          </Text>
          <Group gap="sm">
            <Text fw={500}>{subscription.feePlanName}</Text>
            <Badge variant="light" radius="sm">
              {subscription.feePlanCode}
            </Badge>
          </Group>
          <Group gap="lg" mt={4}>
            <Text size="sm">
              {t('subscriptions.changePlanModal.baseAmountLabel')}{' '}
              <Text component="span" fw={600} className={classes['tabular-nums']}>
                {formatMoney(subscription.baseAmount)}
              </Text>
            </Text>
            {currentBreakdown && (
              <Text size="sm">
                {t('subscriptions.changePlanModal.effectiveAmountLabel')}{' '}
                <Text component="span" fw={600} className={classes['tabular-nums']}>
                  {formatMoney(currentBreakdown.effectiveAmount)}
                </Text>
              </Text>
            )}
          </Group>
          {subscription.typeDiscount != null && (
            <Text size="xs" c="dimmed" mt={2}>
              {t('subscriptions.changePlanModal.typeDiscountInfo', {
                percent: Math.round(subscription.typeDiscount * 100),
              })}
              {subscription.personalDiscount != null &&
                ` | ${t('subscriptions.changePlanModal.personalDiscountInfo', { percent: Math.round(subscription.personalDiscount * 100) })}`}
            </Text>
          )}
        </div>

        {/* Selector de nuevo plan */}
        <Select
          label={t('subscriptions.changePlanModal.newPlan')}
          placeholder={t('subscriptions.changePlanModal.selectPlan')}
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
              {t('subscriptions.changePlanModal.newEffectiveAmount')}
            </Text>
            <Stack gap={2}>
              <Group justify="space-between">
                <Text size="sm">{t('subscriptions.changePlanModal.baseAmount')}</Text>
                <Text size="sm" fw={500} className={classes['tabular-nums-right']}>
                  {formatMoney(newBreakdown.baseAmount)}
                </Text>
              </Group>
              {newBreakdown.typeDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('subscriptions.changePlanModal.typeDiscountWithPercent', {
                      percent: Math.round(newBreakdown.typeDiscount * 100),
                    })}
                  </Text>
                  <Text size="sm" c="red" className={classes['tabular-nums-right']}>
                    -{formatMoney(newBreakdown.baseAmount - newBreakdown.afterTypeDiscount)}
                  </Text>
                </Group>
              )}
              {newBreakdown.personalDiscount != null && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('subscriptions.changePlanModal.personalDiscountWithPercent', {
                      percent: Math.round(newBreakdown.personalDiscount * 100),
                    })}
                  </Text>
                  <Text size="sm" c="red" className={classes['tabular-nums-right']}>
                    -{formatMoney(newBreakdown.afterTypeDiscount - newBreakdown.effectiveAmount)}
                  </Text>
                </Group>
              )}
              <Group justify="space-between" mt={4} className={classes['amount-divider']}>
                <Text size="sm" fw={700}>
                  {t('subscriptions.changePlanModal.effectiveAmount')}
                </Text>
                <Text size="sm" fw={700} className={classes['tabular-nums-right']}>
                  {formatMoney(newBreakdown.effectiveAmount)}
                </Text>
              </Group>
            </Stack>
          </div>
        )}

        {/* Selector de fecha efectiva */}
        <div>
          <Text fw={600} size="sm" c="dimmed" mb={4}>
            {t('subscriptions.changePlanModal.effectiveDateLabel')}
          </Text>
          <SegmentedControl
            fullWidth
            value={effectiveDateType}
            onChange={(v) => setEffectiveDateType(v as EffectiveDateType)}
            data={[
              { value: 'IMMEDIATE', label: t('subscriptions.changePlanModal.immediate') },
              { value: 'NEXT_MONTH', label: t('subscriptions.changePlanModal.nextMonth') },
              {
                value: 'NEXT_FISCAL_YEAR',
                label: t('subscriptions.changePlanModal.nextFiscalYear'),
              },
            ]}
          />
        </div>

        {/* Alerta de cargos pendientes (REQ-SPU-002): solo visible cuando hay cargos pendientes */}
        {subscription.pendingChargesCount != null && subscription.pendingChargesCount > 0 && (
          <Alert color="orange" variant="light">
            {t('subscriptions.changePlanModal.pendingChargesWarning', {
              count: subscription.pendingChargesCount,
            })}
          </Alert>
        )}

        {/* Alerta informativa */}
        <Alert color="blue" variant="light" title={t('subscriptions.changePlanModal.infoTitle')}>
          {t('subscriptions.changePlanModal.infoText')}
        </Alert>

        {/* Checkbox de cargos pendientes */}
        <Checkbox
          label={t('subscriptions.changePlanModal.keepPendingCharges')}
          checked={keepPendingCharges}
          onChange={(e) => setKeepPendingCharges(e.currentTarget.checked)}
        />

        {/* Botones de accion */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('subscriptions.changePlanModal.cancel')}
          </Button>
          <Button
            color="brand"
            onClick={handleSubmit}
            loading={changePlanMutation.isPending}
            disabled={!selectedPlanId}
          >
            {t('subscriptions.changePlanModal.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
