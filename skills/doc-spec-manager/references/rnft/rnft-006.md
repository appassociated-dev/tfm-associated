> **Categoría:** 2. Seguridad

### 2.6 RNFT-006: Cifrado con Argon2 y Prisma

**RNF Base:** RNF-006 (Cifrado de Datos Sensibles en Reposo)

**Hash de contraseñas:**

```typescript
// auth.service.ts
import * as argon2 from 'argon2';

async hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

async validatePassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
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

| Campo      | Método                  | Propósito          |
| ---------- | ----------------------- | ------------------ |
| Contraseña | Argon2 (default params) | Hash irreversible  |
| IBAN       | AES-256-GCM             | Cifrado reversible |
| DNI        | AES-256-GCM             | Cifrado reversible |
