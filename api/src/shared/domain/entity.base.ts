// Clase base para todas las entidades del dominio — proporciona identidad e igualdad estructural
export abstract class Entity<TId> {
  // Propiedades protegidas de la entidad — accesibles por subclases
  protected readonly props: Record<string, unknown>;

  // Identificador único de la entidad
  private readonly _id: TId;

  protected constructor(id: TId, props: Record<string, unknown>) {
    this._id = id;
    this.props = props;
  }

  // Retorna el identificador de la entidad
  get id(): TId {
    return this._id;
  }

  // Igualdad de entidades basada en identidad (mismo ID)
  equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this._id === other._id;
  }
}
