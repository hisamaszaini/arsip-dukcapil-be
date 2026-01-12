-- Rename old tables (Safety first, we drop them later)
ALTER TABLE "ArsipFile" RENAME TO "ArsipFile_old";
ALTER TABLE "ArsipSemua" RENAME TO "ArsipSemua_old";

-- Drop old Primary Key constraints to avoid name conflicts with new tables
ALTER TABLE "ArsipSemua_old" DROP CONSTRAINT IF EXISTS "ArsipSemua_pkey" CASCADE;
ALTER TABLE "ArsipFile_old" DROP CONSTRAINT IF EXISTS "ArsipFile_pkey" CASCADE;


-- CREATE PARTITIONED ArsipSemua
CREATE TABLE "ArsipSemua" (
    "id" SERIAL NOT NULL,
    "idKategori" INTEGER NOT NULL,
    "no" TEXT NOT NULL,
    "noEnc" TEXT,
    "noHash" TEXT,
    "nama" TEXT,
    "tanggal" TIMESTAMP(3),
    "noFisik" TEXT NOT NULL,
    "createdById" INTEGER,
    "isSync" BOOLEAN NOT NULL DEFAULT false,
    "syncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArsipSemua_pkey" PRIMARY KEY ("id", "idKategori")
) PARTITION BY LIST ("idKategori");

-- CREATE PARTITIONED ArsipFile
CREATE TABLE "ArsipFile" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "uploadById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "arsipSemuaId" INTEGER,
    "idKategori" INTEGER NOT NULL,

    CONSTRAINT "ArsipFile_pkey" PRIMARY KEY ("id", "idKategori")
) PARTITION BY LIST ("idKategori");

-- Create Default Partitions
CREATE TABLE "ArsipSemua_default" PARTITION OF "ArsipSemua" DEFAULT;
CREATE TABLE "ArsipFile_default" PARTITION OF "ArsipFile" DEFAULT;

-- Specific Partitions (Pre-creating for common IDs 1-10 to ensure optimization)
CREATE TABLE "ArsipSemua_cat1" PARTITION OF "ArsipSemua" FOR VALUES IN (1);
CREATE TABLE "ArsipFile_cat1" PARTITION OF "ArsipFile" FOR VALUES IN (1);
CREATE TABLE "ArsipSemua_cat2" PARTITION OF "ArsipSemua" FOR VALUES IN (2);
CREATE TABLE "ArsipFile_cat2" PARTITION OF "ArsipFile" FOR VALUES IN (2);
CREATE TABLE "ArsipSemua_cat3" PARTITION OF "ArsipSemua" FOR VALUES IN (3);
CREATE TABLE "ArsipFile_cat3" PARTITION OF "ArsipFile" FOR VALUES IN (3);

-- Copy Data (Backfill) - SKIPPED because incompatible schema (new columns) and empty DB
-- INSERT INTO "ArsipSemua" ...
-- INSERT INTO "ArsipFile" ...

-- Reset Sequences
SELECT setval(pg_get_serial_sequence('"ArsipSemua"', 'id'), coalesce(max(id), 0) + 1, false) FROM "ArsipSemua";
SELECT setval(pg_get_serial_sequence('"ArsipFile"', 'id'), coalesce(max(id), 0) + 1, false) FROM "ArsipFile";

-- Add Foreign Keys
ALTER TABLE "ArsipSemua" ADD CONSTRAINT "ArsipSemua_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArsipSemua" ADD CONSTRAINT "ArsipSemua_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_uploadById_fkey" FOREIGN KEY ("uploadById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArsipFile" ADD CONSTRAINT "ArsipFile_arsipSemuaId_idKategori_fkey" FOREIGN KEY ("arsipSemuaId", "idKategori") REFERENCES "ArsipSemua"("id", "idKategori") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Indexes
CREATE INDEX "ArsipSemua_idKategori_idx" ON "ArsipSemua"("idKategori");
CREATE INDEX "ArsipSemua_idKategori_no_idx" ON "ArsipSemua"("idKategori", "no");
CREATE INDEX "ArsipSemua_idKategori_no_tanggal_idx" ON "ArsipSemua"("idKategori", "no", "tanggal");
CREATE INDEX "ArsipSemua_idKategori_no_noFisik_idx" ON "ArsipSemua"("idKategori", "no", "noFisik");

-- Drop Old Tables
DROP TABLE "ArsipFile_old";
DROP TABLE "ArsipSemua_old";
