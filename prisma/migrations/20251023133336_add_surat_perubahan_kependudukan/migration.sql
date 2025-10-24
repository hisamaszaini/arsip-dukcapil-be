-- CreateTable
CREATE TABLE "SuratPerubahanKependudukan" (
    "id" SERIAL NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "filePerubahan" TEXT NOT NULL,
    "fileKk" TEXT NOT NULL,
    "fileLampiran" TEXT,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratPerubahanKependudukan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuratPerubahanKependudukan_nik_key" ON "SuratPerubahanKependudukan"("nik");

-- CreateIndex
CREATE INDEX "SuratPerubahanKependudukan_createdAt_idx" ON "SuratPerubahanKependudukan"("createdAt");

-- CreateIndex
CREATE INDEX "SuratPerubahanKependudukan_createdById_idx" ON "SuratPerubahanKependudukan"("createdById");

-- AddForeignKey
ALTER TABLE "SuratPerubahanKependudukan" ADD CONSTRAINT "SuratPerubahanKependudukan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
