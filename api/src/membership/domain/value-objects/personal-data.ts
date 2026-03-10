import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type PersonalDataProps = {
  name: string;
  surnames: string;
  birthDate: Date;
  [key: string]: unknown;
};

/** Propiedades de entrada para crear PersonalData. */
export interface CreatePersonalDataProps {
  name: string;
  surnames: string;
  birthDate: Date;
}

/**
 * Error lanzado cuando los datos personales son inválidos.
 */
export class PersonalDataInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_PERSONAL_DATA';

  constructor(reason: string) {
    super(`Datos personales inválidos: ${reason}`);
    this.name = 'PersonalDataInvalidError';
  }
}

/**
 * Value Object que representa los datos personales de un socio.
 * Invariantes: nombre y apellidos no vacíos, birthDate <= hoy.
 */
export class PersonalData extends ValueObject<PersonalDataProps> {
  get name(): string {
    return this.props.name;
  }

  get surnames(): string {
    return this.props.surnames;
  }

  get birthDate(): Date {
    return this.props.birthDate;
  }

  /**
   * Crea un PersonalData validado.
   */
  static create(props: CreatePersonalDataProps): Result<PersonalData, PersonalDataInvalidError> {
    const name = (props.name ?? '').trim();
    const surnames = (props.surnames ?? '').trim();

    if (!name) {
      return {
        ok: false,
        error: new PersonalDataInvalidError('El nombre no puede estar vacío.'),
      };
    }

    if (!surnames) {
      return {
        ok: false,
        error: new PersonalDataInvalidError('Los apellidos no pueden estar vacíos.'),
      };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (props.birthDate > today) {
      return {
        ok: false,
        error: new PersonalDataInvalidError('La fecha de nacimiento no puede ser futura.'),
      };
    }

    return {
      ok: true,
      value: new PersonalData({
        name,
        surnames,
        birthDate: props.birthDate,
      }),
    };
  }

  /**
   * Calcula la edad actual del socio en años.
   */
  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.props.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.props.birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.props.birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
