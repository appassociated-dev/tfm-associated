import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ErrorReporter } from './error-reporter.port';
import { ConsoleErrorReporter } from './console-error-reporter';

interface ErrorBoundaryProps {
  /** Contenido hijo a renderizar. */
  children: ReactNode;
  /** Componente de fallback personalizado. Si no se provee, se usa el por defecto. */
  fallback?: ReactNode;
  /** Reporter de errores. Por defecto usa ConsoleErrorReporter. */
  errorReporter?: ErrorReporter;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Reporter por defecto para desarrollo. */
const defaultReporter = new ConsoleErrorReporter();

/**
 * Componente ErrorBoundary para capturar errores no manejados en el árbol React.
 * Reporta errores al ErrorReporter y muestra una UI de fallback con opción de recarga.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const reporter = this.props.errorReporter ?? defaultReporter;

    reporter.captureException(error, {
      componentStack: errorInfo.componentStack ?? 'unknown',
    });
  }

  /** Reinicia el estado de error y recarga la página. */
  private handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'sans-serif',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Ha ocurrido un error inesperado
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Lo sentimos, algo ha salido mal. Por favor, intenta recargar la
            página.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                maxWidth: '600px',
                overflow: 'auto',
                marginBottom: '1.5rem',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
