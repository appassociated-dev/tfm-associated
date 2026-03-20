import { useMemo } from 'react';
import { Badge, Group, Stack, Text, Timeline } from '@mantine/core';

import { formatDateLong } from '@/shared/utils/format-date';

import type { StatusHistoryEntry } from '../schemas/member-leave.schemas';
import { StatusBadge, STATUS_CONFIG } from './status-badge';

// === Tipos ===

interface StatusTimelineProps {
  entries: StatusHistoryEntry[];
}

// === Componente ===

/**
 * Timeline visual del historial de estados de un socio.
 * Muestra cada transicion con fecha, badges de estado anterior y nuevo,
 * motivo del cambio y quien lo ejecuto.
 * Las entradas se ordenan cronologicamente con la mas reciente primero.
 */
export function StatusTimeline({ entries }: StatusTimelineProps) {
  // Ordenar entradas por fecha descendente (mas reciente primero)
  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ),
    [entries],
  );

  if (sortedEntries.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No hay historial de estados disponible.
      </Text>
    );
  }

  return (
    <Timeline active={0} bulletSize={24} lineWidth={2}>
      {sortedEntries.map((entry) => {
        const newStatusConfig = STATUS_CONFIG[entry.newStatus];
        const bulletColor = newStatusConfig?.color ?? 'gray';

        return (
          <Timeline.Item key={entry.id} color={bulletColor}>
            <Stack gap="xs">
              {/* Fecha del cambio */}
              <Text size="xs" c="dimmed">
                {formatDateLong(new Date(entry.changedAt))}
              </Text>

              {/* Transicion de estado */}
              <Group gap="xs" align="center">
                <StatusBadge status={entry.previousStatus} />
                <Text size="sm" c="dimmed">
                  →
                </Text>
                <StatusBadge status={entry.newStatus} />
              </Group>

              {/* Motivo del cambio */}
              {entry.reason && <Text size="sm">{entry.reason}</Text>}

              {/* Ejecutor del cambio */}
              <Group gap="xs" align="center">
                <Text size="xs" c="dimmed">
                  Ejecutado por:
                </Text>
                {entry.changedBy === 'Sistema' ? (
                  <Badge color="gray" variant="light" radius="sm" size="sm">
                    Sistema
                  </Badge>
                ) : (
                  <Badge color="brand" variant="light" radius="sm" size="sm">
                    Manual
                  </Badge>
                )}
                <Text size="xs" c="dimmed">
                  {entry.changedBy}
                </Text>
              </Group>
            </Stack>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
}
