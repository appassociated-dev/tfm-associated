/**
 * Puerto de salida para hashing de contraseñas.
 * Abstrae el algoritmo de hashing (argon2, bcrypt, etc.).
 * La implementación concreta reside en la capa de infraestructura.
 */

/** Token de inyección para el puerto PasswordHasher (NestJS DI). */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  /** Genera un hash seguro a partir de una contraseña en texto plano. */
  hash(password: string): Promise<string>;

  /** Verifica que una contraseña coincide con un hash almacenado. */
  verify(password: string, hash: string): Promise<boolean>;
}
