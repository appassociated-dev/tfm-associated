// Clase base abstracta para Value Objects del dominio — inmutables, igualdad por valor
export abstract class ValueObject<TProps> {
  // Propiedades del Value Object — deben ser inmutables
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    // Validación automática al construir el Value Object
    this.validate(props);
    this.props = Object.freeze(props) as TProps;
  }

  // Validación de las propiedades del Value Object — lanza excepción si son inválidas
  protected abstract validate(props: TProps): void;

  // Igualdad de Value Objects basada en comparación profunda de propiedades
  equals(other: ValueObject<TProps>): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
