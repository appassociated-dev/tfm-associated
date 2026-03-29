-- AlterTable: añade processing_started_at para stale recovery correcta (FIX-1)
-- Un evento puede estar en 'pending' durante horas antes de ser recogido.
-- Comparar createdAt contra el umbral de 5min causaba resets prematuros.
-- Ahora se compara processingStartedAt (seteado al transicionar a 'processing').
ALTER TABLE "outbox_events" ADD COLUMN "processing_started_at" TIMESTAMPTZ;

-- Backfill: filas en 'processing' previas a esta migración tienen processing_started_at NULL.
-- La recuperación de stale usa WHERE processing_started_at < umbral — NULL nunca satisface esa condición.
-- Para evitar que queden atascadas permanentemente, se usa created_at como aproximación.
UPDATE "outbox_events" SET "processing_started_at" = "created_at" WHERE "status" = 'processing' AND "processing_started_at" IS NULL;
