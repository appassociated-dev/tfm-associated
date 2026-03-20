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
    label: 'Primera notificacion',
    description: 'Primer aviso de impago enviado al socio',
  },
  {
    days: 180,
    label: 'Segunda notificacion',
    description: 'Segundo aviso de impago con advertencia formal',
  },
  {
    days: 365,
    label: 'Aviso de expediente',
    description: 'Notificacion de apertura de expediente por impago',
  },
  {
    days: 730,
    label: 'Certificado de descubierto',
    description: 'Generacion del certificado de descubierto oficial',
  },
  { days: null, label: 'Baja efectiva', description: 'Ejecucion de la baja por impago' },
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

  // Datos
  const { data: summary, isLoading, isError, refetch } = useLeaveSummary(memberId);

  // Mutation para ejecutar baja por impago
  const nonpaymentLeave = useMutation({
    mutationFn: (id: string) => processNonpaymentLeave(id),
    onSuccess: (_data: LeaveResponse) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      notifications.show({
        title: 'Baja por impago procesada',
        message: 'La baja por impago ha sido ejecutada correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        notifications.show({
          title: 'Error de estado',
          message: 'No se puede procesar la baja desde el estado actual.',
          color: 'red',
        });
      }
    },
  });

  // Modales
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);
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
      <Alert color="red" title="Error al cargar datos">
        No se pudo obtener la informacion del socio para la baja por impago.
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!summary) return null;

  return (
    <>
      <Breadcrumbs mb="md">
        <Text c="dimmed" size="sm">
          Socios
        </Text>
        <Text c="dimmed" size="sm">
          {summary.memberName}
        </Text>
        <Text size="sm">Baja por Impago</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>Baja por Impago</Title>

        {/* Datos del socio */}
        <Stack gap="sm">
          <Title order={4}>Datos del socio</Title>
          <Group gap="lg">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Nombre
              </Text>
              <Text size="sm">{summary.memberName}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Número de socio
              </Text>
              <Text size="sm">#{summary.memberNumber}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                DNI
              </Text>
              <Text size="sm">{summary.memberDni ?? 'No disponible'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Estado
              </Text>
              <StatusBadge status={summary.currentStatus} />
            </div>
          </Group>
        </Stack>

        {/* Seccion: Resumen workflow de morosidad */}
        <Stack gap="sm">
          <Title order={4}>Resumen workflow de morosidad</Title>
          <Alert color="yellow" title="Workflow de morosidad incompleto">
            El workflow de baja por impago consta de 5 fases obligatorias. Todas las fases previas
            deben completarse antes de ejecutar la baja efectiva. El seguimiento de fechas y
            notificaciones se gestiona desde el backend.
          </Alert>
          <DelinquencyTimeline />
        </Stack>

        {/* Seccion: Certificado de descubierto preview */}
        <Stack gap="sm">
          <Title order={4}>Certificado de descubierto</Title>
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              {/* Datos del socio en el certificado */}
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Socio
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
                        Descripcion
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
                        Importe
                      </Table.Th>
                      <Table.Th
                        style={{
                          textTransform: 'uppercase',
                          fontSize: 'var(--mantine-font-size-xs)',
                        }}
                        fw={600}
                        c="dimmed"
                      >
                        Vencimiento
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
                  Deuda total:
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
                <Tooltip label="Requiere endpoint de backend" withArrow>
                  <Button
                    variant="outline"
                    color="brand"
                    onClick={() =>
                      notifications.show({
                        title: 'No disponible',
                        message:
                          'La generacion de certificado PDF requiere un endpoint de backend que aun no esta implementado.',
                        color: 'yellow',
                        autoClose: 4000,
                      })
                    }
                  >
                    Generar Certificado PDF
                  </Button>
                </Tooltip>
              </Group>
            </Stack>
          </Card>
        </Stack>

        {/* Seccion: Oportunidad de regularizacion */}
        <Stack gap="sm">
          <Title order={4}>Oportunidad de regularizacion</Title>
          <Alert color="blue" title="Regularizacion posible">
            Si el socio regulariza la deuda pendiente, se puede cancelar el proceso de baja y el
            socio volvera al estado activo.
          </Alert>
          <Group>
            <Tooltip label="Requiere endpoint de backend" withArrow>
              <Button
                variant="outline"
                color="brand"
                onClick={() =>
                  notifications.show({
                    title: 'No disponible',
                    message:
                      'La cancelacion de baja por regularizacion requiere un endpoint de backend que aun no esta implementado.',
                    color: 'yellow',
                    autoClose: 4000,
                  })
                }
              >
                Cancelar Baja - Regularizacion
              </Button>
            </Tooltip>
          </Group>
        </Stack>

        {/* Boton de confirmacion */}
        <Group justify="flex-end">
          <Tooltip
            label="Complete todas las fases del workflow antes de ejecutar la baja"
            withArrow
          >
            <Button color="red" disabled>
              Ejecutar Baja por Impago
            </Button>
          </Tooltip>
        </Group>
      </Stack>

      {/* Modal de confirmacion - paso 1 */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Confirmar Baja por Impago"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Esta a punto de ejecutar la baja por impago del socio{' '}
            <Text span fw={600}>
              {summary.memberName}
            </Text>{' '}
            (#{summary.memberNumber}).
          </Text>

          <Text size="sm">Deuda acumulada: {formatMoney(summary.totalPendingDebt)}</Text>

          <Text size="sm" c="red" fw={500}>
            Esta accion cerrara todas las suscripciones activas y cambiara el estado del socio a
            Baja por Impago.
          </Text>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeConfirm}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleFirstConfirm}>
              Continuar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de confirmacion - paso 2 (doble confirmacion) */}
      <Modal
        opened={doubleConfirmOpened}
        onClose={closeDoubleConfirm}
        title="Confirmacion final"
        centered
      >
        <Stack gap="md">
          <Alert color="red" title="Accion irreversible">
            La baja por impago requiere un proceso formal de rehabilitacion para ser revertida.
            Confirme que desea proceder.
          </Alert>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeDoubleConfirm}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleExecuteLeave} loading={nonpaymentLeave.isPending}>
              Confirmar Baja por Impago
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
  return (
    <Timeline active={-1} bulletSize={24} lineWidth={2}>
      {DELINQUENCY_PHASES.map((phase, index) => (
        <Timeline.Item
          key={index}
          title={
            <Group gap="xs">
              <Text size="sm" fw={500}>
                {phase.days !== null
                  ? `Fase ${index + 1} (${phase.days} dias)`
                  : `Fase ${index + 1}`}
              </Text>
              <Text size="sm" fw={500}>
                — {phase.label}
              </Text>
            </Group>
          }
        >
          <Text size="xs" c="dimmed">
            {phase.description}
          </Text>
          <Text size="xs" c="dimmed" fs="italic" mt={4}>
            Pendiente
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
