/**
 * Clase abstracta base para Entidades.
 * Las entidades se identifican por su ID, no por sus atributos.
 * Dos entidades son iguales si tienen el mismo ID.
 */
export abstract class Entity<TId> {
  protected readonly _id: TId;

  constructor(id: TId) {
    this._id = id;
  }

  /** Devuelve el identificador de la entidad. */
  get id(): TId {
    return this._id;
  }

  /**
   * Compara igualdad por identidad.
   * Dos entidades son iguales si comparten el mismo ID.
   */
  equals(other?: Entity<TId>): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof Entity)) {
      return false;
    }

    // Delegar en el método equals del ID si existe
    if (this._id !== null && typeof this._id === 'object' && 'equals' in this._id) {
      return (this._id as { equals(other: TId): boolean }).equals(other._id);
    }

    return this._id === other._id;
  }
}
