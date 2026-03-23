import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadata para marcar endpoints como publicos.
 * Utilizada por JwtAuthGuard para saltar la validacion JWT.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador que marca un endpoint como publico (sin autenticacion).
 * Cuando se aplica, JwtAuthGuard permite el acceso sin token JWT.
 *
 * @example
 * @Public()
 * @Post('login')
 * login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
