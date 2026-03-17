-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "database_password_encrypted" TEXT,
ADD COLUMN     "database_user" VARCHAR(100);
