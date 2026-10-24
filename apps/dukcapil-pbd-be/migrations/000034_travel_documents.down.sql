BEGIN;
-- Explicit rollback removes travel documents; back up before invoking down.
DROP TABLE spd;
DROP TABLE surat_tugas_pelaksana;
DROP TABLE surat_tugas;
COMMIT;
