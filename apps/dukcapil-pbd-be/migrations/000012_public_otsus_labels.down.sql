DROP INDEX IF EXISTS labelisasi_otsus_public_list_idx;
ALTER TABLE labelisasi_otsus DROP COLUMN IF EXISTS is_public;
