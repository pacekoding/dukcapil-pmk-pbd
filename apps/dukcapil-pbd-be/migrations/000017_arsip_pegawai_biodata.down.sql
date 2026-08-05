DROP INDEX IF EXISTS idx_arsip_pegawai_bidang;

UPDATE arsip_pegawai
SET status = 'Aktif'
WHERE status = 'Nonaktif';

ALTER TABLE arsip_pegawai
  DROP CONSTRAINT IF EXISTS arsip_pegawai_status_check;

ALTER TABLE arsip_pegawai
  ADD CONSTRAINT arsip_pegawai_status_check
  CHECK (status IN ('Aktif', 'Cuti', 'Mutasi'));

ALTER TABLE arsip_pegawai
  DROP COLUMN IF EXISTS bidang,
  DROP COLUMN IF EXISTS tanggal_lahir,
  DROP COLUMN IF EXISTS tempat_lahir;
