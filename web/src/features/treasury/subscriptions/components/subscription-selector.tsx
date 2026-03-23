import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Alert,
  Skeleton,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/shared/utils/format-money';
import { useFeePlans } from '@/features/treasury/fee-plans/hooks/use-fee-plans';
import type { FeePlan } from '@/features/treasury/fee-plans/schemas/fee-plan.schemas';

import { calculateEffectiveAmount, type DiscountBreakdown } from '../utils/discount-calculator';

// === Tipos ===

export interface SubscriptionSelectorProps {
  /** ID del tipo de socio (reservado para filtrado futuro). */
  memberTypeId: string;
  /** Descuento por tipo de socio (0-1, null si no aplica). */
  typeDiscount: number | null;
  /** Callback al confirmar selección de plan y descuento. */
  onSelect: (data: {
    feePlanId: string;
    personalDiscount: number | null;
    personalDiscountReason: string | null;
  }) => void;
}

// === Constantes ===

const PLAN_TYPE_LABEL_KEYS: Record<string, string> = {
  RECURRING: 'planType.recurring',
  ONE_TIME: 'planType.oneTime',
};

const PLAN_TYPE_COLORS: Record<string, string> = {
  RECURRING: 'green',
  ONE_TIME: 'blue',
};

// === Componente ===

/**
 * Selector reutilizable de plan de cuota con cálculo de descuento en tiempo real.
 * Usado en la página de suscripciones (UC-018) y en el wizard de alta de socio (UC-011).
 */
