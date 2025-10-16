/*
  Warnings:

  - Added the required column `updatedAt` to the `AktaKelahiran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AktaKematian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SuratKehilangan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AktaKelahiran" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AktaKematian" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SuratKehilangan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
