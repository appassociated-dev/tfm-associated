> **Categoría:** 3. Rendimiento

### 3.4 RNFT-018: Operaciones Masivas con Batch

**RNF Base:** RNF-018 (Rendimiento de Operaciones Masivas)

**Procesamiento batch con Prisma:**

```typescript
// remittance.service.ts
async generateRemittance(memberIds: string[]): Promise<SepaRemittance> {
  const BATCH_SIZE = 100;
  const results = [];

  for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
    const batch = memberIds.slice(i, i + BATCH_SIZE);

    const batchResults = await this.prisma.$transaction(
      batch.map(id =>
        this.prisma.transaction.create({
          data: { memberId: id, type: 'FEE', ... }
        })
      )
    );

    results.push(...batchResults);

    // Reportar progreso
    await this.progressService.update(i / memberIds.length * 100);
  }

  return this.buildRemittanceXml(results);
}
```

**Tiempos objetivo:**

| Operación         | Volumen        | Tiempo máximo |
| ----------------- | -------------- | ------------- |
| Remesa SEPA       | 500 members    | < 30s         |
| Importación CSV   | 500 registros  | < 60s         |
| Generación cuotas | 500 members    | < 30s         |
| Exportación Excel | 1000 registros | < 15s         |

**Procesamiento asíncrono con Bull (para operaciones > 30s):**

```typescript
// queue.processor.ts
@Processor('massive-operations')
export class MassiveOperationsProcessor {
  @Process('generate-remesa')
  async handleRemesa(job: Job<RemesaJobData>) {
    const { tenantId, fiscalYearId } = job.data;
    // Proceso largo con reportes de progreso
    await job.progress(50);
    // ...
  }
}
```