export function SubscriptionSelector({
  memberTypeId: _memberTypeId,
  typeDiscount,
  onSelect,
}: SubscriptionSelectorProps) {
  const { t } = useTranslation('treasury');
  // Estado local
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [personalDiscountPercent, setPersonalDiscountPercent] = useState<number | string>('');
  const [personalDiscountReason, setPersonalDiscountReason] = useState('');

  // Datos: planes activos
  // TODO: filtrar por memberTypeId cuando el backend soporte el parámetro
  const { data: plans, isLoading, isError, refetch } = useFeePlans({ active: true });

  // Descuento personal como fracción (0-1) o null
  const personalDiscountFraction = useMemo(() => {
    const numValue =
      typeof personalDiscountPercent === 'number'
        ? personalDiscountPercent
        : parseFloat(personalDiscountPercent);
    if (isNaN(numValue) || numValue <= 0) return null;
    return numValue / 100;
  }, [personalDiscountPercent]);

  // Plan seleccionado
  const selectedPlan = useMemo(
    () => plans?.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  // Desglose de descuento en tiempo real
  const breakdown = useMemo<DiscountBreakdown | null>(() => {
    if (!selectedPlan) return null;
    try {
      return calculateEffectiveAmount(selectedPlan.amount, typeDiscount, personalDiscountFraction);
    } catch {
      // Descuento combinado >= 100%
      return null;
    }
  }, [selectedPlan, typeDiscount, personalDiscountFraction]);

  // Validación: descuento total >= 100%
  const isDiscountExceeded = useMemo(() => {
    if (!selectedPlan) return false;
    const typeFactor = 1 - (typeDiscount ?? 0);
    const personalFactor = 1 - (personalDiscountFraction ?? 0);
    return typeFactor * personalFactor <= 0;
  }, [selectedPlan, typeDiscount, personalDiscountFraction]);

  // Validación: motivo requerido si descuento > 0
  const isReasonRequired = personalDiscountFraction !== null && personalDiscountFraction > 0;
  const isReasonValid = !isReasonRequired || personalDiscountReason.length >= 3;

  // Habilitación del botón
  const canConfirm = selectedPlanId !== null && !isDiscountExceeded && isReasonValid;

  /** Confirma la selección invocando el callback. */
  function handleConfirm() {
    if (!selectedPlanId || !canConfirm) return;
    onSelect({
      feePlanId: selectedPlanId,
      personalDiscount: personalDiscountFraction,
      personalDiscountReason: isReasonRequired ? personalDiscountReason : null,
    });
  }

  // === Estados de carga y error ===

  if (isLoading) {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={120} radius="md" />
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert color="red" title={t('subscriptions.selector.loadError')}>
        {t('subscriptions.selector.loadErrorText')}
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          {t('subscriptions.selector.retry')}
        </Button>
      </Alert>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Alert color="yellow" title={t('subscriptions.selector.noPlans')}>
        {t('subscriptions.selector.noPlansText')}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Tarjetas de planes */}
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            typeDiscount={typeDiscount}
            isSelected={selectedPlanId === plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </SimpleGrid>

      {/* Descuento personal (solo si hay plan seleccionado) */}
      {selectedPlan && (
        <Stack gap="sm">
          <Text fw={500} size="sm">
            {t('subscriptions.selector.customDiscount')}
          </Text>

          <NumberInput
            label={t('subscriptions.selector.discountPercent')}
            placeholder="0"
            min={0}
            max={99}
            suffix="%"
            step={1}
            value={personalDiscountPercent}
            onChange={setPersonalDiscountPercent}
          />

          {isReasonRequired && (
            <Textarea
              label={t('subscriptions.selector.discountReason')}
              placeholder={t('subscriptions.selector.discountReasonPlaceholder')}
              minRows={2}
              maxRows={4}
              value={personalDiscountReason}
              onChange={(e) => setPersonalDiscountReason(e.currentTarget.value)}
              error={
                personalDiscountReason.length > 0 && personalDiscountReason.length < 3
                  ? t('subscriptions.selector.minChars')
                  : undefined
              }
            />
          )}

          {/* Error de descuento excedido */}
          {isDiscountExceeded && (
            <Alert color="red" title={t('subscriptions.selector.discountExceeded')}>
              {t('subscriptions.selector.discountExceededText')}
            </Alert>
          )}

          {/* Desglose de importe */}
          {breakdown && <DiscountBreakdownPreview breakdown={breakdown} />}
        </Stack>
      )}

      {/* Botón de confirmación */}
      <Group justify="flex-end">
        <Button color="brand" disabled={!canConfirm} onClick={handleConfirm}>
          {t('subscriptions.selector.confirmSelection')}
        </Button>
      </Group>
    </Stack>
  );
}

// === Componentes internos ===

interface PlanCardProps {
  plan: FeePlan;
  typeDiscount: number | null;
  isSelected: boolean;
  onSelect: () => void;
}

/** Tarjeta individual de plan de cuota. */
function PlanCard({ plan, typeDiscount, isSelected, onSelect }: PlanCardProps) {
  const { t } = useTranslation('treasury');
  // Calcular importe con descuento por tipo
  const amountWithTypeDiscount = useMemo(() => {
    if (typeDiscount === null || typeDiscount === 0) return null;
    return Math.round(plan.amount * (1 - typeDiscount));
  }, [plan.amount, typeDiscount]);

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? 'var(--mantine-color-brand-6)' : undefined,
        borderWidth: isSelected ? 2 : undefined,
      }}
      onClick={onSelect}
    >
      <Stack gap="xs">
        {/* Nombre y badges */}
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="md">
            {plan.name}
          </Text>
          <Badge variant="light" radius="sm" color={PLAN_TYPE_COLORS[plan.type] ?? 'gray'}>
            {t((PLAN_TYPE_LABEL_KEYS[plan.type] ?? plan.type) as never)}
          </Badge>
        </Group>

        {/* Importe base */}
        <Group gap="xs" align="baseline">
          <Text size="sm" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('subscriptions.selector.base')} {formatMoney(plan.amount)}
          </Text>
        </Group>

        {/* Importe con descuento por tipo (si aplica) */}
        {amountWithTypeDiscount !== null && (
          <Group gap="xs" align="baseline">
            <Text size="sm" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('subscriptions.selector.withTypeDiscount', {
                percent: Math.round((typeDiscount ?? 0) * 100),
              })}{' '}
              {formatMoney(amountWithTypeDiscount)}
            </Text>
          </Group>
        )}

        {/* Badge de seleccionado */}
        {isSelected && (
          <Badge variant="light" radius="sm" color="brand" size="xs">
            {t('subscriptions.selector.selected')}
          </Badge>
        )}
      </Stack>
    </Card>
  );
}

