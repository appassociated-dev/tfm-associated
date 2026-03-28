> **Categoría:** 2. Seguridad

### 2.1 RNFT-001: Autenticación con JWT y Passport

**RNF Base:** RNF-001 (Autenticación de Usuarios)

**Implementación NestJS:**

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m', // Access token corto
          algorithm: 'HS256',
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})
export class AuthModule {}
```

**Configuración de tokens:**

| Token         | Duración   | Almacenamiento    | Renovación             |
| ------------- | ---------- | ----------------- | ---------------------- |
| Access Token  | 15 minutos | Memory (frontend) | Automática con refresh |
| Refresh Token | 7 días     | HttpOnly Cookie   | En login               |

**Política de contraseñas (class-validator):**

```typescript
// password.dto.ts
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
  message: 'Password must have 8+ chars, uppercase, lowercase, number'
})
password: string;
```

**Bloqueo de cuenta:**

```typescript
// Configuración
MAX_FAILED_ATTEMPTS = 5;
LOCKOUT_DURATION_MINUTES = 15;
```

**Verificación:**

- Test E2E: Login con credenciales válidas/inválidas
- Test: Bloqueo tras 5 intentos fallidos
- Auditoría: Revisar tokens generados tienen claims correctos
