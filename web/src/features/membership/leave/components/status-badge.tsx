import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';

// === Configuracion de estados ===

/** Mapeo de estados del socio a configuracion visual del badge. */
export const STATUS_CONFIG: Record<string, { color: string; labelKey: string; variant: string }> = {
  ACTIVE: { color: 'green', labelKey: 'membership:status.active', variant: 'light' },
  APPLICANT: { color: 'blue', labelKey: 'membership:status.applicant', variant: 'light' },
  PENDING_PAYMENT: {
    color: 'yellow',
    labelKey: 'membership:status.pendingPayment',
    variant: 'light',
  },
  SUSPENDED: { color: 'red', labelKey: 'membership:status.suspended', variant: 'light' },
  VOLUNTARY_LEAVE: {
    color: 'gray',
    labelKey: 'membership:status.voluntaryLeave',
    variant: 'light',
  },
  NONPAYMENT_LEAVE: {
    color: 'red',
    labelKey: 'membership:status.nonpaymentLeave',
    variant: 'filled',
  },
  DISCIPLINARY_LEAVE: {
    color: 'dark',
    labelKey: 'membership:status.disciplinaryLeave',
    variant: 'light',
  },
  DECEASED: { color: 'dark', labelKey: 'membership:status.deceased', variant: 'filled' },
};

/** Configuracion por defecto para estados desconocidos. */
const DEFAULT_CONFIG = { color: 'gray', labelKey: 'membership:status.unknown', variant: 'light' };

// === Tipos ===

interface StatusBadgeProps {
  status: string;
}

// === Componente ===

/**
 * Badge visual para mostrar el estado de un socio.
 * Cada estado tiene un color, variant y clave i18n definidos en STATUS_CONFIG.
 * Estados desconocidos se muestran como "Desconocido" en gris.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

  return (
    <Badge color={config.color} variant={config.variant} radius="sm">
      {t(config.labelKey as never)}
    </Badge>
  );
}
