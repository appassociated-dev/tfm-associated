import { useState } from 'react';
import { useParams } from 'react-router';
import {
  Alert,
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
      setReasonError(`Motivo es obligatorio (mínimo ${REASON_MIN_LENGTH} caracteres)`);
      return;
    }
    if (reason.length > REASON_MAX_LENGTH) {
      setReasonError(`El motivo no puede superar ${REASON_MAX_LENGTH} caracteres`);
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
      <Alert color="red" title="Error al cargar datos de baja">
        No se pudo obtener el resumen de baja del socio.
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!summary) return null;

  return (
    <>
      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>Baja Voluntaria</Title>

        {/* Seccion: Datos del socio */}
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
                Numero de socio
              </Text>
              <Text size="sm">#{summary.memberNumber}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Estado
              </Text>
              <StatusBadge status={summary.currentStatus} />
            </div>
          </Group>

          {isStateLocked && (
            <Alert color="red" title="Baja no disponible">
              Este socio no puede darse de baja desde el estado actual.
            </Alert>
          )}
        </Stack>

        {/* Seccion: Fecha efectiva */}
        {!isStateLocked && (
          <Stack gap="sm">
            <Title order={4}>Fecha efectiva</Title>
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
                    description={option.description}
                  />
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        )}

        {/* Seccion: Impacto financiero */}
        <Stack gap="sm">
          <Title order={4}>Impacto financiero</Title>

          {/* Alerta de deuda */}
          {summary.totalPendingDebt > 0 ? (
            <Alert color="yellow" title="Cargos pendientes">
              El socio tiene cargos pendientes por {formatMoney(summary.totalPendingDebt)}. Los
              cargos pendientes se mantienen como deuda. No se generaran nuevos cargos futuros.
            </Alert>
          ) : (
            <Alert color="green" title="Sin deuda pendiente">
              El socio no tiene cargos pendientes.
            </Alert>
          )}

          {/* Tabla de suscripciones activas */}
          {summary.activeSubscriptions.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Suscripciones activas que se cerraran
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
                      Plan
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
                      Periodicidad
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.activeSubscriptions.map((sub) => (
                    <Table.Tr key={sub.id}>
                      <Table.Td>{sub.planName}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(sub.effectiveAmount)}
                      </Table.Td>
                      <Table.Td>{sub.periodicity}</Table.Td>
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
                Cargos pendientes
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
                    <Table.Tr key={charge.id}>
                      <Table.Td>{charge.description}</Table.Td>
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
        </Stack>

        {/* Seccion: Motivo */}
        {!isStateLocked && (
          <Stack gap="sm">
            <Title order={4}>Motivo</Title>
            <Textarea
              placeholder="Indique el motivo de la baja voluntaria"
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
              {reason.length}/{REASON_MAX_LENGTH} caracteres (mínimo {REASON_MIN_LENGTH})
            </Text>
          </Stack>
        )}

        {/* Boton de confirmacion */}
        {!isStateLocked && (
          <Group justify="flex-end">
            <Button color="red" onClick={handleOpenConfirm} disabled={!canSubmit}>
              Confirmar Baja Voluntaria
            </Button>
          </Group>
        )}
      </Stack>

      {/* Modal de confirmacion de doble paso */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Confirmar Baja Voluntaria"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Se dara de baja al socio{' '}
            <Text span fw={600}>
              {summary.memberName}
            </Text>{' '}
            (#{summary.memberNumber}) con fecha efectiva{' '}
            <Text span fw={600}>
              {selectedOption ? formatDateLong(new Date(selectedOption.effectiveDate)) : ''}
            </Text>
            .
          </Text>

          <Text size="sm">
            Esta accion cerrara {summary.activeSubscriptions.length} suscripciones activas.
          </Text>

          <Text size="sm">
            Los cargos pendientes ({formatMoney(summary.totalPendingDebt)}) se mantienen.
          </Text>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="default" onClick={closeConfirm}>
              Cancelar
            </Button>
            <Button color="red" onClick={handleConfirm} loading={voluntaryLeave.isPending}>
              Confirmar
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
