> **Categoría:** 3. Rendimiento

### 3.5 RNFT-019: Búsquedas con PostgreSQL

**RNF Base:** RNF-019 (Rendimiento de Búsquedas)

**Índices PostgreSQL:**

```prisma
model Member {
  id        String @id @default(uuid())
  name      String
  surnames  String
  dni       String @unique
  email     String
  status    MemberStatus
  tenantId  String

  @@index([tenantId, status])
  @@index([tenantId, name, surnames])
  @@index([dni])
}
```

**Búsqueda fuzzy con pg_trgm:**

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para búsqueda fuzzy
CREATE INDEX idx_member_name_trgm ON "Member"
  USING gin (name gin_trgm_ops);
```

```typescript
// member.repository.ts
async searchByName(tenantId: string, query: string): Promise<Member[]> {
  return this.prisma.$queryRaw`
    SELECT * FROM "Member"
    WHERE "tenantId" = ${tenantId}
    AND similarity(name || ' ' || surnames, ${query}) > 0.3
    ORDER BY similarity(name || ' ' || surnames, ${query}) DESC
    LIMIT 20
  `;
}
```

**Métricas:**

| Búsqueda           | Tiempo objetivo |
| ------------------ | --------------- |
| Por DNI (exacta)   | < 50ms          |
| Por nombre (fuzzy) | < 300ms         |
| Listado paginado   | < 200ms         |
| Filtros combinados | < 500ms         |
