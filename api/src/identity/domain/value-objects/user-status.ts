import { ValueObject } from '../../../shared/domain';

type UserStatusProps = {
  value: string;
  [key: string]: unknown;
};

const VALID_STATUSES = ['ACTIVE', 'BLOCKED', 'INACTIVE'] as const;

/** Value Object que representa el estado de un usuario. */
export class UserStatus extends ValueObject<UserStatusProps> {
  get value(): string {
    return this.props.value;
  }

  static active(): UserStatus {
    return new UserStatus({ value: 'ACTIVE' });
  }

  static blocked(): UserStatus {
    return new UserStatus({ value: 'BLOCKED' });
  }

  static inactive(): UserStatus {
    return new UserStatus({ value: 'INACTIVE' });
  }

  /** Crea un UserStatus a partir de un string. Lanza error si el valor no es válido. */
  static fromString(value: string): UserStatus {
    if (!VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number])) {
      throw new Error(
        `Estado de usuario inválido: "${value}". Valores permitidos: ${VALID_STATUSES.join(', ')}.`,
      );
    }
    return new UserStatus({ value });
  }
}
