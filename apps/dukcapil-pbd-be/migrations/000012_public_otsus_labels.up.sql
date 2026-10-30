ALTER TABLE labelisasi_otsus
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS labelisasi_otsus_public_list_idx
  ON labelisasi_otsus (is_public, tahun_anggaran, updated_at DESC);
