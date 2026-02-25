// React Error Boundary global — captura errores no manejados y reporta via ErrorReporter
import { Component, type ReactNode } from 'react';
import { ConsoleErrorReporter } from './console-error-reporter';
import { SentryErrorReporter } from './sentry-error-reporter';
import type { ErrorReporter } from './error-reporter.port';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Seleccionar adaptador según entorno
const errorReporter: ErrorReporter = import.meta.env.VITE_SENTRY_DSN
  ? new SentryErrorReporter(import.meta.env.VITE_SENTRY_DSN)
  : new ConsoleErrorReporter();

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    errorReporter.captureException(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Algo ha ido mal</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Recargar la página</button>
        </div>
      );
    }
    return this.props.children;
  }
}
