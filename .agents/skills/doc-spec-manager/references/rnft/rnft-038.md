> **Categoría:** 4. Disponibilidad y Continuidad

### 4.2 RNFT-038: Backups PostgreSQL

**RNF Base:** RNF-038 (Copias de Seguridad)

**Script de backup automatizado:**

```bash
#!/bin/bash
# backup.sh - Ejecutado diariamente via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# Backup de cada tenant DB
for db in $(psql -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'associated_%'"); do
  pg_dump -Fc $db > $BACKUP_DIR/${db}_${DATE}.dump
done

# Backup de DB principal
pg_dump -Fc associated_main > $BACKUP_DIR/main_${DATE}.dump

# Subir a S3
aws s3 sync $BACKUP_DIR s3://associated-backups/ --delete

# Limpiar backups locales > 7 días
find $BACKUP_DIR -mtime +7 -delete
```

**Política de retención:**

| Tipo | Frecuencia | Retención |
|------|------------|-----------|
| Diario | 00:00 UTC | 30 días |
| Semanal | Domingo | 12 semanas |
| Mensual | Día 1 | 12 meses |

**Verificación:** Test de restauración trimestral documentado.
