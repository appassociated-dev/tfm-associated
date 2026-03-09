import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';

/**
 * Implementación del puerto PasswordHasher usando Argon2.
 * Argon2id es el algoritmo recomendado por OWASP para hashing de contraseñas.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  /** Genera un hash Argon2id a partir de una contraseña en texto plano. */
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /** Verifica que una contraseña coincide con un hash Argon2. */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