interface DiscountBreakdownPreviewProps {
  breakdown: DiscountBreakdown;
}

/** Vista previa del desglose de descuento paso a paso. */
function DiscountBreakdownPreview({ breakdown }: DiscountBreakdownPreviewProps) {
  const { t } = useTranslation('treasury');
  const typeDiscountAmount =
    breakdown.typeDiscount !== null && breakdown.typeDiscount > 0
      ? breakdown.baseAmount - breakdown.afterTypeDiscount
      : null;

  const personalDiscountAmount =
    breakdown.personalDiscount !== null && breakdown.personalDiscount > 0
      ? breakdown.afterTypeDiscount - breakdown.effectiveAmount
      : null;

  return (
    <Card withBorder padding="sm" radius="md" bg="gray.0">
      <Stack gap={4}>
        {/* Importe base */}
        <BreakdownRow label={t('subscriptions.baseAmount')} amount={breakdown.baseAmount} />

        {/* Descuento por tipo */}
        {typeDiscountAmount !== null && breakdown.typeDiscount !== null && (
          <BreakdownRow
            label={t('subscriptions.typeDiscountWithPercent', {
              percent: Math.round(breakdown.typeDiscount * 100),
            })}
            amount={-typeDiscountAmount}
            isDeduction
          />
        )}

        {/* Subtotal (solo si hay ambos descuentos) */}
        {typeDiscountAmount !== null && personalDiscountAmount !== null && (
          <BreakdownRow
            label={t('subscriptions.subtotal')}
            amount={breakdown.afterTypeDiscount}
            isBold
          />
        )}

        {/* Descuento personal */}
        {personalDiscountAmount !== null && breakdown.personalDiscount !== null && (
          <BreakdownRow
            label={t('subscriptions.personalDiscountWithPercent', {
              percent: Math.round(breakdown.personalDiscount * 100),
            })}
            amount={-personalDiscountAmount}
            isDeduction
          />
        )}

        {/* Separador visual */}
        <div
          style={{
            borderTop: '1px solid var(--mantine-color-gray-3)',
            margin: '4px 0',
          }}
        />

        {/* Importe efectivo */}
        <BreakdownRow
          label={t('subscriptions.effectiveAmount')}
          amount={breakdown.effectiveAmount}
          isBold
          isHighlighted
        />

        {/* Descuento total */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {t('subscriptions.selector.discountTotal')}
          </Text>
          <Text
            size="sm"
            fw={500}
            style={{
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
            }}
          >
            {breakdown.totalDiscountPercent} %
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

interface BreakdownRowProps {
  label: string;
  amount: number;
  isDeduction?: boolean;
  isBold?: boolean;
  isHighlighted?: boolean;
}

/** Fila individual del desglose de descuento. */
function BreakdownRow({
  label,
  amount,
  isDeduction = false,
  isBold = false,
  isHighlighted = false,
}: BreakdownRowProps) {
  const displayAmount = isDeduction ? Math.abs(amount) : amount;
  const prefix = isDeduction ? '- ' : '';

  return (
    <Group justify="space-between">
      <Text size="sm" c={isHighlighted ? undefined : 'dimmed'} fw={isBold ? 600 : undefined}>
        {label}
      </Text>
      <Text
        size={isHighlighted ? 'md' : 'sm'}
        fw={isBold || isHighlighted ? 600 : undefined}
        c={isHighlighted ? 'brand' : isDeduction ? 'red' : undefined}
        style={{
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {prefix}
        {formatMoney(displayAmount)}
      </Text>
    </Group>
  );
}
