/*
  Warnings:

  - You are about to drop the column `created_at` on the `outbox_events` table. All the data in the column will be lost.
  - You are about to drop the column `last_error` on the `outbox_events` table. All the data in the column will be lost.
  - You are about to drop the column `next_retry_at` on the `outbox_events` table. All the data in the column will be lost.
  - You are about to drop the column `processed_at` on the `outbox_events` table. All the data in the column will be lost.
  - You are about to drop the column `retry_count` on the `outbox_events` table. All the data in the column will be lost.
  - Added the required column `aggregate_id` to the `outbox_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aggregate_type` to the `outbox_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bounded_context` to the `outbox_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "outbox_events_processed_at_retry_count_next_retry_at_idx";

-- AlterTable
ALTER TABLE "outbox_events" DROP COLUMN "created_at",
DROP COLUMN "last_error",
DROP COLUMN "next_retry_at",
DROP COLUMN "processed_at",
DROP COLUMN "retry_count",
ADD COLUMN     "actor_id" UUID,
ADD COLUMN     "aggregate_id" UUID NOT NULL,
ADD COLUMN     "aggregate_type" VARCHAR(100) NOT NULL,
ADD COLUMN     "bounded_context" VARCHAR(100) NOT NULL,
ADD COLUMN     "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_id_occurred_at_idx" ON "outbox_events"("aggregate_id", "occurred_at");

-- CreateIndex
CREATE INDEX "outbox_events_bounded_context_idx" ON "outbox_events"("bounded_context");

-- CreateIndex
CREATE INDEX "outbox_events_occurred_at_idx" ON "outbox_events"("occurred_at");
