import { AggregateRoot } from './aggregate-root.base';

/**
 * Interfaz genérica de repositorio para Aggregate Roots.
 * Define el contrato mínimo que todo repositorio debe implementar.
 */
export interface Repository<T extends AggregateRoot<unknown>> {
  /** Persiste un agregado (creación o actualización). */
  save(aggregate: T): Promise<void>;

  /** Busca un agregado por su identificador. Devuelve null si no existe. */
  findById(id: string): Promise<T | null>;

  /** Elimina un agregado por su identificador. */
  delete(id: string): Promise<void>;
}
