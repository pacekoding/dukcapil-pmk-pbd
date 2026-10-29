ALTER TABLE labelisasi_otsus
  ADD COLUMN sumber_dana VARCHAR(16) NOT NULL DEFAULT 'SG_1_25';

ALTER TABLE labelisasi_otsus
  ADD CONSTRAINT labelisasi_otsus_sumber_dana_check
  CHECK (sumber_dana IN ('SG_1_25', 'BG_1'));
