ALTER TABLE labelisasi_otsus
  DROP CONSTRAINT IF EXISTS labelisasi_otsus_sumber_dana_check;

ALTER TABLE labelisasi_otsus
  DROP COLUMN IF EXISTS sumber_dana;
