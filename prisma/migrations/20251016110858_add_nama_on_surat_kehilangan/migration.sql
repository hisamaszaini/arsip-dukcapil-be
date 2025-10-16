/*
  Warnings:

  - Added the required column `nama` to the `SuratKehilangan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SuratKehilangan" ADD COLUMN     "nama" TEXT NOT NULL;
