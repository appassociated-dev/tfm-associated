import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
  Breadcrumbs,
  Button,
  Group,
  Modal,
  Radio,
  Skeleton,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/shared/utils/format-money';
import { formatDateLong, formatDateCompact } from '@/shared/utils/format-date';

import { useLeaveSummary } from '../hooks/use-leave-summary';
import { useVoluntaryLeave } from '../hooks/use-voluntary-leave';
import { StatusBadge } from '../components/status-badge';

// === Constantes ===

/** Estados que no permiten procesar baja voluntaria. */
const NON_LEAVABLE_STATES = [
  'VOLUNTARY_LEAVE',
  'NONPAYMENT_LEAVE',
  'DISCIPLINARY_LEAVE',
  'DECEASED',
];

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

// === Componente principal ===

/**
 * Pagina de baja voluntaria de socio (UC-013, US-032).
 * Muestra resumen de impacto financiero, permite seleccionar fecha efectiva,
 * ingresar motivo y confirmar la baja con doble paso.
 */
export function VoluntaryLeavePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { t } = useTranslation(['membership', 'common']);

  // Datos
  const { data: summary, isLoading, isError, refetch } = useLeaveSummary(memberId);
  const voluntaryLeave = useVoluntaryLeave();

  // Estado del formulario
  const [selectedDateType, setSelectedDateType] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Modal de confirmacion
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  // === Validaciones ===

  const isReasonValid =
    reason.trim().length >= REASON_MIN_LENGTH && reason.length <= REASON_MAX_LENGTH;
  const canSubmit = selectedDateType !== null && isReasonValid;

  /** Determina si el estado actual del socio no permite baja. */
  const isStateLocked = summary ? NON_LEAVABLE_STATES.includes(summary.currentStatus) : false;

  /** Opcion de fecha seleccionada (para mostrar en la confirmacion). */
  const selectedOption = summary?.effectiveDateOptions.find((opt) => opt.type === selectedDateType);

  // === Handlers ===

  function handleOpenConfirm() {
    // Validar motivo antes de abrir modal
    if (reason.trim().length < REASON_MIN_LENGTH) {
      setReasonError(t('leave.voluntary.reasonRequired', { min: REASON_MIN_LENGTH }));
      return;
    }
    if (reason.length > REASON_MAX_LENGTH) {
      setReasonError(t('leave.voluntary.reasonTooLong', { max: REASON_MAX_LENGTH }));
      return;
    }
    setReasonError(null);
    openConfirm();
  }

  function handleConfirm() {
    if (!memberId || !selectedDateType) return;

    voluntaryLeave.mutate(
      {
        memberId,
        data: {
          effectiveDateType: selectedDateType as
            | 'IMMEDIATE'
            | 'END_OF_FISCAL_YEAR'
            | 'END_OF_NEXT_MONTH'
            | 'NOTICE_PERIOD',
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          closeConfirm();
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
    return (
      <Alert color="red" title={t('leave.voluntary.errorLoadTitle')}>
        {t('leave.voluntary.errorLoadText')}
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
        <Text size="sm">{t('leave.voluntary.title')}</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>{t('leave.voluntary.title')}</Title>

        {/* Seccion: Datos del socio */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.memberData.title')}</Title>
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
              <Text size="sm">#{summary.memberNumber}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.dni')}
              </Text>
              <Text size="sm">{summary.memberDni ?? t('leave.memberData.dniNotAvailable')}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t('leave.memberData.status')}
              </Text>
              <StatusBadge status={summary.currentStatus} />
            </div>
          </Group>

          {isStateLocked && (
            <Alert color="red" title={t('leave.voluntary.notAvailableTitle')}>
              {t('leave.voluntary.notAvailableText')}
            </Alert>
          )}
        </Stack>

        {/* Seccion: Fecha efectiva */}
        {!isStateLocked && (
          <Stack gap="sm">
            <Title order={4}>{t('leave.voluntary.effectiveDate')}</Title>
            <Radio.Group
              value={selectedDateType ?? ''}
              onChange={(value) => setSelectedDateType(value)}
            >
              <Stack gap="xs">
                {summary.effectiveDateOptions.map((option) => (
                  <Radio
                    key={option.type}
                    value={option.type}
                    label={`${option.label} (${formatDateLong(new Date(option.effectiveDate))})`}
                  />
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        )}

        {/* Seccion: Impacto financiero */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.voluntary.financialImpact')}</Title>

          {/* Alerta de deuda */}
          {summary.totalPendingDebt > 0 ? (
            <Alert color="yellow" title={t('leave.voluntary.pendingChargesTitle')}>
              {t('leave.voluntary.pendingChargesAlert', {
                amount: formatMoney(summary.totalPendingDebt),
              })}
            </Alert>
          ) : (
            <Alert color="green" title={t('leave.voluntary.noDebtTitle')}>
              {t('leave.voluntary.noDebtText')}
            </Alert>
          )}

          {/* Tabla de suscripciones activas */}
          {summary.activeSubscriptions.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t('leave.voluntary.activeSubscriptions')}
              </Text>
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
                      {t('leave.voluntary.table.plan')}
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
                      {t('leave.voluntary.table.amount')}
                    </Table.Th>
                    <Table.Th
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 'var(--mantine-font-size-xs)',
                      }}
                      fw={600}
                      c="dimmed"
                    >
                      {t('leave.voluntary.table.frequency')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.activeSubscriptions.map((sub) => (
                    <Table.Tr key={sub.subscriptionId}>
                      <Table.Td>{sub.feePlanName}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(sub.amount)}
                      </Table.Td>
                      <Table.Td>{sub.feePlanCode}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}

          {/* Tabla de cargos pendientes */}
          {summary.pendingCharges.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t('leave.voluntary.pendingChargesTitle')}
              </Text>
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
                      {t('leave.voluntary.table.description')}
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
                      {t('leave.voluntary.table.amount')}
                    </Table.Th>
                    <Table.Th
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 'var(--mantine-font-size-xs)',
                      }}
                      fw={600}
                      c="dimmed"
                    >
                      {t('leave.voluntary.table.dueDate')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.pendingCharges.map((charge) => (
                    <Table.Tr key={charge.chargeId}>
                      <Table.Td>{charge.concept ?? '—'}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(charge.amount)}
                      </Table.Td>
                      <Table.Td>{formatDateCompact(new Date(charge.dueDate))}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}

          {/* Total deuda */}
          <Group justify="flex-end" gap="sm">
            <Text size="sm" fw={600}>
              {t('leave.voluntary.totalDebt')}
            </Text>
            <Text
              size="lg"
              fw={700}
              c={summary.totalPendingDebt > 0 ? 'red' : undefined}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatMoney(summary.totalPendingDebt)}
            </Text>
          </Group>
        </Stack>

        {/* Seccion: Motivo */}
        {!isStateLocked && (
          <Stack gap="sm">
            <Title order={4}>{t('leave.voluntary.reason')}</Title>
            <Textarea
              placeholder={t('leave.voluntary.reasonPlaceholder')}
              minRows={3}
              maxRows={6}
              value={reason}
              onChange={(event) => {
                setReason(event.currentTarget.value);
                if (reasonError) setReasonError(null);
              }}
              error={reasonError}
              required
            />
            <Text size="xs" c="dimmed">
              {t('leave.voluntary.reasonCounter', {
                current: reason.length,
                max: REASON_MAX_LENGTH,
                min: REASON_MIN_LENGTH,
              })}
            </Text>
          </Stack>
        )}

        {/* Boton de confirmacion */}
        {!isStateLocked && (
          <Group justify="flex-end">
            <Button color="red" onClick={handleOpenConfirm} disabled={!canSubmit}>
              {t('leave.voluntary.confirmButton')}
            </Button>
          </Group>
        )}
      </Stack>

      {/* Modal de confirmacion de doble paso */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={t('leave.voluntary.confirmModal.title')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('leave.voluntary.confirmModal.memberLeaveText')}{' '}
            <Text span fw={600}>
              {summary.memberName}
            </Text>{' '}
            {t('leave.voluntary.confirmModal.withEffectiveDate', {
              memberNumber: summary.memberNumber,
            })}{' '}
            <Text span fw={600}>
              {selectedOption ? formatDateLong(new Date(selectedOption.effectiveDate)) : ''}
            </Text>
            .
          </Text>

          <Text size="sm">
            {t('leave.voluntary.confirmModal.subscriptionsClosed', {
              count: summary.activeSubscriptions.length,
            })}
          </Text>

          <Text size="sm">
            {t('leave.voluntary.confirmModal.pendingChargesMaintained', {
              amount: formatMoney(summary.totalPendingDebt),
            })}
          </Text>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeConfirm}>
              {t('common:actions.cancel')}
            </Button>
            <Button color="red" onClick={handleConfirm} loading={voluntaryLeave.isPending}>
              {t('common:actions.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// === Componentes internos ===

/** Skeleton de carga para la pagina de baja voluntaria. */
function LoadingSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={30} width={250} />
      <Stack gap="sm">
        <Skeleton height={20} width={180} />
        <Skeleton height={60} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={180} />
        <Skeleton height={120} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={180} />
        <Skeleton height={200} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={100} />
        <Skeleton height={80} radius="md" />
      </Stack>
    </Stack>
  );
}
