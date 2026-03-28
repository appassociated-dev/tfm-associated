> **Categoría:** 2. Seguridad

### 2.7 RNFT-007: Auditoría con Prisma Middleware

**RNF Base:** RNF-007 (Auditoría de Acciones Críticas)

**Implementación con Prisma middleware:**

```typescript
// prisma-audit.middleware.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  const auditableModels = ['Member', 'MemberAccount', 'Transaction', 'User'];
  const auditableActions = ['create', 'update', 'delete'];

  if (auditableModels.includes(params.model) && auditableActions.includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        tenantId: context.tenantId,
        action: params.action,
        model: params.model,
        recordId: result.id,
        oldValues: params.action === 'update' ? await getOldValues() : null,
        newValues: JSON.stringify(params.args.data),
        ipAddress: context.ip,
        userAgent: context.userAgent,
        timestamp: new Date(),
      },
    });
  }

  return result;
});
```

**Modelo de auditoría:**

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  tenantId   String
  action     String   // create, update, delete
  model      String   // Nombre del modelo
  recordId   String
  oldValues  Json?
  newValues  Json?
  ipAddress  String
  userAgent  String?
  timestamp  DateTime @default(now())

  @@index([tenantId, timestamp])
  @@index([model, recordId])
}
```

**Retención:** 5 años (configurable en política de backup)
