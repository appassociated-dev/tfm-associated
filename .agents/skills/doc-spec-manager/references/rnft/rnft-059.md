> **Categoría:** 6. Mantenibilidad y Operaciones

### 6.3 RNFT-059: Tests de Integración con Testcontainers

**RNF Base:** RNF-059 (Tests de Integración)

**Setup con Testcontainers:**

```typescript
// tests/setup/database.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .start();
  
  process.env.DATABASE_URL = container.getConnectionUri();
  
  // Ejecutar migraciones
  execSync('npx prisma migrate deploy', { 
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() }
  });
}, 60000);

afterAll(async () => {
  await container.stop();
});
```

**Test de repositorio:**

```typescript
// member.repository.integration.spec.ts
describe('MemberRepository (Integration)', () => {
  let repository: MemberRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new MemberRepository(prisma);
  });

  it('should create and retrieve a member', async () => {
    const member = await repository.create({
      name: 'Juan',
      surnames: 'García',
      email: 'juan@test.com',
    });

    const found = await repository.findById(member.id);
    expect(found.name).toBe('Juan');
  });
});
```

**Tiempo máximo:** < 10 minutos para suite completa.
