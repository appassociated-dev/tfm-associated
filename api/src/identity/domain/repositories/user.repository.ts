import { User } from '../aggregates/user';

/**
 * Interfaz del repositorio de User.
 * Define las operaciones de persistencia para el aggregate User.
 * La implementación concreta reside en la capa de infraestructura.
 */

/** Token de inyección para el repositorio de User (NestJS DI). */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  /** Busca un usuario por su dirección de email. */
  findByEmail(email: string): Promise<User | null>;

  /** Busca un usuario por su identificador único. */
  findById(id: string): Promise<User | null>;

  /** Persiste un usuario (creación o actualización). */
  save(user: User): Promise<void>;
}
