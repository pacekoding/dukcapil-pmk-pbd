ALTER TABLE arsip_pegawai
  ADD COLUMN IF NOT EXISTS tempat_lahir TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
  ADD COLUMN IF NOT EXISTS bidang TEXT NOT NULL DEFAULT '';

ALTER TABLE arsip_pegawai
  DROP CONSTRAINT IF EXISTS arsip_pegawai_status_check;

ALTER TABLE arsip_pegawai
  ADD CONSTRAINT arsip_pegawai_status_check
  CHECK (status IN ('Aktif', 'Nonaktif', 'Cuti', 'Mutasi'));

CREATE INDEX IF NOT EXISTS idx_arsip_pegawai_bidang
  ON arsip_pegawai (LOWER(bidang));
