// Adaptador de observabilidad para desarrollo y tests — usa console
import { Injectable } from '@nestjs/common';
import { type ErrorReporter } from '../../domain/ports/error-reporter.port';

@Injectable()
export class ConsoleErrorReporter implements ErrorReporter {
  // Captura una excepción y la imprime como JSON estructurado en stderr
  captureException(error: Error, context?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'exception',
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  // Captura un mensaje con nivel de severidad y lo imprime como JSON estructurado
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    const logFn = level === 'error' ? console.error : console.warn;
    logFn(
      JSON.stringify({
        level,
        type: 'message',
        message,
        context,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  // Establece el contexto del usuario — almacenado en memoria para esta implementación
  setUser(userId: string, email: string, tenantId?: string): void {
    console.warn(
      JSON.stringify({
        level: 'info',
        type: 'set_user',
        userId,
        email,
        tenantId,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  // Establece datos de contexto adicionales — registrado como log informativo
  setContext(key: string, data: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({
        level: 'info',
        type: 'set_context',
        key,
        data,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
