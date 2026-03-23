import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/** Envelope estándar para respuestas exitosas (ADR-010). */
interface ResponseEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Interceptor que envuelve las respuestas exitosas en un envelope estándar.
 * Formato: { data: ..., meta: { timestamp, path } }
 * No afecta a las respuestas de error (gestionadas por el filtro de excepciones).
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      })),
    );
  }
}
