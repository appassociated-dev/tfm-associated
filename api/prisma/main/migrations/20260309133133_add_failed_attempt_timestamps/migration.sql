-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_attempt_timestamps" JSONB NOT NULL DEFAULT '[]';
