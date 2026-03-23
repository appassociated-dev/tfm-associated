import { useParams } from 'react-router';
import {
  Alert,
  Breadcrumbs,
  Button,
  Card,
  Group,
  Modal,
  Skeleton,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/shared/utils/format-money';
import { formatDateCompact } from '@/shared/utils/format-date';

import { useLeaveSummary } from '../hooks/use-leave-summary';
import { processNonpaymentLeave } from '../api/member-leave.api';
import { StatusBadge } from '../components/status-badge';
import type { LeaveResponse } from '../schemas/member-leave.schemas';

// === Constantes ===

/** Fases del workflow de morosidad con sus plazos en dias. */
const DELINQUENCY_PHASES = [
  {
    days: 90,
    labelKey: 'leave.nonpayment.phase1Label',
    descriptionKey: 'leave.nonpayment.phase1Description',
  },
  {
    days: 180,
    labelKey: 'leave.nonpayment.phase2Label',
    descriptionKey: 'leave.nonpayment.phase2Description',
  },
  {
    days: 365,
    labelKey: 'leave.nonpayment.phase3Label',
    descriptionKey: 'leave.nonpayment.phase3Description',
  },
  {
    days: 730,
    labelKey: 'leave.nonpayment.phase4Label',
    descriptionKey: 'leave.nonpayment.phase4Description',
  },
  {
    days: null,
    labelKey: 'leave.nonpayment.phase5Label',
    descriptionKey: 'leave.nonpayment.phase5Description',
  },
] as const;

// === Componente principal ===

/**
 * Pagina de baja por impago de socio (UC-013, US-033).
 * Muestra el resumen del workflow de morosidad, preview del certificado
 * de descubierto, opcion de regularizacion y confirmacion de baja.
 */
export function NonpaymentLeavePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['membership', 'common']);

  // Datos
  const { data: summary, isLoading, isError, refetch } = useLeaveSummary(memberId);

  // Mutation para ejecutar baja por impago
  const nonpaymentLeave = useMutation({
    mutationFn: (id: string) => processNonpaymentLeave(id),
    onSuccess: (_data: LeaveResponse) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      notifications.show({
        title: t('leave.nonpayment.notifications.successTitle'),
        message: t('leave.nonpayment.notifications.successText'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        notifications.show({
          title: t('leave.nonpayment.notifications.stateErrorTitle'),
          message: t('leave.nonpayment.notifications.stateErrorText'),
          color: 'red',
        });
      }
    },
  });

  // Modales
  const [confirmOpened, { close: closeConfirm }] = useDisclosure(false);
  const [doubleConfirmOpened, { open: openDoubleConfirm, close: closeDoubleConfirm }] =
    useDisclosure(false);

  // === Handlers ===

  /** Primer paso de confirmacion: abre el primer modal. */
  function handleFirstConfirm() {
    closeConfirm();
    openDoubleConfirm();
  }

  /** Segundo paso de confirmacion: ejecuta la baja. */
  function handleExecuteLeave() {
    if (!memberId) return;

    nonpaymentLeave.mutate(memberId, {
      onSuccess: () => {
        closeDoubleConfirm();
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
      <Alert color="red" title={t('leave.nonpayment.errorLoadTitle')}>
        {t('leave.nonpayment.errorLoadText')}
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
        <Text size="sm">{t('leave.nonpayment.title')}</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>{t('leave.nonpayment.title')}</Title>

        {/* Datos del socio */}
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
        </Stack>

        {/* Seccion: Resumen workflow de morosidad */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.nonpayment.workflowTitle')}</Title>
          <Alert color="yellow" title={t('leave.nonpayment.workflowIncompleteTitle')}>
            {t('leave.nonpayment.workflowIncompleteText')}
          </Alert>
          <DelinquencyTimeline />
        </Stack>

        {/* Seccion: Certificado de descubierto preview */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.nonpayment.certificateTitle')}</Title>
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              {/* Datos del socio en el certificado */}
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {t('leave.nonpayment.certificateMember')}
                  </Text>
                  <Text size="sm">
                    {summary.memberName} (#{summary.memberNumber})
                  </Text>
                </div>
              </Group>

              {/* Detalle de deuda */}
              {summary.pendingCharges.length > 0 && (
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
                        <Table.Td
                          style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatMoney(charge.amount)}
                        </Table.Td>
                        <Table.Td>{formatDateCompact(new Date(charge.dueDate))}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
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

              {/* Boton de generacion de certificado PDF */}
              <Group justify="flex-end">
                <Tooltip label={t('leave.nonpayment.certificateTooltip')} withArrow>
                  <Button
                    variant="outline"
                    color="brand"
                    onClick={() =>
                      notifications.show({
                        title: t('leave.nonpayment.certificateNotAvailableTitle'),
                        message: t('leave.nonpayment.certificateNotAvailableText'),
                        color: 'yellow',
                        autoClose: 4000,
                      })
                    }
                  >
                    {t('leave.nonpayment.generateCertificate')}
                  </Button>
                </Tooltip>
              </Group>
            </Stack>
          </Card>
        </Stack>

        {/* Seccion: Oportunidad de regularizacion */}
        <Stack gap="sm">
          <Title order={4}>{t('leave.nonpayment.regularizationTitle')}</Title>
          <Alert color="blue" title={t('leave.nonpayment.regularizationAlertTitle')}>
            {t('leave.nonpayment.regularizationAlertText')}
          </Alert>
          <Group>
            <Tooltip label={t('leave.nonpayment.certificateTooltip')} withArrow>
              <Button
                variant="outline"
                color="brand"
                onClick={() =>
                  notifications.show({
                    title: t('leave.nonpayment.cancelLeaveNotAvailableTitle'),
                    message: t('leave.nonpayment.cancelLeaveNotAvailableText'),
                    color: 'yellow',
                    autoClose: 4000,
                  })
                }
              >
                {t('leave.nonpayment.cancelLeaveButton')}
              </Button>
            </Tooltip>
          </Group>
        </Stack>

        {/* Boton de confirmacion */}
        <Group justify="flex-end">
          <Tooltip label={t('leave.nonpayment.executeTooltip')} withArrow>
            <Button color="red" disabled>
              {t('leave.nonpayment.executeButton')}
            </Button>
          </Tooltip>
        </Group>
      </Stack>

      {/* Modal de confirmacion - paso 1 */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title={t('leave.nonpayment.confirmModal.title')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('leave.nonpayment.confirmModal.text')}{' '}
            <Text span fw={600}>
              {summary.memberName}
            </Text>{' '}
            {t('leave.nonpayment.confirmModal.withMemberNumber', {
              memberNumber: summary.memberNumber,
            })}
          </Text>

          <Text size="sm">
            {t('leave.nonpayment.confirmModal.debtAccumulated', {
              amount: formatMoney(summary.totalPendingDebt),
            })}
          </Text>

          <Text size="sm" c="red" fw={500}>
            {t('leave.nonpayment.confirmModal.warning')}
          </Text>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeConfirm}>
              {t('common:actions.cancel')}
            </Button>
            <Button color="red" onClick={handleFirstConfirm}>
              {t('leave.nonpayment.confirmModal.continue')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de confirmacion - paso 2 (doble confirmacion) */}
      <Modal
        opened={doubleConfirmOpened}
        onClose={closeDoubleConfirm}
        title={t('leave.nonpayment.doubleConfirmModal.title')}
        centered
      >
        <Stack gap="md">
          <Alert color="red" title={t('leave.nonpayment.doubleConfirmModal.irreversibleTitle')}>
            {t('leave.nonpayment.doubleConfirmModal.irreversibleText')}
          </Alert>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeDoubleConfirm}>
              {t('common:actions.cancel')}
            </Button>
            <Button color="red" onClick={handleExecuteLeave} loading={nonpaymentLeave.isPending}>
              {t('leave.nonpayment.doubleConfirmModal.confirmButton')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// === Componentes internos ===

/**
 * Timeline de fases del workflow de morosidad.
 * Muestra las 5 fases con estado completado/pendiente.
 * Sin datos reales de fechas (backend-driven), muestra estados placeholder.
 */
function DelinquencyTimeline() {
  const { t } = useTranslation('membership');

  return (
    <Timeline active={-1} bulletSize={24} lineWidth={2}>
      {DELINQUENCY_PHASES.map((phase, index) => (
        <Timeline.Item
          key={index}
          title={
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {phase.days !== null
                  ? t('leave.nonpayment.phaseWithDays', { index: index + 1, days: phase.days })
                  : t('leave.nonpayment.phaseNoDays', { index: index + 1 })}
              </Text>
              <Text size="sm" fw={500}>
                — {t(phase.labelKey)}
              </Text>
            </Group>
          }
        >
          <Text size="xs" c="dimmed">
            {t(phase.descriptionKey)}
          </Text>
          <Text size="xs" c="dimmed" fs="italic" mt={4}>
            {t('leave.nonpayment.phasePending')}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}

/** Skeleton de carga para la pagina de baja por impago. */
function LoadingSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={30} width={250} />
      <Stack gap="sm">
        <Skeleton height={20} width={180} />
        <Skeleton height={60} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={250} />
        <Skeleton height={200} radius="md" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={20} width={250} />
        <Skeleton height={200} radius="md" />
      </Stack>
    </Stack>
  );
}
