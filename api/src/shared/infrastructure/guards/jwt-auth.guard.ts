import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT.
 * Extiende AuthGuard('jwt') de @nestjs/passport para validar tokens JWT.
 * Se aplica a rutas protegidas que requieren autenticación (ADR-006).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
