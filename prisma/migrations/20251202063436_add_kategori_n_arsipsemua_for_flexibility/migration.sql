/*
  Warnings:

  - You are about to drop the column `arsipId` on the `ArsipFile` table. All the data in the column will be lost.
  - You are about to drop the `Arsip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Arsip" DROP CONSTRAINT "Arsip_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Arsip" DROP CONSTRAINT "Arsip_idKategori_fkey";

-- DropForeignKey
ALTER TABLE "public"."ArsipFile" DROP CONSTRAINT "ArsipFile_arsipId_fkey";

-- AlterTable
ALTER TABLE "ArsipFile" DROP COLUMN "arsipId",
ADD COLUMN     "arsipSemuaId" INTEGER;

-- DropTable
DROP TABLE "public"."Arsip";

-- CreateTable
CREATE TABLE "ArsipSemua" (
    "id" SERIAL NOT NULL,
    "idKategori" INTEGER NOT NULL,
    "no" TEXT NOT NULL,
    "noEnc" TEXT,
    "noHash" TEXT,
    "nama" TEXT,
    "tanggal" TIMESTAMP(3),
    "noFisik" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArsipSemua_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArsipSemua_noHash_key" ON "ArsipSemua"("noHash");

-- AddForeignKey
ALTER TABLE "ArsipSemua" ADD CONSTRAINT "ArsipSemua_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipSemua" ADD CONSTRAINT "ArsipSemua_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_arsipSemuaId_fkey" FOREIGN KEY ("arsipSemuaId") REFERENCES "ArsipSemua"("id") ON DELETE SET NULL ON UPDATE CASCADE;
