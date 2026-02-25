// Adaptador de observabilidad para desarrollo — usa console
import type { ErrorReporter } from './error-reporter.port';

export class ConsoleErrorReporter implements ErrorReporter {
  captureException(error: Error, context?: Record<string, unknown>): void {
    console.error('[ErrorReporter]', { error: error.message, stack: error.stack, context });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    const fn =
      level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    fn('[ErrorReporter]', { message, level, context });
  }

  setUser(userId: string, email: string, tenantId?: string): void {
    console.info('[ErrorReporter] setUser', { userId, email, tenantId });
  }

  setContext(key: string, data: Record<string, unknown>): void {
    console.info('[ErrorReporter] setContext', { key, data });
  }
}
