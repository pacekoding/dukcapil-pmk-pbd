DROP INDEX IF EXISTS idx_arsip_pegawai_photo_file;

ALTER TABLE arsip_pegawai
  DROP CONSTRAINT IF EXISTS arsip_pegawai_photo_file_fk;

ALTER TABLE arsip_pegawai
  DROP COLUMN IF EXISTS photo_file_id;
