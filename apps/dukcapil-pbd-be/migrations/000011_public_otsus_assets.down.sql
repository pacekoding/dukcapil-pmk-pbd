DROP INDEX IF EXISTS labelisasi_otsus_public_filter_idx;
ALTER TABLE versi_dpa_otsus DROP COLUMN IF EXISTS is_public;
ALTER TABLE lpj_otsus DROP COLUMN IF EXISTS is_public;
ALTER TABLE dokumentasi_otsus DROP COLUMN IF EXISTS is_public;
ALTER TABLE labelisasi_otsus DROP COLUMN IF EXISTS kabupaten_kota;
