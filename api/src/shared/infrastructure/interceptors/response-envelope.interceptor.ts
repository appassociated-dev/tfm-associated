// Interceptor de envelope de respuesta — formato estándar ADR-010
import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Estructura del envelope de respuesta según ADR-010
interface ResponseEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T> | T> {
    return next.handle().pipe(
      map((response) => {
        // No envuelve si la respuesta es nula o indefinida
        if (response === null || response === undefined) {
          return response;
        }

        // No envuelve si la respuesta ya tiene el formato de envelope (tiene clave 'data')
        if (typeof response === 'object' && 'data' in response) {
          return response;
        }

        return {
          data: response,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
