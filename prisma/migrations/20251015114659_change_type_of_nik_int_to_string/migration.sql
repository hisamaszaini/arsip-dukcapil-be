/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `AktaKelahiran` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nik]` on the table `AktaKematian` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nik]` on the table `SuratKehilangan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AktaKelahiran" ALTER COLUMN "nik" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "AktaKematian" ALTER COLUMN "nik" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SuratKehilangan" ALTER COLUMN "nik" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AktaKelahiran_nik_key" ON "AktaKelahiran"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "AktaKematian_nik_key" ON "AktaKematian"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKehilangan_nik_key" ON "SuratKehilangan"("nik");
