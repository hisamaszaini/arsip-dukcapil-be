/*
  Warnings:

  - A unique constraint covering the columns `[noAktaHash]` on the table `AktaKelahiran` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[noAktaHash]` on the table `AktaKematian` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nikHash]` on the table `SuratKehilangan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nikHash]` on the table `SuratPermohonanPindah` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nikHash]` on the table `SuratPerubahanKependudukan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AktaKelahiran" ADD COLUMN     "noAktaEnc" TEXT,
ADD COLUMN     "noAktaHash" TEXT;

-- AlterTable
ALTER TABLE "AktaKematian" ADD COLUMN     "noAktaEnc" TEXT,
ADD COLUMN     "noAktaHash" TEXT;

-- AlterTable
ALTER TABLE "SuratKehilangan" ADD COLUMN     "nikEnc" TEXT,
ADD COLUMN     "nikHash" TEXT;

-- AlterTable
ALTER TABLE "SuratPermohonanPindah" ADD COLUMN     "nikEnc" TEXT,
ADD COLUMN     "nikHash" TEXT;

-- AlterTable
ALTER TABLE "SuratPerubahanKependudukan" ADD COLUMN     "nikEnc" TEXT,
ADD COLUMN     "nikHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AktaKelahiran_noAktaHash_key" ON "AktaKelahiran"("noAktaHash");

-- CreateIndex
CREATE UNIQUE INDEX "AktaKematian_noAktaHash_key" ON "AktaKematian"("noAktaHash");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKehilangan_nikHash_key" ON "SuratKehilangan"("nikHash");

-- CreateIndex
CREATE UNIQUE INDEX "SuratPermohonanPindah_nikHash_key" ON "SuratPermohonanPindah"("nikHash");

-- CreateIndex
CREATE UNIQUE INDEX "SuratPerubahanKependudukan_nikHash_key" ON "SuratPerubahanKependudukan"("nikHash");
