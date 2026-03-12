/**
 * Value Object transitorio que representa una contraseña en texto plano.
 * No se persiste — solo se usa para validar y luego generar un hash.
 *
 * Política de validación:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula
 * - Al menos 1 letra minúscula
 * - Al menos 1 dígito
 */
export class Password {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /** Devuelve el valor en texto plano (para pasar al hasher). */
  getValue(): string {
    return this._value;
  }

  /** Crea un Password validado. Lanza error si no cumple la política. */
  static create(value: string): Password {
    if (!value || value.length < 8) {
      throw new Error('Contraseña inválida: debe tener al menos 8 caracteres.');
    }

    if (!/[A-Z]/.test(value)) {
      throw new Error('Contraseña inválida: debe contener al menos una letra mayúscula.');
    }

    if (!/[a-z]/.test(value)) {
      throw new Error('Contraseña inválida: debe contener al menos una letra minúscula.');
    }

    if (!/\d/.test(value)) {
      throw new Error('Contraseña inválida: debe contener al menos un dígito.');
    }

    return new Password(value);
  }
}
