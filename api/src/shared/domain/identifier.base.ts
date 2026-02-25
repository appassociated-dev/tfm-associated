// Clase base abstracta para identificadores de dominio — wrapper de UUID con validación y tipado fuerte
export abstract class Identifier {
  // Valor interno del identificador — siempre un UUID válido
  private readonly _value: string;

  protected constructor(value: string) {
    Identifier.validate(value);
    this._value = value;
  }

  // Retorna el valor string del identificador
  getValue(): string {
    return this._value;
  }

  // Igualdad de identificadores basada en comparación de valor
  equals(other: Identifier): boolean {
    if (!(other instanceof Identifier)) {
      return false;
    }
    return this._value === other._value;
  }

  // Representación string del identificador — el UUID directamente
  toString(): string {
    return this._value;
  }

  // Valida que el valor sea un UUID v4 válido — lanza error si no lo es
  static validate(value: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(`Identificador inválido: "${value}" no es un UUID v4 válido`);
    }
  }

  // Genera un nuevo UUID v4 usando crypto nativo
  static generate(): string {
    return crypto.randomUUID();
  }
}
