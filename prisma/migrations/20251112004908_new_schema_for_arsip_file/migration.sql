-- AlterTable
ALTER TABLE "ArsipFile" ADD COLUMN     "uploadById" INTEGER;

-- AddForeignKey
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_uploadById_fkey" FOREIGN KEY ("uploadById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
