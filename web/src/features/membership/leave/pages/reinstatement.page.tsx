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
          <Title order={2}>Rehabilitacion de Socio</Title>
          <Alert color="yellow" title="Rehabilitacion no disponible">
            Este socio se encuentra en estado activo. La rehabilitacion solo aplica a socios que
            hayan sido dados de baja (baja voluntaria o baja por impago).
          </Alert>
          <Group>
            <Button variant="default" onClick={() => navigate(`/members/${memberId}`)}>
              Volver al perfil del socio
            </Button>
          </Group>
        </Stack>
      );
    }

    return (
      <Alert color="red" title="Error al cargar datos de rehabilitacion">
        No se pudo obtener el resumen de rehabilitacion del socio.
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
        <Text size="sm">Rehabilitacion</Text>
      </Breadcrumbs>

      <Stack gap="xl">
        {/* Titulo */}
        <Title order={2}>Rehabilitacion de Socio</Title>

        {/* Seccion: Datos del ex-socio */}
        <Stack gap="sm">
          <Title order={4}>Datos del ex-socio</Title>
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
              <Text size="sm">#{summary.memberNumber ?? 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                DNI
              </Text>
              <Text size="sm">{summary.memberDni ?? 'No disponible'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Fecha de baja
              </Text>
              <Text size="sm">{formatDateLong(new Date(summary.leaveDate))}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Tipo de baja
              </Text>
              <StatusBadge status={summary.leaveType} />
            </div>
          </Group>

          {/* Alerta si no es rehabilitable */}
          {!canReinstate && (
            <Alert color="red" title="Rehabilitacion no disponible">
              Este socio no puede rehabilitarse desde el estado actual.
            </Alert>
          )}
        </Stack>

        {/* Seccion: Desglose de importe */}
        {canReinstate && (
          <>
            <Stack gap="sm">
              <Title order={4}>Desglose de importe a pagar</Title>
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
                      Concepto
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
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Deuda pendiente</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(summary.pendingDebt)}
                    </Table.Td>
                  </Table.Tr>
                  {summary.penalty > 0 && (
                    <Table.Tr>
                      <Table.Td>Penalizacion</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(summary.penalty)}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {summary.newRegistrationFee > 0 && (
                    <Table.Tr>
                      <Table.Td>Nueva inscripcion</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(summary.newRegistrationFee)}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  <Table.Tr>
                    <Table.Td>
                      <Text fw={700} size="md">
                        Total a pagar
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

              <Alert color="yellow" title="Pago completo requerido">
                El pago debe ser completo. No se permiten pagos parciales.
              </Alert>
            </Stack>

            {/* Seccion: Antiguedad */}
            <Stack gap="sm">
              <Title order={4}>Antiguedad</Title>
              {summary.keepSeniority ? (
                <Alert color="blue" title="Recuperacion de antiguedad">
                  Se recuperara la antiguedad anterior
                  {summary.previousSeniorityMonths != null
                    ? ` (${summary.previousSeniorityMonths} meses)`
                    : ''}
                  .
                </Alert>
              ) : (
                <Alert color="gray" title="Antiguedad desde rehabilitacion">
                  La antiguedad comenzara desde la fecha de rehabilitacion.
                </Alert>
              )}
            </Stack>

            {/* Seccion: Confirmacion */}
            <Stack gap="md">
              <Checkbox
                label={`Confirmo que el pago de ${formatMoney(summary.totalToPay)} ha sido recibido`}
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
                  Rehabilitar Socio
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
