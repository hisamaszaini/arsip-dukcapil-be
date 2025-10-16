-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "StatusUser" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
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
    "nik" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "fileSuratKematian" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "fileLampiran" TEXT,

    CONSTRAINT "AktaKematian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktaKelahiran" (
    "id" SERIAL NOT NULL,
    "nik" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "fileSuratKelahiran" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "fileSuratNikah" TEXT NOT NULL,
    "fileSPTJMKelahiran" TEXT NOT NULL,
    "fileSPTJMPernikahan" TEXT NOT NULL,
    "fileLampiran" TEXT,

    CONSTRAINT "AktaKelahiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKehilangan" (
    "id" SERIAL NOT NULL,
    "nik" INTEGER NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "SuratKehilangan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
