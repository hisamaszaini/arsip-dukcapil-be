-- CreateEnum
CREATE TYPE "UniqueConstraintType" AS ENUM ('NONE', 'NO', 'NO_TANGGAL', 'NO_NOFISIK');

-- AlterTable
ALTER TABLE "Kategori" ADD COLUMN     "isEncrypt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uniqueConstraint" "UniqueConstraintType" NOT NULL DEFAULT 'NONE';
