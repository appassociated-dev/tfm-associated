import { v4 as uuidV4, validate as uuidValidate } from 'uuid';

/**
 * Wrapper inmutable para identificadores UUID.
 * Genera un UUID v4 si no se proporciona uno.
 */
export class Identifier {
  private readonly _value: string;

  constructor(value?: string) {
    if (value !== undefined) {
      if (!uuidValidate(value)) {
        throw new Error(`Identificador inválido: "${value}" no es un UUID válido.`);
      }
      this._value = value;
    } else {
      this._value = uuidV4();
    }
  }

  /** Compara igualdad por valor con otro Identifier. */
  equals(other?: Identifier): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /** Devuelve la representación en cadena del UUID. */
  toString(): string {
    return this._value;
  }

  /** Devuelve el valor primitivo del UUID. */
  toValue(): string {
    return this._value;
  }
}
