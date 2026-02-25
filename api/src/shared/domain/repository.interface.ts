import { type AggregateRoot } from './aggregate-root.base';

// Interfaz genérica para repositorios de agregados — define el contrato de persistencia
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IRepository<T extends AggregateRoot<any>> {
  // Persiste o actualiza un agregado en el almacén de datos
  save(aggregate: T): Promise<void>;

  // Recupera un agregado por su identificador — retorna null si no existe
  findById(id: string): Promise<T | null>;

  // Elimina un agregado del almacén de datos
  delete(id: string): Promise<void>;
}
