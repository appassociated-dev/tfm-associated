// Clase base para excepciones de dominio
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Restaurar el prototype para instanceof funcione correctamente con herencia en TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
