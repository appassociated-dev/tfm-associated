import { describe, it, expect } from 'vitest';
import { AuthController } from '../auth.controller';

/**
 * Tests unitarios para verificar que los decoradores @Throttle
 * están correctamente aplicados en AuthController.
 *
 * Estrategia: usar Reflect.getMetadata con las keys exactas que
 * @nestjs/throttler guarda internamente (formato: 'THROTTLER:<TYPE><name>').
 * Ref: node_modules/@nestjs/throttler/dist/throttler.decorator.js
 *
 * REQ-RL-002: Rate limiting estricto en endpoints de autenticación
 */

// Constantes de metadata de @nestjs/throttler (throttler.constants.js)
const THROTTLER_TTL = 'THROTTLER:TTL';
const THROTTLER_LIMIT = 'THROTTLER:LIMIT';
const THROTTLER_BLOCK_DURATION = 'THROTTLER:BLOCK_DURATION';
const THROTTLER_SKIP = 'THROTTLER:SKIP';

describe('AuthController — decoradores @Throttle', () => {
  // =============================================
  // POST /api/v1/auth/login — throttler 'login'
  // =============================================

  describe('método login()', () => {
    it('debería tener @Throttle con ttl:600_000 para throttler login (REQ-RL-002)', () => {
      const ttl = Reflect.getMetadata(`${THROTTLER_TTL}login`, AuthController.prototype.login);
      expect(ttl).toBe(600_000);
    });

    it('debería tener @Throttle con limit:5 para throttler login (REQ-RL-002)', () => {
      const limit = Reflect.getMetadata(`${THROTTLER_LIMIT}login`, AuthController.prototype.login);
      expect(limit).toBe(5);
    });

    it('debería tener @Throttle con blockDuration:900_000 para throttler login (REQ-RL-002)', () => {
      const blockDuration = Reflect.getMetadata(
        `${THROTTLER_BLOCK_DURATION}login`,
        AuthController.prototype.login,
      );
      expect(blockDuration).toBe(900_000);
    });

    it('no debería tener @SkipThrottle en el método login', () => {
      const skipDefault = Reflect.getMetadata(
        `${THROTTLER_SKIP}default`,
        AuthController.prototype.login,
      );
      const skipLogin = Reflect.getMetadata(
        `${THROTTLER_SKIP}login`,
        AuthController.prototype.login,
      );
      // login NO debe saltar el throttler — debe ser evaluado
      expect(skipDefault).toBeUndefined();
      expect(skipLogin).toBeUndefined();
    });
  });

  // =============================================
  // POST /api/v1/auth/refresh — throttler 'login' (permisivo)
  // =============================================

  describe('método refresh()', () => {
    it('debería tener @Throttle con ttl:600_000 para throttler login (REQ-RL-002)', () => {
      const ttl = Reflect.getMetadata(`${THROTTLER_TTL}login`, AuthController.prototype.refresh);
      expect(ttl).toBe(600_000);
    });

    it('debería tener @Throttle con limit:10 para throttler login (REQ-RL-002)', () => {
      const limit = Reflect.getMetadata(
        `${THROTTLER_LIMIT}login`,
        AuthController.prototype.refresh,
      );
      expect(limit).toBe(10);
    });

    it('no debería tener blockDuration en refresh (más permisivo que login)', () => {
      const blockDuration = Reflect.getMetadata(
        `${THROTTLER_BLOCK_DURATION}login`,
        AuthController.prototype.refresh,
      );
      // refresh no define blockDuration → undefined (hereda del throttler global)
      expect(blockDuration).toBeUndefined();
    });
  });

  // =============================================
  // Verificación de que los demás métodos NO tienen @Throttle específico
  // =============================================

  describe('métodos logout(), switchTenant() y me() — sin @Throttle específico', () => {
    it('logout no debería tener @Throttle de throttler login', () => {
      const limit = Reflect.getMetadata(`${THROTTLER_LIMIT}login`, AuthController.prototype.logout);
      // logout hereda el throttler 'default' global (100/min), sin override
      expect(limit).toBeUndefined();
    });

    it('me() no debería tener @Throttle de throttler login', () => {
      const limit = Reflect.getMetadata(`${THROTTLER_LIMIT}login`, AuthController.prototype.me);
      expect(limit).toBeUndefined();
    });
  });

  // =============================================
  // Verificación de que AuthController NO tiene @SkipThrottle a nivel de clase
  // =============================================

  describe('clase AuthController — sin @SkipThrottle', () => {
    it('no debería tener @SkipThrottle a nivel de clase', () => {
      // AuthController NO debe saltar el throttler global 'default'
      const skipDefault = Reflect.getMetadata(`${THROTTLER_SKIP}default`, AuthController);
      expect(skipDefault).toBeUndefined();
    });
  });
});
