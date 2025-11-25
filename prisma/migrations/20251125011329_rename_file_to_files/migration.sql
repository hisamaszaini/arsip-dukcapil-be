/*
  Warnings:

  - You are about to drop the column `file` on the `SuratKehilangan` table. All the data in the column will be lost.
  - Added the required column `files` to the `SuratKehilangan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SuratKehilangan" RENAME COLUMN "file" TO "files";
