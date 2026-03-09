import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ERROR_REPORTER } from '../../domain/ports/error-reporter.port';
import { EVENT_TRACKER } from '../../domain/ports/event-tracker.port';
import { ConsoleErrorReporter } from './console-error-reporter';
import { ConsoleEventTracker } from './console-event-tracker';
import { SentryErrorReporter } from './sentry-error-reporter';
import { SentryEventTracker } from './sentry-event-tracker';

/**
 * Módulo dinámico de observabilidad.
 * Si SENTRY_DSN está definido, registra adaptadores de Sentry.
 * Si no, registra adaptadores de consola para desarrollo.
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

    return {
      module: ObservabilityModule,
      providers,
      exports: [ERROR_REPORTER, EVENT_TRACKER],
      global: true,
    };
  }
}
