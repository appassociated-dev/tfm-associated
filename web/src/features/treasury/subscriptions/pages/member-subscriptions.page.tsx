import { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Collapse,
  Group,
  Modal,
  Skeleton,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { usePermissions } from '@/features/auth/context/use-permissions';
import { formatMoney } from '@/shared/utils/format-money';
import { formatDateLong, formatDateCompact } from '@/shared/utils/format-date';

import { useSubscriptions } from '../hooks/use-subscriptions';
import { useCreateSubscription } from '../hooks/use-create-subscription';
import type { FeeSubscription, CancelReason } from '../schemas/subscription.schemas';
import { calculateEffectiveAmount } from '../utils/discount-calculator';
import { SubscriptionSelector } from '../components/subscription-selector';
import { ChangePlanModal } from '../components/change-plan-modal';
import { UpdateDiscountModal } from '../components/update-discount-modal';
import { ExemptionModal } from '../components/exemption-modal';

// === Constantes ===

const CANCEL_REASON_LABEL_KEYS: Record<CancelReason, string> = {
  PLAN_CHANGE: 'cancelReason.planChange',
  MEMBER_LEAVE: 'cancelReason.memberLeave',
  EXEMPTION: 'cancelReason.exemption',
  ONE_TIME_COMPLETED: 'cancelReason.oneTimeCompleted',
};

const CANCEL_REASON_COLORS: Record<CancelReason, string> = {
  PLAN_CHANGE: 'blue',
  MEMBER_LEAVE: 'red',
  EXEMPTION: 'yellow',
  ONE_TIME_COMPLETED: 'green',
};

const PLAN_TYPE_LABEL_KEYS: Record<string, string> = {
  RECURRING: 'planType.recurring',
  ONE_TIME: 'planType.oneTime',
};

const PLAN_TYPE_COLORS: Record<string, string> = {
  RECURRING: 'green',
  ONE_TIME: 'blue',
};

// === Componente principal ===

/**
 * Página de gestión de suscripciones de un socio.
 * Muestra la suscripción activa con acciones y el histórico en timeline.
 */
export function MemberSubscriptionsPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation('treasury');

  // Datos
  const { data: subscriptionsData, isLoading, isError, refetch } = useSubscriptions(memberId ?? '');

  const createSubscription = useCreateSubscription(memberId ?? '');

  // Modales
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [changePlanOpened, { open: openChangePlan, close: closeChangePlan }] = useDisclosure(false);
  const [discountOpened, { open: openDiscount, close: closeDiscount }] = useDisclosure(false);
  const [exemptionOpened, { open: openExemption, close: closeExemption }] = useDisclosure(false);

  // Permisos
  const canCreate = hasPermission('treasury:subscriptions:create');
  const canUpdate = hasPermission('treasury:subscriptions:update');

  // Datos derivados
  const activeSubscription = subscriptionsData?.activeSubscription ?? null;
  const closedSubscriptions = subscriptionsData?.closedSubscriptions ?? [];
  const memberName = subscriptionsData?.memberName ?? '';
  const memberTypeId = subscriptionsData?.memberTypeId ?? '';

  /** Descuento por tipo del socio (del subscription activa o primera cerrada como referencia). */
  const typeDiscount = useMemo(() => {
    if (activeSubscription?.typeDiscount !== undefined) {
      return activeSubscription.typeDiscount;
    }
    if (closedSubscriptions.length > 0) {
      return closedSubscriptions[0].typeDiscount;
    }
    return null;
  }, [activeSubscription, closedSubscriptions]);

  /** Handler para crear suscripción desde el selector. */
  function handleCreateSubscription(data: {
    feePlanId: string;
    personalDiscount: number | null;
    personalDiscountReason: string | null;
  }) {
    createSubscription.mutate(data, {
      onSuccess: () => {
        closeCreate();
      },
    });
  }

  // === Estado de carga ===

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // === Estado de error ===

  if (isError) {
    return (
      <Alert color="red" title={t('subscriptions.error.loadTitle')}>
        {t('subscriptions.error.loadText')}
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          {t('subscriptions.error.retry')}
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <Breadcrumbs mb="md">
        <Text c="dimmed" size="sm">
          {t('subscriptions.breadcrumbs.treasury')}
        </Text>
        <Text c="dimmed" size="sm">
          {t('subscriptions.breadcrumbs.memberAccounts')}
        </Text>
        <Text c="dimmed" size="sm">
          {memberName}
        </Text>
        <Text size="sm">{t('subscriptions.title')}</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Cabecera */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>{t('subscriptions.title')}</Title>
            {memberName && (
              <Text c="dimmed" size="sm">
                {memberName}
              </Text>
            )}
          </div>
        </Group>

        {/* Sección: Suscripción Activa */}
        <Stack gap="md">
          <Title order={4}>{t('subscriptions.activeSubscription')}</Title>

          {activeSubscription ? (
            <ActiveSubscriptionCard
              subscription={activeSubscription}
              canUpdate={canUpdate}
              onChangePlan={openChangePlan}
              onUpdateDiscount={openDiscount}
              onExemption={openExemption}
            />
          ) : (
            <NoActiveSubscription canCreate={canCreate} onCreateClick={openCreate} />
          )}
        </Stack>

        {/* Sección: Histórico de Suscripciones */}
        {closedSubscriptions.length > 0 && (
          <Stack gap="md">
            <Title order={4}>{t('subscriptions.history')}</Title>
            <SubscriptionTimeline subscriptions={closedSubscriptions} />
          </Stack>
        )}

        {/* Modal de creación */}
        <Modal
          opened={createOpened}
          onClose={closeCreate}
          title={t('subscriptions.create')}
          size="lg"
        >
          <SubscriptionSelector
            memberTypeId={memberTypeId}
            typeDiscount={typeDiscount}
            onSelect={handleCreateSubscription}
          />
        </Modal>

        {/* Modales de acciones sobre suscripción activa */}
        {activeSubscription && memberId && (
          <>
            <ChangePlanModal
              opened={changePlanOpened}
              onClose={closeChangePlan}
              memberAccountId={memberId}
              subscription={activeSubscription}
            />
            <UpdateDiscountModal
              opened={discountOpened}
              onClose={closeDiscount}
              memberAccountId={memberId}
              subscription={activeSubscription}
            />
            <ExemptionModal
              opened={exemptionOpened}
              onClose={closeExemption}
              memberAccountId={memberId}
              subscriptionId={activeSubscription.id}
            />
          </>
        )}
      </Stack>
    </>
  );
}

// === Componentes internos ===

interface ActiveSubscriptionCardProps {
  subscription: FeeSubscription;
  canUpdate: boolean;
  onChangePlan: () => void;
  onUpdateDiscount: () => void;
  onExemption: () => void;
}

/** Tarjeta con la suscripción activa y sus acciones. */
function ActiveSubscriptionCard({
  subscription,
  canUpdate,
  onChangePlan,
  onUpdateDiscount,
  onExemption,
}: ActiveSubscriptionCardProps) {
  const { t } = useTranslation('treasury');
  // Desglose de descuento
  const breakdown = useMemo(() => {
    try {
      return calculateEffectiveAmount(
        subscription.baseAmount,
        subscription.typeDiscount,
        subscription.personalDiscount,
      );
    } catch {
      return null;
    }
  }, [subscription]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Encabezado: nombre del plan + badges */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Text fw={600} size="lg">
              {subscription.feePlanName}
            </Text>
            <Badge variant="light" radius="sm" ff="monospace">
              {subscription.feePlanCode}
            </Badge>
            <Badge
              variant="light"
              radius="sm"
              color={PLAN_TYPE_COLORS[subscription.feePlanType] ?? 'gray'}
            >
              {t(
                (PLAN_TYPE_LABEL_KEYS[subscription.feePlanType] ??
                  subscription.feePlanType) as never,
              )}
            </Badge>
          </Group>
        </Group>

        {/* Desglose de importes */}
        {breakdown && (
          <Stack gap={4}>
            <AmountRow label={t('subscriptions.baseAmount')} amount={breakdown.baseAmount} />
            {breakdown.typeDiscount !== null && breakdown.typeDiscount > 0 && (
              <AmountRow
                label={t('subscriptions.typeDiscountWithPercent', {
                  percent: Math.round(breakdown.typeDiscount * 100),
                })}
                amount={-(breakdown.baseAmount - breakdown.afterTypeDiscount)}
                isDeduction
              />
            )}
            {breakdown.personalDiscount !== null && breakdown.personalDiscount > 0 && (
              <>
                <AmountRow
                  label={t('subscriptions.subtotal')}
                  amount={breakdown.afterTypeDiscount}
                />
                <AmountRow
                  label={t('subscriptions.personalDiscountWithPercent', {
                    percent: Math.round(breakdown.personalDiscount * 100),
                  })}
                  amount={-(breakdown.afterTypeDiscount - breakdown.effectiveAmount)}
                  isDeduction
                />
              </>
            )}
          </Stack>
        )}

        {/* Importe efectivo destacado */}
        <Group justify="space-between" align="baseline">
          <Text size="sm" c="dimmed">
            {t('subscriptions.effectiveAmount')}
          </Text>
          <Text size="xl" fw={700} c="brand" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(subscription.effectiveAmount)}
          </Text>
        </Group>

        {/* Descuento personal: motivo */}
        {subscription.personalDiscountReason && (
          <Text size="xs" c="dimmed" fs="italic">
            {t('subscriptions.discountReason')} {subscription.personalDiscountReason}
          </Text>
        )}

        {/* Fecha de inicio */}
        <Group gap="lg">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {t('subscriptions.registrationDate')}
            </Text>
            <Text size="sm">{formatDateLong(new Date(subscription.registrationDate))}</Text>
          </div>

          {/* Cargos */}
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {t('subscriptions.chargesCollected')}
            </Text>
            <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {subscription.chargesGenerated} / {formatMoney(subscription.totalCollected)}
            </Text>
          </div>
        </Group>

        {/* Botones de acción */}
        {canUpdate && (
          <Group gap="sm" mt="xs">
            <Button color="brand" variant="outline" onClick={onChangePlan}>
              {t('subscriptions.changePlan')}
            </Button>
            <Button color="brand" variant="outline" onClick={onUpdateDiscount}>
              {t('subscriptions.updateDiscount')}
            </Button>
            <Button color="brand" variant="outline" onClick={onExemption}>
              {t('subscriptions.temporaryExemption')}
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}

interface NoActiveSubscriptionProps {
  canCreate: boolean;
  onCreateClick: () => void;
}

/** Mensaje y acción cuando no hay suscripción activa. */
function NoActiveSubscription({ canCreate, onCreateClick }: NoActiveSubscriptionProps) {
  const { t } = useTranslation('treasury');
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" gap="md" py="md">
        <Text c="dimmed">{t('subscriptions.noActive')}</Text>
        {canCreate && (
          <Button color="brand" onClick={onCreateClick}>
            {t('subscriptions.create')}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

interface SubscriptionTimelineProps {
  subscriptions: FeeSubscription[];
}

/** Timeline con el histórico de suscripciones cerradas. */
function SubscriptionTimeline({ subscriptions }: SubscriptionTimelineProps) {
  return (
    <Timeline active={-1} bulletSize={24} lineWidth={2}>
      {subscriptions.map((sub) => (
        <Timeline.Item key={sub.id}>
          <TimelineEntry subscription={sub} />
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

interface TimelineEntryProps {
  subscription: FeeSubscription;
}

/** Entrada individual del timeline con desglose expandible. */
function TimelineEntry({ subscription }: TimelineEntryProps) {
  const { t } = useTranslation('treasury');
  const [expanded, setExpanded] = useState(false);

  // Periodo
  const period = useMemo(() => {
    const start = formatDateCompact(new Date(subscription.registrationDate));
    const end = subscription.leaveDate
      ? formatDateCompact(new Date(subscription.leaveDate))
      : t('subscriptions.active');
    return `${start} — ${end}`;
  }, [subscription.registrationDate, subscription.leaveDate]);

  // Desglose
  const breakdown = useMemo(() => {
    try {
      return calculateEffectiveAmount(
        subscription.baseAmount,
        subscription.typeDiscount,
        subscription.personalDiscount,
      );
    } catch {
      return null;
    }
  }, [subscription]);

  return (
    <Stack gap="xs">
      {/* Resumen compacto */}
      <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
        <Text size="sm" c="dimmed">
          {period}
        </Text>
        <Text size="sm" fw={500}>
          {subscription.feePlanName}
        </Text>
        <Text size="sm" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(subscription.effectiveAmount)}
        </Text>
        {subscription.cancelReason && (
          <Badge
            variant="light"
            radius="sm"
            color={CANCEL_REASON_COLORS[subscription.cancelReason] ?? 'gray'}
            size="xs"
          >
            {t(
              (CANCEL_REASON_LABEL_KEYS[subscription.cancelReason] ??
                subscription.cancelReason) as never,
            )}
          </Badge>
        )}
      </Group>

      {/* Detalle expandible */}
      <Collapse in={expanded}>
        <Card withBorder padding="sm" radius="md" bg="gray.0" mt="xs">
          <Stack gap={4}>
            {breakdown && (
              <>
                <AmountRow label={t('subscriptions.baseAmount')} amount={breakdown.baseAmount} />
                {breakdown.typeDiscount !== null && breakdown.typeDiscount > 0 && (
                  <AmountRow
                    label={t('subscriptions.typeDiscountWithPercent', {
                      percent: Math.round(breakdown.typeDiscount * 100),
                    })}
                    amount={-(breakdown.baseAmount - breakdown.afterTypeDiscount)}
                    isDeduction
                  />
                )}
                {breakdown.personalDiscount !== null && breakdown.personalDiscount > 0 && (
                  <AmountRow
                    label={t('subscriptions.personalDiscountWithPercent', {
                      percent: Math.round(breakdown.personalDiscount * 100),
                    })}
                    amount={-(breakdown.afterTypeDiscount - breakdown.effectiveAmount)}
                    isDeduction
                  />
                )}
                <AmountRow
                  label={t('subscriptions.effectiveAmount')}
                  amount={breakdown.effectiveAmount}
                  isBold
                />
              </>
            )}

            <Group justify="space-between" mt="xs">
              <Text size="xs" c="dimmed">
                {t('subscriptions.chargesGenerated')}
              </Text>
              <Text
                size="xs"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}
              >
                {subscription.chargesGenerated}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {t('subscriptions.totalCollected')}
              </Text>
              <Text
                size="xs"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}
              >
                {formatMoney(subscription.totalCollected)}
              </Text>
            </Group>
          </Stack>
        </Card>
      </Collapse>
    </Stack>
  );
}

// === Componentes auxiliares compartidos ===

interface AmountRowProps {
  label: string;
  amount: number;
  isDeduction?: boolean;
  isBold?: boolean;
}

/** Fila de importe con alineación y formato tabular. */
function AmountRow({ label, amount, isDeduction = false, isBold = false }: AmountRowProps) {
  const displayAmount = isDeduction ? Math.abs(amount) : amount;
  const prefix = isDeduction ? '- ' : '';

  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text
        size="sm"
        fw={isBold ? 600 : undefined}
        c={isDeduction ? 'red' : undefined}
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

/** Skeleton de carga que simula la estructura de la página. */
function LoadingSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={30} width={200} />
      <Stack gap="md">
        <Skeleton height={20} width={180} />
        <Skeleton height={200} radius="md" />
      </Stack>
      <Stack gap="md">
        <Skeleton height={20} width={220} />
        <Skeleton height={100} radius="md" />
        <Skeleton height={100} radius="md" />
      </Stack>
    </Stack>
  );
}
