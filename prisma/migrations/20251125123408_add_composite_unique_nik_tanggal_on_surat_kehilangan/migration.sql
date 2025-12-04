/*
  Warnings:

  - A unique constraint covering the columns `[nik,tanggal]` on the table `SuratKehilangan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SuratKehilangan_nik_tanggal_key" ON "SuratKehilangan"("nik", "tanggal");
