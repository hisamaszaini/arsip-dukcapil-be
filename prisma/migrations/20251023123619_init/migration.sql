-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "StatusUser" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "statusUser" "StatusUser" NOT NULL DEFAULT 'ACTIVE',
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktaKematian" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "fileSuratKematian" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "fileLampiran" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AktaKematian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktaKelahiran" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "fileSuratKelahiran" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "fileSuratNikah" TEXT NOT NULL,
    "fileSPTJMKelahiran" TEXT NOT NULL,
    "fileSPTJMPernikahan" TEXT NOT NULL,
    "fileLampiran" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AktaKelahiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKehilangan" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratKehilangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratPermohonanPindah" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "filePmhnPindah" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratPermohonanPindah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AktaKematian_nik_key" ON "AktaKematian"("nik");

-- CreateIndex
CREATE INDEX "AktaKematian_createdAt_idx" ON "AktaKematian"("createdAt");

-- CreateIndex
CREATE INDEX "AktaKematian_createdById_idx" ON "AktaKematian"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "AktaKelahiran_nik_key" ON "AktaKelahiran"("nik");

-- CreateIndex
CREATE INDEX "AktaKelahiran_createdAt_idx" ON "AktaKelahiran"("createdAt");

-- CreateIndex
CREATE INDEX "AktaKelahiran_createdById_idx" ON "AktaKelahiran"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKehilangan_nik_key" ON "SuratKehilangan"("nik");

-- CreateIndex
CREATE INDEX "SuratKehilangan_createdAt_idx" ON "SuratKehilangan"("createdAt");

-- CreateIndex
CREATE INDEX "SuratKehilangan_createdById_idx" ON "SuratKehilangan"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SuratPermohonanPindah_nik_key" ON "SuratPermohonanPindah"("nik");

-- CreateIndex
CREATE INDEX "SuratPermohonanPindah_createdAt_idx" ON "SuratPermohonanPindah"("createdAt");

-- CreateIndex
CREATE INDEX "SuratPermohonanPindah_createdById_idx" ON "SuratPermohonanPindah"("createdById");

-- AddForeignKey
ALTER TABLE "AktaKematian" ADD CONSTRAINT "AktaKematian_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktaKelahiran" ADD CONSTRAINT "AktaKelahiran_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKehilangan" ADD CONSTRAINT "SuratKehilangan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratPermohonanPindah" ADD CONSTRAINT "SuratPermohonanPindah_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
