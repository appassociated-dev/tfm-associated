import { Badge } from '@mantine/core';

// === Configuracion de estados ===

/** Mapeo de estados del socio a configuracion visual del badge. */
export const STATUS_CONFIG: Record<string, { color: string; label: string; variant: string }> = {
  ACTIVE: { color: 'green', label: 'Activo', variant: 'light' },
  APPLICANT: { color: 'blue', label: 'Aspirante', variant: 'light' },
  PENDING_PAYMENT: { color: 'yellow', label: 'Pendiente de Pago', variant: 'light' },
  SUSPENDED: { color: 'red', label: 'Suspendido', variant: 'light' },
  VOLUNTARY_LEAVE: { color: 'gray', label: 'Baja Voluntaria', variant: 'light' },
  NONPAYMENT_LEAVE: { color: 'red', label: 'Baja por Impago', variant: 'filled' },
  DISCIPLINARY_LEAVE: { color: 'dark', label: 'Baja Disciplinaria', variant: 'light' },
  DECEASED: { color: 'dark', label: 'Fallecido', variant: 'filled' },
};

/** Configuracion por defecto para estados desconocidos. */
const DEFAULT_CONFIG = { color: 'gray', label: 'Desconocido', variant: 'light' };

// === Tipos ===

interface StatusBadgeProps {
  status: string;
}

// === Componente ===

/**
 * Badge visual para mostrar el estado de un socio.
 * Cada estado tiene un color, variant y etiqueta definidos en STATUS_CONFIG.
 * Estados desconocidos se muestran como "Desconocido" en gris.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

  return (
    <Badge color={config.color} variant={config.variant} radius="sm">
      {config.label}
    </Badge>
  );
}
