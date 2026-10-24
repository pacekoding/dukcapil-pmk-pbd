BEGIN;
-- Preserve the latest labels before removing relationships on rollback.
UPDATE arsip_pegawai p SET bidang = b.name FROM organisasi_bidang b WHERE p.bidang_id = b.id;
UPDATE arsip_pegawai p SET unit = s.name FROM organisasi_seksi s WHERE p.seksi_id = s.id;
UPDATE arsip_pegawai p SET jabatan = j.name FROM organisasi_jabatan j WHERE p.jabatan_id = j.id;
ALTER TABLE arsip_pegawai DROP COLUMN jabatan_id, DROP COLUMN seksi_id, DROP COLUMN bidang_id;
DROP TABLE organisasi_jabatan;
DROP TABLE organisasi_seksi;
DROP TABLE organisasi_bidang;
COMMIT;
