/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `AktaKematian` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AktaKematian" ADD COLUMN     "nik" TEXT,
ALTER COLUMN "noAkta" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AktaKematian_nik_key" ON "AktaKematian"("nik");
