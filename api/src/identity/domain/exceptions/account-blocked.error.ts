/**
 * Error de dominio lanzado cuando la cuenta del usuario está bloqueada
 * por exceder el número máximo de intentos fallidos de autenticación.
 */
export class AccountBlockedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'AUTH.ACCOUNT_BLOCKED';

  /** Minutos restantes de bloqueo. */
  readonly minutesRemaining: number;

  constructor(minutesRemaining: number) {
    super(`Cuenta bloqueada. Intente de nuevo en ${minutesRemaining} minuto(s).`);
    this.name = 'AccountBlockedError';
    this.minutesRemaining = minutesRemaining;
  }
}
