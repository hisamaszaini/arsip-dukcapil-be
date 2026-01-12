# PostgreSQL Partitioning Guide for ASPAL

This database uses **Native PostgreSQL Partitioning** (List Partitioning) on the `ArsipSemua` and `ArsipFile` tables.
The partition key is `idKategori`.

## Current Structure
-   **ArsipSemua**: Parent table for metadata.
-   **ArsipFile**: Parent table for file paths.
-   **Partitions**:
    -   `_default`: Stores data for any category ID that doesn't have a specific partition.
    -   `_cat1`, `_cat2`, `_cat3`: Dedicated partitions for these category IDs.

## How to Add a New Partition
If you create a new Category (e.g., ID `4`) and expect it to hold **Millions** of records, you should create a dedicated partition for it.

**Run this SQL in your database tool (PgAdmin, DBeaver, or psql):**

```sql
-- 1. Create partition for ArsipSemua (Metadata)
CREATE TABLE "ArsipSemua_cat4" 
PARTITION OF "ArsipSemua" 
FOR VALUES IN (4);

-- 2. Create partition for ArsipFile (Files)
CREATE TABLE "ArsipFile_cat4" 
PARTITION OF "ArsipFile" 
FOR VALUES IN (4);
```

### What happens if I forget?
Nothing breaks! The data will simply go into the `_default` partition.
However, if `_default` grows too large (e.g., > 10 million rows mixed from many categories), queries might become slightly slower compared to dedicated partitions.

## Checking Partitions
To see existing partitions and their sizes:

```sql
SELECT
    nmsp_parent.nspname AS parent_schema,
    parent.relname      AS parent,
    nmsp_child.nspname  AS child_schema,
    child.relname       AS child
FROM pg_inherits
JOIN pg_class parent            ON pg_inherits.inhparent = parent.oid
JOIN pg_class child             ON pg_inherits.inhrelid   = child.oid
JOIN pg_namespace nmsp_parent   ON nmsp_parent.oid  = parent.relnamespace
JOIN pg_namespace nmsp_child    ON nmsp_child.oid   = child.relnamespace
WHERE parent.relname IN ('ArsipSemua', 'ArsipFile');
```
