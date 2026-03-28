> **Categoría:** 2. Seguridad

### 2.2 RNFT-002: Gestión de Sesiones JWT

**RNF Base:** RNF-002 (Gestión de Sesiones)

**Implementación:**

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar sesión activa en DB
    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) throw new UnauthorizedException();
    return { userId: payload.sub, tenantId: payload.tenantId };
  }
}
```

**Configuración de expiración:**

| Parámetro     | Valor    | Variable de entorno        |
| ------------- | -------- | -------------------------- |
| Inactividad   | 30 min   | `SESSION_IDLE_TIMEOUT`     |
| Absoluta      | 24 horas | `SESSION_ABSOLUTE_TIMEOUT` |
| Refresh token | 7 días   | `REFRESH_TOKEN_EXPIRES`    |

**Refresh Token en Cookie HttpOnly:**

```typescript
// auth.controller.ts
@Post('refresh')
async refresh(@Req() req: Request, @Res() res: Response) {
  const refreshToken = req.cookies['refresh_token'];
  const tokens = await this.authService.refreshTokens(refreshToken);

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  return res.json({ accessToken: tokens.accessToken });
}
```
