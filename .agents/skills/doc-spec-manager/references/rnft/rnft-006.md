> **Categoría:** 2. Seguridad

### 2.6 RNFT-006: Cifrado con bcrypt y Prisma

**RNF Base:** RNF-006 (Cifrado de Datos Sensibles en Reposo)

**Hash de contraseñas:**

```typescript
// auth.service.ts
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Cifrado de IBAN en base de datos:**

```typescript
// prisma/schema.prisma - campo cifrado a nivel aplicación
model MemberAccount {
  id            String   @id @default(uuid())
  ibanEncrypted String   // Cifrado con AES-256
  ibanHash      String   // Para búsquedas (SHA-256 truncado)
}

// member-account.service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}
```

**Datos cifrados:**

| Campo | Método | Propósito |
|-------|--------|-----------|
| Contraseña | bcrypt (12 rounds) | Hash irreversible |
| IBAN | AES-256-GCM | Cifrado reversible |
| DNI | AES-256-GCM | Cifrado reversible |
