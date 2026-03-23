import { ValueObject } from '../../../shared/domain';

type TenantStatusProps = {
  value: string;
  [key: string]: unknown;
};

const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'DEPROVISIONED'] as const;

/** Value Object que representa el estado de un tenant. */
export class TenantStatus extends ValueObject<TenantStatusProps> {
  get value(): string {
    return this.props.value;
  }

  static active(): TenantStatus {
    return new TenantStatus({ value: 'ACTIVE' });
  }

  static suspended(): TenantStatus {
    return new TenantStatus({ value: 'SUSPENDED' });
  }

  static deprovisioned(): TenantStatus {
    return new TenantStatus({ value: 'DEPROVISIONED' });
  }

  /** Crea un TenantStatus a partir de un string. Lanza error si el valor no es válido. */
  static fromString(value: string): TenantStatus {
    if (!VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])) {
      throw new Error(
        `Estado de tenant inválido: "${value}". Valores permitidos: ${VALID_STATUSES.join(', ')}.`,
      );
    }
    return new TenantStatus({ value });
  }
}
