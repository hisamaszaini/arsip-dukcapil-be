-- AlterTable
ALTER TABLE "AktaKelahiran" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "AktaKematian" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "SuratKehilangan" ADD COLUMN     "createdById" INTEGER;

-- CreateIndex
CREATE INDEX "AktaKelahiran_createdAt_idx" ON "AktaKelahiran"("createdAt");

-- CreateIndex
CREATE INDEX "AktaKelahiran_createdById_idx" ON "AktaKelahiran"("createdById");

-- CreateIndex
CREATE INDEX "AktaKematian_createdAt_idx" ON "AktaKematian"("createdAt");

-- CreateIndex
CREATE INDEX "AktaKematian_createdById_idx" ON "AktaKematian"("createdById");

-- CreateIndex
CREATE INDEX "SuratKehilangan_createdAt_idx" ON "SuratKehilangan"("createdAt");

-- CreateIndex
CREATE INDEX "SuratKehilangan_createdById_idx" ON "SuratKehilangan"("createdById");

-- AddForeignKey
ALTER TABLE "AktaKematian" ADD CONSTRAINT "AktaKematian_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktaKelahiran" ADD CONSTRAINT "AktaKelahiran_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKehilangan" ADD CONSTRAINT "SuratKehilangan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
