-- CreateEnum
CREATE TYPE "NoType" AS ENUM ('NUMERIC', 'ALPHANUMERIC', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "public"."ArsipFile" DROP CONSTRAINT "ArsipFile_arsipSemuaId_fkey";

-- AlterTable
ALTER TABLE "Kategori" ADD COLUMN     "noFormat" TEXT,
ADD COLUMN     "noMask" TEXT,
ADD COLUMN     "noMaxLength" INTEGER,
ADD COLUMN     "noMinLength" INTEGER,
ADD COLUMN     "noPrefix" TEXT,
ADD COLUMN     "noRegex" TEXT,
ADD COLUMN     "noType" "NoType" NOT NULL DEFAULT 'ALPHANUMERIC';

-- AddForeignKey
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_arsipSemuaId_fkey" FOREIGN KEY ("arsipSemuaId") REFERENCES "ArsipSemua"("id") ON DELETE CASCADE ON UPDATE CASCADE;
