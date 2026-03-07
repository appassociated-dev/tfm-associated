/**
 * Clase abstracta base para Value Objects.
 * Los Value Objects se comparan por el valor de sus propiedades, no por identidad.
 * Las propiedades son inmutables (congeladas en el constructor).
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
  protected readonly props: Readonly<TProps>;

  constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  /**
   * Compara igualdad por valor profundo con otro ValueObject.
   * Dos ValueObjects son iguales si tienen las mismas propiedades con los mismos valores.
   */
  equals(other?: ValueObject<TProps>): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof ValueObject)) {
      return false;
    }

    return this.deepEquals(this.props, other.props);
  }

  /** Comparación profunda recursiva de dos objetos. */
  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
      return false;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a !== 'object') {
      return false;
    }

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every((key) =>
      this.deepEquals(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }
}
