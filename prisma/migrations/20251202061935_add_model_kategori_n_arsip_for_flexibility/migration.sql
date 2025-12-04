-- AlterTable
ALTER TABLE "ArsipFile" ADD COLUMN     "arsipId" INTEGER;

-- CreateTable
CREATE TABLE "Kategori" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "formNo" TEXT NOT NULL,
    "rulesFormNo" BOOLEAN NOT NULL,
    "rulesFormNama" BOOLEAN NOT NULL,
    "rulesFormTanggal" BOOLEAN NOT NULL,
    "maxFile" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arsip" (
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

    CONSTRAINT "Arsip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_name_key" ON "Kategori"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_slug_key" ON "Kategori"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Arsip_noHash_key" ON "Arsip"("noHash");

-- AddForeignKey
ALTER TABLE "Arsip" ADD CONSTRAINT "Arsip_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arsip" ADD CONSTRAINT "Arsip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_arsipId_fkey" FOREIGN KEY ("arsipId") REFERENCES "Arsip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
