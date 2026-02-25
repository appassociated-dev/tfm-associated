// Módulo de observabilidad — selecciona adaptadores según entorno
import { Global, Module } from '@nestjs/common';
import { ERROR_REPORTER } from '../../domain/ports/error-reporter.port';
import { EVENT_TRACKER } from '../../domain/ports/event-tracker.port';
import { ConsoleErrorReporter } from './console-error-reporter';
import { ConsoleEventTracker } from './console-event-tracker';
import { SentryErrorReporter } from './sentry-error-reporter';
import { SentryEventTracker } from './sentry-event-tracker';

// Determina si se deben usar los adaptadores de Sentry en base a la variable de entorno
const useSentry = Boolean(process.env.SENTRY_DSN);

@Global()
@Module({
  providers: [
    {
      // Registra el adaptador de reporte de errores según el entorno
      provide: ERROR_REPORTER,
      useClass: useSentry ? SentryErrorReporter : ConsoleErrorReporter,
    },
    {
      // Registra el adaptador de tracking de eventos según el entorno
      provide: EVENT_TRACKER,
      useClass: useSentry ? SentryEventTracker : ConsoleEventTracker,
    },
  ],
  exports: [ERROR_REPORTER, EVENT_TRACKER],
})
export class ObservabilityModule {}
