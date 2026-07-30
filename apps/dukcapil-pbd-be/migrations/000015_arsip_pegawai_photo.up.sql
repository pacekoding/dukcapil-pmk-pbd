ALTER TABLE arsip_pegawai
  ADD COLUMN IF NOT EXISTS photo_file_id BIGINT;

ALTER TABLE arsip_pegawai
  ADD CONSTRAINT arsip_pegawai_photo_file_fk
  FOREIGN KEY (photo_file_id) REFERENCES stored_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_arsip_pegawai_photo_file
  ON arsip_pegawai (photo_file_id);
