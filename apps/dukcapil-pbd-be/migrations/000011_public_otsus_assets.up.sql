ALTER TABLE labelisasi_otsus
  ADD COLUMN IF NOT EXISTS kabupaten_kota TEXT NOT NULL DEFAULT '';

ALTER TABLE dokumentasi_otsus
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE lpj_otsus
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE versi_dpa_otsus
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS labelisasi_otsus_public_filter_idx
  ON labelisasi_otsus (tahun_anggaran, sumber_dana, status, kabupaten_kota);
