# Tests de integración - BC-Identity (UC-001)

## Requisitos previos

1. **PostgreSQL** corriendo (Docker Compose):

   ```bash
   docker compose up -d postgres
   ```

2. **Prisma clients** generados:

   ```bash
   npm run prisma:generate -w api
   ```

3. **Migraciones** aplicadas en `associated_main`:
   ```bash
   npm run prisma:migrate:main -w api
   ```

## Ejecutar tests de integración

```bash
# Solo tests de integración
npm run test:integration -w api

# Todos los tests (unitarios + integración)
npm run test -w api
```

## Variables de entorno

| Variable            | Default                                                                 | Descripción                       |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| `DATABASE_MAIN_URL` | `postgresql://associated:associated_dev@localhost:5432/associated_main` | URL de conexión a la BD principal |

## Comportamiento

- Si PostgreSQL no está disponible, los tests se **saltan** automáticamente (no fallan).
- Cada test crea recursos reales (BD, usuarios PG, roles) y los **limpia** al finalizar.
- Los tests tienen timeout de 60 segundos por caso (operaciones DDL pueden ser lentas).

## Escenarios cubiertos

1. **Happy path**: Provisión completa con BD aislada, roles y admin
2. **CIF duplicado**: Rechazo antes de crear BD
3. **Rollback ante fallo**: Compensación limpia de recursos
4. **Permisos PostgreSQL**: Usuario del tenant sin acceso a `associated_main`
5. **Roles predefinidos**: 5 roles de sistema con permisos correctos
