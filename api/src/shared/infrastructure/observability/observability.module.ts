import { Module, DynamicModule, Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ERROR_REPORTER } from '../../domain/ports/error-reporter.port';
import { EVENT_TRACKER } from '../../domain/ports/event-tracker.port';
import { DomainExceptionFilter } from '../filters/domain-exception.filter';
import { ConsoleErrorReporter } from './console-error-reporter';
import { ConsoleEventTracker } from './console-event-tracker';
import { SentryErrorReporter } from './sentry-error-reporter';
import { SentryEventTracker } from './sentry-event-tracker';

/**
 * Módulo dinámico de observabilidad.
 * Si SENTRY_DSN está definido, registra adaptadores de Sentry.
 * Si no, registra adaptadores de consola para desarrollo.
 *
 * Registra DomainExceptionFilter como APP_FILTER global para que
 * las excepciones de dominio se mapeen a los HTTP status codes
 * correctos (401, 404, 409, 422, etc.) en lugar de 500.
 */
@Module({})
export class ObservabilityModule {
  static register(): DynamicModule {
    const useSentry = !!process.env.SENTRY_DSN;

    const providers: Provider[] = useSentry
      ? [
          { provide: ERROR_REPORTER, useClass: SentryErrorReporter },
          { provide: EVENT_TRACKER, useClass: SentryEventTracker },
        ]
      : [
          { provide: ERROR_REPORTER, useClass: ConsoleErrorReporter },
          { provide: EVENT_TRACKER, useClass: ConsoleEventTracker },
        ];

    // Registrar DomainExceptionFilter como filtro global de excepciones.
    // Usa DI para inyectar ERROR_REPORTER, por lo que debe registrarse
    // como provider (no con useGlobalFilters() en main.ts).
    providers.push({
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    });

    return {
      module: ObservabilityModule,
      providers,
      exports: [ERROR_REPORTER, EVENT_TRACKER],
      global: true,
    };
  }
}
