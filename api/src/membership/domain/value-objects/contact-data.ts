import { ValueObject } from '../../../shared/domain';

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type ContactDataProps = {
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  [key: string]: unknown;
};

/** Propiedades de entrada para crear ContactData. */
export interface CreateContactDataProps {
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
}

/**
 * Error lanzado cuando los datos de contacto son inválidos.
 */
export class ContactDataInvalidError extends Error {
  readonly code = 'MEMBER.INVALID_CONTACT_DATA';

  constructor(reason: string) {
    super(`Datos de contacto inválidos: ${reason}`);
    this.name = 'ContactDataInvalidError';
  }
}

/** Expresión regular básica para validación de email (RFC 5322 simplificado). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Value Object que representa los datos de contacto de un socio.
 * Invariante: email válido (formato RFC 5322, lowercase, trim).
 */
export class ContactData extends ValueObject<ContactDataProps> {
  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get address(): string | null {
    return this.props.address;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get city(): string | null {
    return this.props.city;
  }

  /**
   * Crea un ContactData validado.
   */
  static create(props: CreateContactDataProps): Result<ContactData, ContactDataInvalidError> {
    const email = (props.email ?? '').trim().toLowerCase();

    if (!email) {
      return {
        ok: false,
        error: new ContactDataInvalidError('El email no puede estar vacío.'),
      };
    }

    if (!EMAIL_REGEX.test(email)) {
      return {
        ok: false,
        error: new ContactDataInvalidError(`El formato de email no es válido: '${email}'.`),
      };
    }

    return {
      ok: true,
      value: new ContactData({
        email,
        phone: props.phone ?? null,
        address: props.address ?? null,
        postalCode: props.postalCode ?? null,
        city: props.city ?? null,
      }),
    };
  }
}
