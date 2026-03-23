import { ValueObject } from '../../../shared/domain';

type EmailProps = {
  value: string;
  [key: string]: unknown;
};

/**
 * Expresión regular para validar formato de email.
 * Requiere: usuario@dominio.extensión
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Value Object que representa una dirección de correo electrónico.
 * Normaliza a minúsculas y recorta espacios.
 */
export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  /** Crea un Email validado. Lanza error si el formato es inválido. */
  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new Error('Email inválido: no puede estar vacío.');
    }

    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error(`Email inválido: "${normalized}" no tiene un formato válido.`);
    }

    return new Email({ value: normalized });
  }
}
