import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Alert,
  Breadcrumbs,
  Button,
  Checkbox,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/shared/utils/format-money';
import { formatDateLong } from '@/shared/utils/format-date';
import { ApiError } from '@/shared/api/api-error';

import { useReinstatementSummary } from '../hooks/use-reinstatement-summary';
import { useReinstateMember } from '../hooks/use-reinstate-member';
import { StatusBadge } from '../components/status-badge';

// === Constantes ===

/** Estados que permiten rehabilitacion. */
const REINSTATABLE_STATES = ['VOLUNTARY_LEAVE', 'NONPAYMENT_LEAVE'];

// === Componente principal ===

/**
 * Pagina de rehabilitacion de ex-socio (UC-013, US-035).
 * Muestra desglose de costes, informacion de antiguedad y
 * requiere confirmacion de pago para rehabilitar.
 */
export function ReinstatementPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['membership', 'common']);

  // Datos
  const { data: summary, isLoading, isError, error, refetch } = useReinstatementSummary(memberId);
  const reinstateMember = useReinstateMember();

  // Estado del formulario
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // === Validaciones ===

  /** Determina si el tipo de baja permite rehabilitacion. */
  const canReinstate = summary ? REINSTATABLE_STATES.includes(summary.leaveType) : false;

  // === Handlers ===

  function handleReinstate() {
    if (!memberId) return;

    reinstateMember.mutate(
      {
        memberId,
        data: { paymentConfirmed: true },
      },
      {
        onSuccess: () => {
          navigate(`/members/${memberId}`);
        },
      },
    );
  }

  // === Estado de carga ===

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // === Estado de error ===

  if (isError) {
    // Error 422: el socio no puede ser rehabilitado desde su estado actual (ej: ACTIVE)
    const isCannotReinstate =
      error instanceof ApiError &&
      (error.status === 422 || error.code === 'MEMBERSHIP.CANNOT_REINSTATE');

    if (isCannotReinstate) {
      return (
        <Stack gap="md">
          <Title order={2}>{t('leave.reinstatement.title')}</Title>
          <Alert color="yellow" title={t('leave.reinstatement.notAvailableTitle')}>
            {t('leave.reinstatement.notAvailableText')}
          </Alert>
          <Group>
            <Button variant="default" onClick={() => navigate(`/members/${memberId}`)}>
              {t('leave.reinstatement.backToProfile')}
            </Button>
          </Group>
        </Stack>
      );
    }

    return (
      <Alert color="red" title={t('leave.reinstatement.errorLoadTitle')}>
        {t('leave.reinstatement.errorLoadText')}
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          {t('common:actions.retry')}
        </Button>
      </Alert>
    );
  }

  if (!summary) return null;

  return (
    <>
      <Breadcrumbs mb="md">
        <Text c="dimmed" size="sm">
          {t('leave.breadcrumbs.members')}
        </Text>
        <Text c="dimmed" size="sm">
          {summary.memberName}
        </Text>
        <Text size="sm">{t('leave.breadcrumbs.reinstatement')}</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>{t('leave.reinstatement.title')}</Title>

        {/* Seccion: Datos del ex-socio */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.memberData.exMemberTitle')}</Title>
          <Group gap="lg">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.name')}
              </Text>
              <Text size="sm">{summary.memberName}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.memberNumber')}
              </Text>
              <Text size="sm">#{summary.memberNumber ?? 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.dni')}
              </Text>
              <Text size="sm">{summary.memberDni ?? t('leave.memberData.dniNotAvailable')}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.leaveDate')}
              </Text>
              <Text size="sm">{formatDateLong(new Date(summary.leaveDate))}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.leaveType')}
              </Text>
              <StatusBadge status={summary.leaveType} />
            </div>
          </Group>

          {/* Alerta si no es rehabilitable */}
          {!canReinstate && (
            <Alert color="red" title={t('leave.reinstatement.notAvailableTitle')}>
              {t('leave.reinstatement.notAvailableFromStatus')}
            </Alert>
          )}
        </Stack>

        {/* Seccion: Desglose de importe */}
        {canReinstate && (
          <>
            <Stack gap="sm">
              <Title order={4}>{t('leave.reinstatement.costBreakdown')}</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 'var(--mantine-font-size-xs)',
                      }}
                      fw={600}
                      c="dimmed"
                    >
                      {t('leave.reinstatement.table.concept')}
                    </Table.Th>
                    <Table.Th
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 'var(--mantine-font-size-xs)',
                        textAlign: 'right',
                      }}
                      fw={600}
                      c="dimmed"
                    >
                      {t('leave.reinstatement.table.amount')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>{t('leave.reinstatement.table.pendingDebt')}</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(summary.pendingDebt)}
                    </Table.Td>
                  </Table.Tr>
                  {summary.penalty > 0 && (
                    <Table.Tr>
                      <Table.Td>{t('leave.reinstatement.table.penalty')}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(summary.penalty)}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {summary.newRegistrationFee > 0 && (
                    <Table.Tr>
                      <Table.Td>{t('leave.reinstatement.table.newRegistration')}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(summary.newRegistrationFee)}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  <Table.Tr>
                    <Table.Td>
                      <Text fw={700} size="md">
                        {t('leave.reinstatement.table.totalToPay')}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <Text fw={700} size="lg">
                        {formatMoney(summary.totalToPay)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>

              <Alert color="yellow" title={t('leave.reinstatement.fullPaymentTitle')}>
                {t('leave.reinstatement.fullPaymentText')}
              </Alert>
            </Stack>

            {/* Seccion: Antiguedad */}
            <Stack gap="sm">
              <Title order={4}>{t('leave.reinstatement.seniorityTitle')}</Title>
              {summary.keepSeniority ? (
                <Alert color="blue" title={t('leave.reinstatement.keepSeniorityTitle')}>
                  {summary.previousSeniorityMonths != null
                    ? t('leave.reinstatement.keepSeniorityText', {
                        months: summary.previousSeniorityMonths,
                      })
                    : t('leave.reinstatement.keepSeniorityTextNoMonths')}
                </Alert>
              ) : (
                <Alert color="gray" title={t('leave.reinstatement.resetSeniorityTitle')}>
                  {t('leave.reinstatement.resetSeniorityText')}
                </Alert>
              )}
            </Stack>

            {/* Seccion: Confirmacion */}
            <Stack gap="md">
              <Checkbox
                label={t('leave.reinstatement.paymentConfirmCheckbox', {
                  amount: formatMoney(summary.totalToPay),
                })}
                checked={paymentConfirmed}
                onChange={(event) => setPaymentConfirmed(event.currentTarget.checked)}
              />

              <Group justify="flex-end">
                <Button
                  color="green"
                  disabled={!paymentConfirmed}
                  loading={reinstateMember.isPending}
                  onClick={handleReinstate}
                >
                  {t('leave.reinstatement.reinstateButton')}
                </Button>
              </Group>
            </Stack>
          </>
        )}
      </Stack>
    </>
  );
}

// === Componentes internos ===

/** Skeleton de carga para la pagina de rehabilitacion. */
function LoadingSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={30} width={300} />
      <Stack gap="sm">
        <Skeleton height={20} width={200} />
        <Skeleton height={80} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={250} />
        <Skeleton height={180} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={150} />
        <Skeleton height={60} radius="md" />
      </Stack>
    </Stack>
  );
}
