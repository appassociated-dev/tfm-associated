import { Button, Loader, Stack, Text } from '@mantine/core';
import { IconUserMinus, IconUserPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

import { usePermissions } from '@/features/auth/context/use-permissions';

import { useAvailableTransitions } from '../hooks/use-available-transitions';

// === Tipos ===

interface LeaveActionsProps {
  memberId: string;
}

/** Estados terminales que no permiten rehabilitacion. */
const PERMANENT_LEAVE_STATUSES = ['DISCIPLINARY_LEAVE', 'DECEASED'];

/** Estados terminales que permiten rehabilitacion. */
const REHABILITABLE_STATUSES = ['VOLUNTARY_LEAVE', 'NONPAYMENT_LEAVE'];

// === Componente ===

/**
 * Acciones contextuales de baja/rehabilitacion para la ficha del socio.
 * Consulta las transiciones disponibles y los permisos del usuario
 * para mostrar los botones correspondientes.
 */
export function LeaveActions({ memberId }: LeaveActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useAvailableTransitions(memberId);

  // Estado de carga mientras se obtienen las transiciones
  if (isLoading) {
    return <Loader size="sm" />;
  }

  const currentStatus = data?.currentStatus ?? '';
  const transitions = data?.availableTransitions ?? [];

  // Verificar si la transicion a VOLUNTARY_LEAVE esta disponible
  const canVoluntaryLeave = transitions.some((t) => t.status === 'VOLUNTARY_LEAVE');

  // Verificar si el socio esta en estado terminal rehabilitable
  const isRehabilitableStatus = REHABILITABLE_STATUSES.includes(currentStatus);

  // Verificar si el socio esta en estado terminal permanente
  const isPermanentLeaveStatus = PERMANENT_LEAVE_STATUSES.includes(currentStatus);

  return (
    <Stack gap="sm">
      {/* Boton de baja voluntaria */}
      {canVoluntaryLeave && hasPermission('membership:members:deactivate') && (
        <Button
          color="red"
          variant="outline"
          leftSection={<IconUserMinus size={18} stroke={1.5} />}
          onClick={() => navigate(`/members/${memberId}/leave`)}
        >
          Procesar Baja Voluntaria
        </Button>
      )}

      {/* Boton de rehabilitacion */}
      {isRehabilitableStatus && hasPermission('membership:members:reinstate') && (
        <Button
          color="green"
          leftSection={<IconUserPlus size={18} stroke={1.5} />}
          onClick={() => navigate(`/members/${memberId}/reinstate`)}
        >
          Rehabilitar Socio
        </Button>
      )}

      {/* Mensaje de baja permanente */}
      {isPermanentLeaveStatus && (
        <Text size="sm" c="dimmed">
          Este socio está dado de baja de forma permanente
        </Text>
      )}
    </Stack>
  );
}
